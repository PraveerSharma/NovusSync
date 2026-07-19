import { createHash } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";

import type {
  FactReverificationRepositoryContext,
  FactReverificationResult,
  FactReverificationWriteRepositoryPort,
} from "@novussync/application";
import { resolveFactFreshness, type ApprovedContextFactRecord } from "@novussync/domain";

import type { Database } from "./client.ts";
import { approvedFactVersions, auditEvents, idempotencyRecords } from "./schema.ts";
import { withTenantTransaction } from "./tenant-transaction.ts";

const IDEMPOTENCY_SCOPE = "fact_reverification";
const IDEMPOTENCY_TTL_MILLISECONDS = 24 * 60 * 60 * 1_000;

export type FactReverificationPersistenceErrorCode =
  | "invalid_context"
  | "idempotency_conflict"
  | "operation_in_progress"
  | "version_conflict"
  | "integrity_conflict";

export class FactReverificationPersistenceError extends Error {
  override readonly name = "FactReverificationPersistenceError";
  readonly code: FactReverificationPersistenceErrorCode;

  constructor(code: FactReverificationPersistenceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type FactReverificationRepository = FactReverificationWriteRepositoryPort;

export function createFactReverificationRepository(
  database: Database,
): FactReverificationRepository {
  return Object.freeze({
    async findReverificationByIdempotency(
      context: FactReverificationRepositoryContext,
      idempotencyKey: string,
    ): Promise<FactReverificationResult | null> {
      assertContext(context);
      if (!idempotencyKey.trim()) {
        throw new FactReverificationPersistenceError(
          "invalid_context",
          "Fact reverification persistence requires an idempotency key.",
        );
      }
      try {
        return await withTenantTransaction(database, context.tenant, async (transaction) => {
          const records = await transaction
            .select()
            .from(idempotencyRecords)
            .where(
              and(
                eq(idempotencyRecords.organizationId, context.tenant.organizationId),
                eq(idempotencyRecords.workspaceId, context.tenant.workspaceId),
                eq(idempotencyRecords.scope, IDEMPOTENCY_SCOPE),
                eq(idempotencyRecords.idempotencyKey, idempotencyKey),
              ),
            )
            .limit(1);
          const record = records[0];
          if (!record || record.status !== "succeeded" || !record.resultReference) return null;
          const rows = await transaction
            .select()
            .from(approvedFactVersions)
            .where(
              and(
                eq(approvedFactVersions.organizationId, context.tenant.organizationId),
                eq(approvedFactVersions.workspaceId, context.tenant.workspaceId),
                eq(approvedFactVersions.factVersionId, record.resultReference),
              ),
            )
            .limit(1);
          if (!rows[0]) {
            throw new FactReverificationPersistenceError(
              "integrity_conflict",
              "A completed reverification no longer references an approved fact version.",
            );
          }
          return mapResult(rows[0]);
        });
      } catch (error) {
        throw mapPersistenceError(error);
      }
    },

    async commitReverification(
      input: Parameters<FactReverificationWriteRepositoryPort["commitReverification"]>[0],
    ): Promise<FactReverificationResult> {
      assertContext(input.context);
      const requestHash = hashRequest(input.current, input.result);
      try {
        return await withTenantTransaction(database, input.context.tenant, async (transaction) => {
          const wallClock = Date.now();
          const claimed = await transaction
            .insert(idempotencyRecords)
            .values({
              organizationId: input.context.tenant.organizationId,
              workspaceId: input.context.tenant.workspaceId,
              scope: IDEMPOTENCY_SCOPE,
              idempotencyKey: input.idempotencyKey,
              requestHash,
              status: "in_progress",
              lockedUntil: new Date(wallClock + 30_000),
              expiresAt: new Date(wallClock + IDEMPOTENCY_TTL_MILLISECONDS),
            })
            .onConflictDoNothing()
            .returning({ id: idempotencyRecords.id });

          if (claimed.length === 0) {
            const existing = await transaction
              .select()
              .from(idempotencyRecords)
              .where(
                and(
                  eq(idempotencyRecords.organizationId, input.context.tenant.organizationId),
                  eq(idempotencyRecords.workspaceId, input.context.tenant.workspaceId),
                  eq(idempotencyRecords.scope, IDEMPOTENCY_SCOPE),
                  eq(idempotencyRecords.idempotencyKey, input.idempotencyKey),
                ),
              )
              .limit(1);
            const record = existing[0];
            if (!record || record.requestHash !== requestHash) {
              throw new FactReverificationPersistenceError(
                "idempotency_conflict",
                "The idempotency key is already bound to another fact reverification.",
              );
            }
            if (record.status !== "succeeded" || !record.resultReference) {
              throw new FactReverificationPersistenceError(
                "operation_in_progress",
                "The same fact reverification is already in progress.",
              );
            }
            const replayRows = await transaction
              .select()
              .from(approvedFactVersions)
              .where(
                and(
                  eq(approvedFactVersions.organizationId, input.context.tenant.organizationId),
                  eq(approvedFactVersions.workspaceId, input.context.tenant.workspaceId),
                  eq(approvedFactVersions.factVersionId, record.resultReference),
                ),
              )
              .limit(1);
            if (!replayRows[0]) {
              throw new FactReverificationPersistenceError(
                "integrity_conflict",
                "The completed reverification result could not be loaded.",
              );
            }
            return mapResult(replayRows[0]);
          }

          const currentRows = await transaction
            .select()
            .from(approvedFactVersions)
            .where(
              and(
                eq(approvedFactVersions.organizationId, input.context.tenant.organizationId),
                eq(approvedFactVersions.workspaceId, input.context.tenant.workspaceId),
                eq(approvedFactVersions.profileId, input.current.fact.profileId),
                eq(approvedFactVersions.fieldKey, input.current.fact.fieldKey),
              ),
            )
            .orderBy(desc(approvedFactVersions.version))
            .limit(1);
          const current = currentRows[0];
          if (
            !current ||
            current.factVersionId !== input.current.fact.factVersionId ||
            current.version !== input.current.fact.version
          ) {
            throw new FactReverificationPersistenceError(
              "version_conflict",
              "The approved fact changed before reverification was committed.",
            );
          }

          await transaction.insert(approvedFactVersions).values({
            organizationId: input.context.tenant.organizationId,
            workspaceId: input.context.tenant.workspaceId,
            factVersionId: input.result.factVersionId,
            profileId: current.profileId,
            fieldKey: current.fieldKey,
            version: input.result.version,
            value: current.value,
            state: "approved",
            sourceCandidateId: current.sourceCandidateId,
            sourceId: current.sourceId,
            captureId: current.captureId,
            sourceLocation: current.sourceLocation,
            sourceReference: current.sourceReference,
            sourceCapturedAt: current.sourceCapturedAt,
            extractorId: current.extractorId,
            extractorVersion: current.extractorVersion,
            reviewAction: "verify",
            reasonCode: input.result.reasonCode,
            supersedesFactVersionId: current.factVersionId,
            conflictKind: null,
            conflictReasonCode: null,
            verifiedByActorId: input.context.actorId,
            verifiedByRole: "owner",
            verifiedAt: new Date(input.result.verifiedAt),
            governanceStatus: current.governanceStatus,
            allowedUseCases: current.allowedUseCases,
            expiresAt: new Date(input.result.expiresAt),
            governanceReasonCode: current.governanceReasonCode,
          });

          await transaction.insert(auditEvents).values({
            organizationId: input.context.tenant.organizationId,
            workspaceId: input.context.tenant.workspaceId,
            actorType: "human",
            actorId: input.context.actorId,
            action: "business_brain.fact_reverified",
            targetType: "approved_fact_version",
            targetId: input.result.factVersionId,
            targetVersion: input.result.version,
            correlationId: deterministicUuid(
              input.context.requestId + ":" + input.result.factVersionId,
            ),
            idempotencyKey: input.idempotencyKey,
            policyResult: "allow",
            evidenceState: "verified",
            safeMetadata: {
              profileId: input.result.profileId,
              fieldKey: input.result.fieldKey,
              priorFactVersionId: input.result.supersedesFactVersionId,
              freshnessPolicyVersion: input.result.policyVersion,
              expiresAt: input.result.expiresAt,
            },
            occurredAt: new Date(input.result.verifiedAt),
          });

          await transaction
            .update(idempotencyRecords)
            .set({
              status: "succeeded",
              resultReference: input.result.factVersionId,
              lockedUntil: null,
              updatedAt: new Date(),
            })
            .where(eq(idempotencyRecords.id, claimed[0]!.id));

          return input.result;
        });
      } catch (error) {
        throw mapPersistenceError(error);
      }
    },
  });
}

function mapResult(row: typeof approvedFactVersions.$inferSelect): FactReverificationResult {
  if (
    row.reasonCode !== "OWNER_REVERIFIED_UNCHANGED" ||
    !row.supersedesFactVersionId ||
    !row.expiresAt
  ) {
    throw new FactReverificationPersistenceError(
      "integrity_conflict",
      "The persisted row is not a complete fact reverification result.",
    );
  }
  const policy = resolveFactFreshness(row.fieldKey, row.verifiedAt.toISOString());
  if (!policy) {
    throw new FactReverificationPersistenceError(
      "integrity_conflict",
      "The persisted reverification is not governed by a freshness policy.",
    );
  }
  return Object.freeze({
    kind: "reverified",
    factVersionId: row.factVersionId,
    supersedesFactVersionId: row.supersedesFactVersionId,
    profileId: row.profileId,
    fieldKey: row.fieldKey,
    version: row.version,
    verifiedAt: row.verifiedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    policyVersion: policy.policyVersion,
    reasonCode: "OWNER_REVERIFIED_UNCHANGED",
  });
}

function hashRequest(current: ApprovedContextFactRecord, result: FactReverificationResult): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        profileId: current.fact.profileId,
        factVersionId: current.fact.factVersionId,
        expectedVersion: current.fact.version,
        fieldKey: result.fieldKey,
      }),
    )
    .digest("hex");
}

function assertContext(context: FactReverificationRepositoryContext): void {
  if (!context.actorId.trim() || !context.requestId.trim()) {
    throw new FactReverificationPersistenceError(
      "invalid_context",
      "Fact reverification persistence requires actor and request identity.",
    );
  }
}

function deterministicUuid(value: string): string {
  const digest = createHash("sha256").update(value).digest("hex");
  return [
    digest.slice(0, 8),
    digest.slice(8, 12),
    "4" + digest.slice(13, 16),
    "8" + digest.slice(17, 20),
    digest.slice(20, 32),
  ].join("-");
}

function mapPersistenceError(error: unknown): Error {
  if (error instanceof FactReverificationPersistenceError) return error;
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code: unknown }).code);
    if (code === "23505") {
      return new FactReverificationPersistenceError(
        "version_conflict",
        "The fact reverification conflicted with another immutable version.",
      );
    }
    if (["23503", "23514"].includes(code)) {
      return new FactReverificationPersistenceError(
        "integrity_conflict",
        "The fact reverification violated a persistence invariant.",
      );
    }
  }
  return error instanceof Error ? error : new Error("Fact reverification persistence failed");
}
