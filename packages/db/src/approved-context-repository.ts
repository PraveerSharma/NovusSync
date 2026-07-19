import { createHash } from "node:crypto";

import { and, desc, eq, inArray } from "drizzle-orm";

import type {
  ApprovedContextRepository,
  ApprovedContextRepositoryContext,
  ApprovedContextSnapshot,
} from "@novussync/application";
import type { ApprovedContextFactRecord, ApprovedFactVersion, FactValue } from "@novussync/domain";

import type { Database } from "./client.js";
import { approvedFactVersions, auditEvents, verifiedContextSnapshots } from "./schema.js";
import { withTenantTransaction } from "./tenant-transaction.js";

export const APPROVED_CONTEXT_PERSISTENCE_ERROR_CODES = [
  "invalid_context",
  "integrity_conflict",
] as const;

export type ApprovedContextPersistenceErrorCode =
  (typeof APPROVED_CONTEXT_PERSISTENCE_ERROR_CODES)[number];

export class ApprovedContextPersistenceError extends Error {
  override readonly name = "ApprovedContextPersistenceError";
  readonly code: ApprovedContextPersistenceErrorCode;

  constructor(code: ApprovedContextPersistenceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type ApprovedContextPersistenceRepository = ApprovedContextRepository;

type FactVersionRow = typeof approvedFactVersions.$inferSelect;

export function createApprovedContextRepository(
  database: Database,
): ApprovedContextPersistenceRepository {
  return Object.freeze({
    async loadApprovedContextRecords(
      context: ApprovedContextRepositoryContext,
      input: Parameters<ApprovedContextRepository["loadApprovedContextRecords"]>[1],
    ) {
      assertContext(context);
      return withTenantTransaction(database, context.tenant, async (transaction) => {
        const rows = await transaction
          .select()
          .from(approvedFactVersions)
          .where(
            and(
              eq(approvedFactVersions.organizationId, context.tenant.organizationId),
              eq(approvedFactVersions.workspaceId, context.tenant.workspaceId),
              eq(approvedFactVersions.profileId, input.profileId),
              inArray(approvedFactVersions.fieldKey, [...input.fieldKeys]),
            ),
          )
          .orderBy(approvedFactVersions.fieldKey, desc(approvedFactVersions.version));
        const currentVersionByField = new Map<string, number>();
        for (const row of rows) {
          currentVersionByField.set(
            row.fieldKey,
            Math.max(currentVersionByField.get(row.fieldKey) ?? 0, row.version),
          );
        }
        return Object.freeze(
          rows.map((row) =>
            mapRecord(row, row.version === currentVersionByField.get(row.fieldKey)),
          ),
        );
      });
    },

    async persistApprovedContextSnapshot(
      context: ApprovedContextRepositoryContext,
      snapshot: ApprovedContextSnapshot,
    ) {
      assertContext(context);
      assertSnapshotContext(context, snapshot);
      try {
        await withTenantTransaction(database, context.tenant, async (transaction) => {
          const inserted = await transaction
            .insert(verifiedContextSnapshots)
            .values({
              organizationId: context.tenant.organizationId,
              workspaceId: context.tenant.workspaceId,
              snapshotId: snapshot.snapshotId,
              schemaVersion: snapshot.schemaVersion,
              profileId: snapshot.profileId,
              useCase: snapshot.useCase,
              asOf: new Date(snapshot.asOf),
              items: [...snapshot.items],
              createdByActorId: context.actorId,
              requestId: context.requestId,
            })
            .onConflictDoNothing()
            .returning({ snapshotId: verifiedContextSnapshots.snapshotId });

          if (inserted.length === 0) {
            const existing = await transaction
              .select()
              .from(verifiedContextSnapshots)
              .where(
                and(
                  eq(verifiedContextSnapshots.organizationId, context.tenant.organizationId),
                  eq(verifiedContextSnapshots.workspaceId, context.tenant.workspaceId),
                  eq(verifiedContextSnapshots.snapshotId, snapshot.snapshotId),
                ),
              )
              .limit(1);
            if (!snapshotMatchesRow(snapshot, existing[0])) {
              throw new ApprovedContextPersistenceError(
                "integrity_conflict",
                "The verified-context snapshot identity already represents different content.",
              );
            }
            return;
          }

          const usableCount = snapshot.items.filter((item) => item.status === "usable").length;
          await transaction.insert(auditEvents).values({
            organizationId: context.tenant.organizationId,
            workspaceId: context.tenant.workspaceId,
            actorType: "human",
            actorId: context.actorId,
            action: "business_brain.approved_context_snapshot_created",
            targetType: "verified_context_snapshot",
            targetId: snapshot.snapshotId,
            targetVersion: snapshot.schemaVersion,
            correlationId: deterministicUuid(`${context.requestId}:${snapshot.snapshotId}`),
            policyResult: "allow",
            evidenceState: "verified",
            safeMetadata: {
              useCase: snapshot.useCase,
              usableCount,
              unavailableCount: snapshot.items.length - usableCount,
            },
            occurredAt: new Date(snapshot.asOf),
          });
        });
      } catch (error) {
        throw mapPersistenceError(error);
      }
    },
  });
}

function mapRecord(row: FactVersionRow, isCurrent: boolean): ApprovedContextFactRecord {
  const conflictResolution =
    row.conflictKind && row.conflictReasonCode
      ? Object.freeze({ kind: row.conflictKind, reasonCode: row.conflictReasonCode })
      : null;
  const fact: ApprovedFactVersion = Object.freeze({
    factVersionId: row.factVersionId,
    tenantId: row.workspaceId,
    profileId: row.profileId,
    fieldKey: row.fieldKey,
    version: row.version,
    value: row.value as FactValue,
    state: "approved",
    sourceCandidateId: row.sourceCandidateId,
    source: Object.freeze({
      sourceId: row.sourceId,
      captureId: row.captureId,
      sourceLocation: row.sourceLocation,
      sourceReference: row.sourceReference,
      capturedAt: row.sourceCapturedAt.toISOString(),
      extractorId: row.extractorId,
      extractorVersion: row.extractorVersion,
    }),
    reviewAction: row.reviewAction,
    reasonCode: row.reasonCode,
    supersedesFactVersionId: row.supersedesFactVersionId,
    conflictResolution,
    verifiedByActorId: row.verifiedByActorId,
    verifiedByRole: "owner",
    verifiedAt: row.verifiedAt.toISOString(),
  });
  return Object.freeze({
    fact,
    isCurrent,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    governance: Object.freeze({
      status: row.governanceStatus,
      allowedUseCases: Object.freeze([...row.allowedUseCases]),
      reasonCode: row.governanceReasonCode,
    }),
  });
}

function assertContext(context: ApprovedContextRepositoryContext): void {
  if (!context.actorId.trim() || !context.requestId.trim()) {
    throw new ApprovedContextPersistenceError(
      "invalid_context",
      "Approved context persistence requires actor and request identity.",
    );
  }
}

function assertSnapshotContext(
  context: ApprovedContextRepositoryContext,
  snapshot: ApprovedContextSnapshot,
): void {
  if (
    snapshot.organizationId !== context.tenant.organizationId ||
    snapshot.workspaceId !== context.tenant.workspaceId
  ) {
    throw new ApprovedContextPersistenceError(
      "invalid_context",
      "The verified-context snapshot does not match its tenant transaction.",
    );
  }
}

function snapshotMatchesRow(
  snapshot: ApprovedContextSnapshot,
  row: typeof verifiedContextSnapshots.$inferSelect | undefined,
): boolean {
  return Boolean(
    row &&
    row.schemaVersion === snapshot.schemaVersion &&
    row.profileId === snapshot.profileId &&
    row.useCase === snapshot.useCase &&
    row.asOf.toISOString() === snapshot.asOf &&
    stableSerialize(row.items) === stableSerialize(snapshot.items),
  );
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

function deterministicUuid(value: string): string {
  const digest = createHash("sha256").update(value).digest("hex");
  return [
    digest.slice(0, 8),
    digest.slice(8, 12),
    `4${digest.slice(13, 16)}`,
    `8${digest.slice(17, 20)}`,
    digest.slice(20, 32),
  ].join("-");
}

function mapPersistenceError(error: unknown): Error {
  if (error instanceof ApprovedContextPersistenceError) return error;
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    ["23503", "23505", "23514"].includes(String((error as { code: unknown }).code))
  ) {
    return new ApprovedContextPersistenceError(
      "integrity_conflict",
      "The verified-context snapshot violated a persistence invariant.",
    );
  }
  return error instanceof Error ? error : new Error("Unknown approved-context persistence error");
}
