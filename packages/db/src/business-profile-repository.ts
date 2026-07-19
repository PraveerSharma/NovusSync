import { createHash } from "node:crypto";

import { and, asc, eq } from "drizzle-orm";

import type {
  AuthenticatedActorContext,
  BusinessProfileDraftRepositoryPort,
} from "@novussync/application";
import {
  restoreBusinessProfileDraft,
  type BusinessProfileDraft,
  type BusinessProfilePlaybook,
  type BusinessProfileTenant,
} from "@novussync/domain";

import type { Database } from "./client.ts";
import {
  auditEvents,
  businessProfileDrafts,
  businessProfileDraftVersions,
  idempotencyRecords,
} from "./schema.ts";
import { withTenantTransaction } from "./tenant-transaction.ts";

export const BUSINESS_PROFILE_PERSISTENCE_ERROR_CODES = [
  "not_found",
  "version_conflict",
  "idempotency_conflict",
  "idempotency_in_progress",
  "invalid_context",
] as const;

export type BusinessProfilePersistenceErrorCode =
  (typeof BUSINESS_PROFILE_PERSISTENCE_ERROR_CODES)[number];

export class BusinessProfilePersistenceError extends Error {
  override readonly name = "BusinessProfilePersistenceError";
  readonly code: BusinessProfilePersistenceErrorCode;

  constructor(code: BusinessProfilePersistenceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface BusinessProfileDraftRepository extends BusinessProfileDraftRepositoryPort {
  listVersions(
    context: AuthenticatedActorContext,
    tenant: BusinessProfileTenant,
    profileId: string,
    playbook: BusinessProfilePlaybook,
  ): Promise<readonly BusinessProfileDraft[]>;
}

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type DraftRow = typeof businessProfileDrafts.$inferSelect;
type VersionRow = typeof businessProfileDraftVersions.$inferSelect;

export function createBusinessProfileDraftRepository(
  database: Database,
): BusinessProfileDraftRepository {
  const repository: BusinessProfileDraftRepository = {
    async findById(context, tenant, profileId, playbook) {
      assertContextTenant(context, tenant);
      return withTenantTransaction(database, tenant, async (transaction) => {
        const rows = await transaction
          .select()
          .from(businessProfileDrafts)
          .where(profileWhere(tenant, profileId))
          .limit(1);
        return rows[0] ? mapDraftRow(rows[0], playbook) : null;
      });
    },

    async create(context, draft, playbook, idempotencyKey) {
      assertContextTenant(context, draft.tenant);
      return withTenantTransaction(database, draft.tenant, async (transaction) => {
        const requestHash = hashRequest({ action: "create", draft });
        const replayVersion = await claimIdempotency(
          transaction,
          draft.tenant,
          "business_profile.create",
          idempotencyKey,
          requestHash,
          draft.updatedAt,
        );
        if (replayVersion !== null) {
          return requireVersion(
            transaction,
            draft.tenant,
            draft.profileId,
            replayVersion,
            playbook,
          );
        }

        const existing = await transaction
          .select({ version: businessProfileDrafts.version })
          .from(businessProfileDrafts)
          .where(profileWhere(draft.tenant, draft.profileId))
          .limit(1);
        if (existing[0]) {
          throw new BusinessProfilePersistenceError(
            "version_conflict",
            "A business profile already exists for this identity.",
          );
        }

        await transaction.insert(businessProfileDrafts).values(toDraftInsert(draft));
        await insertVersion(transaction, draft, idempotencyKey);
        await insertAuditEvent(transaction, context, draft, idempotencyKey, "created", []);
        await completeIdempotency(
          transaction,
          draft.tenant,
          "business_profile.create",
          idempotencyKey,
          draft.profileId,
          draft.version,
          draft.updatedAt,
        );
        return draft;
      });
    },

    async revise(context, draft, playbook, expectedVersion, idempotencyKey) {
      assertContextTenant(context, draft.tenant);
      return withTenantTransaction(database, draft.tenant, async (transaction) => {
        const requestHash = hashRequest({ action: "revise", draft, expectedVersion });
        const replayVersion = await claimIdempotency(
          transaction,
          draft.tenant,
          "business_profile.revise",
          idempotencyKey,
          requestHash,
          draft.updatedAt,
        );
        if (replayVersion !== null) {
          return requireVersion(
            transaction,
            draft.tenant,
            draft.profileId,
            replayVersion,
            playbook,
          );
        }

        const currentRows = await transaction
          .select()
          .from(businessProfileDrafts)
          .where(profileWhere(draft.tenant, draft.profileId))
          .limit(1);
        const current = currentRows[0];
        if (!current) {
          throw new BusinessProfilePersistenceError("not_found", "Business profile not found.");
        }
        if (current.version !== expectedVersion || draft.version !== expectedVersion + 1) {
          throw new BusinessProfilePersistenceError(
            "version_conflict",
            "Business profile version changed before this revision was saved.",
          );
        }

        const changedFieldKeys = changedKeys(current.values, draft.values);
        const updated = await transaction
          .update(businessProfileDrafts)
          .set({
            values: { ...draft.values },
            version: draft.version,
            updatedAt: new Date(draft.updatedAt),
          })
          .where(
            and(
              profileWhere(draft.tenant, draft.profileId),
              eq(businessProfileDrafts.version, expectedVersion),
            ),
          )
          .returning({ version: businessProfileDrafts.version });
        if (!updated[0]) {
          throw new BusinessProfilePersistenceError(
            "version_conflict",
            "Business profile version changed before this revision was saved.",
          );
        }

        await insertVersion(transaction, draft, idempotencyKey);
        await insertAuditEvent(
          transaction,
          context,
          draft,
          idempotencyKey,
          "revised",
          changedFieldKeys,
        );
        await completeIdempotency(
          transaction,
          draft.tenant,
          "business_profile.revise",
          idempotencyKey,
          draft.profileId,
          draft.version,
          draft.updatedAt,
        );
        return draft;
      });
    },

    async listVersions(context, tenant, profileId, playbook) {
      assertContextTenant(context, tenant);
      return withTenantTransaction(database, tenant, async (transaction) => {
        const rows = await transaction
          .select()
          .from(businessProfileDraftVersions)
          .where(
            and(
              eq(businessProfileDraftVersions.organizationId, tenant.organizationId),
              eq(businessProfileDraftVersions.workspaceId, tenant.workspaceId),
              eq(businessProfileDraftVersions.profileId, profileId),
            ),
          )
          .orderBy(asc(businessProfileDraftVersions.version));
        return Object.freeze(rows.map((row) => mapVersionRow(row, playbook)));
      });
    },
  };

  return Object.freeze(repository);
}

async function claimIdempotency(
  transaction: Transaction,
  tenant: BusinessProfileTenant,
  scope: string,
  idempotencyKey: string,
  requestHash: string,
  now: string,
): Promise<number | null> {
  const timestamp = new Date(now);
  const inserted = await transaction
    .insert(idempotencyRecords)
    .values({
      organizationId: tenant.organizationId,
      workspaceId: tenant.workspaceId,
      scope,
      idempotencyKey,
      requestHash,
      status: "in_progress",
      expiresAt: new Date(timestamp.getTime() + 24 * 60 * 60 * 1000),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoNothing()
    .returning({ id: idempotencyRecords.id });
  if (inserted[0]) return null;

  const rows = await transaction
    .select()
    .from(idempotencyRecords)
    .where(idempotencyWhere(tenant, scope, idempotencyKey))
    .limit(1);
  const record = rows[0];
  if (!record || record.requestHash !== requestHash) {
    throw new BusinessProfilePersistenceError(
      "idempotency_conflict",
      "The idempotency key was already used for a different request.",
    );
  }
  if (record.status === "in_progress") {
    throw new BusinessProfilePersistenceError(
      "idempotency_in_progress",
      "The original profile operation is still in progress.",
    );
  }
  if (record.status !== "succeeded" || !record.resultReference) {
    throw new BusinessProfilePersistenceError(
      "idempotency_conflict",
      "The original profile operation cannot be replayed safely.",
    );
  }

  const separator = record.resultReference.lastIndexOf("@");
  const version = Number(record.resultReference.slice(separator + 1));
  if (separator < 1 || !Number.isInteger(version) || version < 1) {
    throw new BusinessProfilePersistenceError(
      "idempotency_conflict",
      "The stored profile operation reference is invalid.",
    );
  }
  return version;
}

async function completeIdempotency(
  transaction: Transaction,
  tenant: BusinessProfileTenant,
  scope: string,
  idempotencyKey: string,
  profileId: string,
  version: number,
  now: string,
): Promise<void> {
  await transaction
    .update(idempotencyRecords)
    .set({
      status: "succeeded",
      resultReference: `${profileId}@${version}`,
      updatedAt: new Date(now),
    })
    .where(idempotencyWhere(tenant, scope, idempotencyKey));
}

async function requireVersion(
  transaction: Transaction,
  tenant: BusinessProfileTenant,
  profileId: string,
  version: number,
  playbook: BusinessProfilePlaybook,
): Promise<BusinessProfileDraft> {
  const rows = await transaction
    .select()
    .from(businessProfileDraftVersions)
    .where(
      and(
        eq(businessProfileDraftVersions.organizationId, tenant.organizationId),
        eq(businessProfileDraftVersions.workspaceId, tenant.workspaceId),
        eq(businessProfileDraftVersions.profileId, profileId),
        eq(businessProfileDraftVersions.version, version),
      ),
    )
    .limit(1);
  if (!rows[0]) {
    throw new BusinessProfilePersistenceError(
      "idempotency_conflict",
      "The original profile result could not be reconciled.",
    );
  }
  return mapVersionRow(rows[0], playbook);
}

async function insertVersion(
  transaction: Transaction,
  draft: BusinessProfileDraft,
  idempotencyKey: string,
): Promise<void> {
  await transaction.insert(businessProfileDraftVersions).values({
    organizationId: draft.tenant.organizationId,
    workspaceId: draft.tenant.workspaceId,
    profileId: draft.profileId,
    playbookId: draft.playbook.id,
    playbookVersion: draft.playbook.version,
    values: { ...draft.values },
    version: draft.version,
    idempotencyKey,
    profileCreatedAt: new Date(draft.createdAt),
    occurredAt: new Date(draft.updatedAt),
  });
}

async function insertAuditEvent(
  transaction: Transaction,
  context: AuthenticatedActorContext,
  draft: BusinessProfileDraft,
  idempotencyKey: string,
  operation: "created" | "revised",
  changedFieldKeys: readonly string[],
): Promise<void> {
  await transaction.insert(auditEvents).values({
    organizationId: draft.tenant.organizationId,
    workspaceId: draft.tenant.workspaceId,
    actorType: context.actor.actorType,
    actorId: context.actor.actorType === "human" ? context.actor.id : null,
    action: `business_profile.draft_${operation}`,
    targetType: "business_profile_draft",
    targetId: draft.profileId,
    targetVersion: draft.version,
    correlationId: context.correlationId,
    idempotencyKey,
    policyResult: "allow",
    evidenceState: "unverified",
    safeMetadata: {
      playbookId: draft.playbook.id,
      playbookVersion: draft.playbook.version,
      changedFieldKeys,
    },
    occurredAt: new Date(draft.updatedAt),
  });
}

function mapDraftRow(row: DraftRow, playbook: BusinessProfilePlaybook): BusinessProfileDraft {
  return restoreBusinessProfileDraft({
    profileId: row.profileId,
    tenant: { organizationId: row.organizationId, workspaceId: row.workspaceId },
    playbook,
    values: row.values,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function mapVersionRow(row: VersionRow, playbook: BusinessProfilePlaybook): BusinessProfileDraft {
  return restoreBusinessProfileDraft({
    profileId: row.profileId,
    tenant: { organizationId: row.organizationId, workspaceId: row.workspaceId },
    playbook,
    values: row.values,
    version: row.version,
    createdAt: row.profileCreatedAt.toISOString(),
    updatedAt: row.occurredAt.toISOString(),
  });
}

function toDraftInsert(draft: BusinessProfileDraft) {
  return {
    organizationId: draft.tenant.organizationId,
    workspaceId: draft.tenant.workspaceId,
    profileId: draft.profileId,
    playbookId: draft.playbook.id,
    playbookVersion: draft.playbook.version,
    values: { ...draft.values },
    version: draft.version,
    createdAt: new Date(draft.createdAt),
    updatedAt: new Date(draft.updatedAt),
  };
}

function profileWhere(tenant: BusinessProfileTenant, profileId: string) {
  return and(
    eq(businessProfileDrafts.organizationId, tenant.organizationId),
    eq(businessProfileDrafts.workspaceId, tenant.workspaceId),
    eq(businessProfileDrafts.profileId, profileId),
  );
}

function idempotencyWhere(tenant: BusinessProfileTenant, scope: string, key: string) {
  return and(
    eq(idempotencyRecords.organizationId, tenant.organizationId),
    eq(idempotencyRecords.workspaceId, tenant.workspaceId),
    eq(idempotencyRecords.scope, scope),
    eq(idempotencyRecords.idempotencyKey, key),
  );
}

function assertContextTenant(
  context: AuthenticatedActorContext,
  tenant: BusinessProfileTenant,
): void {
  if (
    context.tenant.organizationId !== tenant.organizationId ||
    context.tenant.workspaceId !== tenant.workspaceId
  ) {
    throw new BusinessProfilePersistenceError(
      "invalid_context",
      "Authenticated context does not match the profile tenant.",
    );
  }
}

function hashRequest(value: unknown): string {
  return createHash("sha256").update(stableSerialize(value)).digest("hex");
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableSerialize(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

function changedKeys(
  current: Record<string, string | readonly string[]>,
  next: Readonly<Record<string, string | readonly string[]>>,
): readonly string[] {
  return Object.freeze(
    [...new Set([...Object.keys(current), ...Object.keys(next)])]
      .filter((key) => stableSerialize(current[key]) !== stableSerialize(next[key]))
      .sort(),
  );
}
