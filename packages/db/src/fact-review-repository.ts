import { createHash } from "node:crypto";

import { and, desc, eq, sql } from "drizzle-orm";

import type {
  FactReviewRepositoryContext,
  FactReviewRepositoryPort,
  FactReviewRequest,
} from "@novussync/application";
import {
  resolveFactFreshness,
  type ApprovedFactVersion,
  type FactReviewDecision,
  type FactReviewResult,
  type FactValue,
  type ReviewableFactCandidate,
} from "@novussync/domain";

import type { Database } from "./client.ts";
import {
  approvedFactVersions,
  auditEvents,
  factCandidates,
  factReviewDecisions,
  idempotencyRecords,
  sourceCaptures,
} from "./schema.ts";
import { withTenantTransaction } from "./tenant-transaction.ts";

export const FACT_REVIEW_PERSISTENCE_ERROR_CODES = [
  "not_found",
  "version_conflict",
  "idempotency_conflict",
  "idempotency_in_progress",
  "invalid_context",
  "integrity_conflict",
] as const;

export type FactReviewPersistenceErrorCode = (typeof FACT_REVIEW_PERSISTENCE_ERROR_CODES)[number];

export class FactReviewPersistenceError extends Error {
  override readonly name = "FactReviewPersistenceError";
  readonly code: FactReviewPersistenceErrorCode;

  constructor(code: FactReviewPersistenceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type FactReviewRepository = FactReviewRepositoryPort;

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type CandidateRow = typeof factCandidates.$inferSelect;
type CaptureRow = typeof sourceCaptures.$inferSelect;
type FactVersionRow = typeof approvedFactVersions.$inferSelect;
type DecisionRow = typeof factReviewDecisions.$inferSelect;

const IDEMPOTENCY_SCOPE = "fact_review.commit_review";

export function createFactReviewRepository(database: Database): FactReviewRepository {
  const repository: FactReviewRepository = {
    async findReviewByIdempotency(context, idempotencyKey, request) {
      return withTenantTransaction(database, context.tenant, (transaction) =>
        findIdempotentReview(transaction, context, idempotencyKey, request),
      );
    },

    async findCandidate(context, candidateId) {
      return withTenantTransaction(database, context.tenant, (transaction) =>
        loadCandidate(transaction, context, candidateId),
      );
    },

    async findCurrentFact(context, profileId, fieldKey) {
      return withTenantTransaction(database, context.tenant, (transaction) =>
        loadCurrentFact(transaction, context, profileId, fieldKey),
      );
    },

    async commitReview(input) {
      assertReviewContext(input.context, input.review);
      try {
        return await withTenantTransaction(database, input.context.tenant, async (transaction) => {
          const requestHash = hashReviewRequest(input.request);
          const replayDecisionId = await claimIdempotency(
            transaction,
            input.context,
            input.idempotencyKey,
            requestHash,
            input.review.decision.decidedAt,
          );
          if (replayDecisionId) {
            return requireReview(transaction, input.context, replayDecisionId);
          }

          await lockReviewedField(transaction, input.context, input.review.decision);
          const candidate = await loadCandidate(
            transaction,
            input.context,
            input.review.decision.candidateId,
          );
          if (!candidate) {
            throw new FactReviewPersistenceError(
              "not_found",
              "The reviewed fact candidate no longer exists.",
            );
          }
          assertCandidateMatchesReview(candidate, input.review);

          const latestDecisionVersion = await loadLatestDecisionVersion(
            transaction,
            input.context,
            candidate.candidateId,
          );
          if (input.review.decision.decisionVersion !== latestDecisionVersion + 1) {
            throw new FactReviewPersistenceError(
              "version_conflict",
              "The fact decision history changed before this review was committed.",
            );
          }

          const currentFact = await loadCurrentFact(
            transaction,
            input.context,
            candidate.profileId,
            candidate.fieldKey,
          );
          assertCurrentFactMatchesReview(currentFact, input.review);

          if (input.review.kind === "approved") {
            await transaction.insert(approvedFactVersions).values({
              organizationId: input.context.tenant.organizationId,
              workspaceId: input.context.tenant.workspaceId,
              factVersionId: input.review.factVersion.factVersionId,
              profileId: input.review.factVersion.profileId,
              fieldKey: input.review.factVersion.fieldKey,
              version: input.review.factVersion.version,
              value: input.review.factVersion.value,
              state: "approved",
              sourceCandidateId: input.review.factVersion.sourceCandidateId,
              sourceId: input.review.factVersion.source.sourceId,
              captureId: input.review.factVersion.source.captureId,
              sourceLocation: input.review.factVersion.source.sourceLocation,
              sourceReference: input.review.factVersion.source.sourceReference,
              sourceCapturedAt: new Date(input.review.factVersion.source.capturedAt),
              extractorId: input.review.factVersion.source.extractorId,
              extractorVersion: input.review.factVersion.source.extractorVersion,
              reviewAction: input.review.factVersion.reviewAction,
              reasonCode: input.review.factVersion.reasonCode,
              supersedesFactVersionId: input.review.factVersion.supersedesFactVersionId,
              conflictKind: input.review.factVersion.conflictResolution?.kind ?? null,
              conflictReasonCode: input.review.factVersion.conflictResolution?.reasonCode ?? null,
              verifiedByActorId: input.review.factVersion.verifiedByActorId,
              verifiedByRole: "owner",
              verifiedAt: new Date(input.review.factVersion.verifiedAt),
              expiresAt: resolveFactFreshness(
                input.review.factVersion.fieldKey,
                input.review.factVersion.verifiedAt,
              )?.expiresAt
                ? new Date(
                    resolveFactFreshness(
                      input.review.factVersion.fieldKey,
                      input.review.factVersion.verifiedAt,
                    )!.expiresAt,
                  )
                : null,
            });
          }

          await transaction.insert(factReviewDecisions).values({
            organizationId: input.context.tenant.organizationId,
            workspaceId: input.context.tenant.workspaceId,
            decisionId: input.review.decision.decisionId,
            candidateId: input.review.decision.candidateId,
            profileId: input.review.decision.profileId,
            fieldKey: input.review.decision.fieldKey,
            decisionVersion: input.review.decision.decisionVersion,
            action: input.review.decision.action,
            reasonCode: input.review.decision.reasonCode,
            candidateDisposition: input.review.decision.candidateDisposition,
            approvedFactVersionId:
              input.review.kind === "approved" ? input.review.factVersion.factVersionId : null,
            currentFactVersionId:
              input.review.kind === "rejected" ? input.review.currentFactVersionId : null,
            profileApplicationStatus: "not_applied",
            decidedByActorId: input.review.decision.decidedByActorId,
            decidedByRole: "owner",
            decidedAt: new Date(input.review.decision.decidedAt),
          });

          await insertAuditEvent(transaction, input.context, input.idempotencyKey, input.review);
          await completeIdempotency(
            transaction,
            input.context,
            input.idempotencyKey,
            input.review.decision,
          );
          return input.review;
        });
      } catch (error) {
        throw mapPersistenceError(error);
      }
    },
  };

  return Object.freeze(repository);
}

async function findIdempotentReview(
  transaction: Transaction,
  context: FactReviewRepositoryContext,
  idempotencyKey: string,
  request: FactReviewRequest,
): Promise<FactReviewResult | null> {
  const rows = await transaction
    .select()
    .from(idempotencyRecords)
    .where(idempotencyWhere(context, idempotencyKey))
    .limit(1);
  const record = rows[0];
  if (!record) return null;
  if (record.requestHash !== hashReviewRequest(request)) {
    throw new FactReviewPersistenceError(
      "idempotency_conflict",
      "The fact-review idempotency key was used for a different command.",
    );
  }
  if (record.status === "in_progress") {
    throw new FactReviewPersistenceError(
      "idempotency_in_progress",
      "The original fact review is still in progress.",
    );
  }
  if (record.status !== "succeeded" || !record.resultReference) {
    throw new FactReviewPersistenceError(
      "idempotency_conflict",
      "The original fact review cannot be replayed safely.",
    );
  }
  return requireReview(transaction, context, decisionIdFromReference(record.resultReference));
}

async function claimIdempotency(
  transaction: Transaction,
  context: FactReviewRepositoryContext,
  idempotencyKey: string,
  requestHash: string,
  occurredAt: string,
): Promise<string | null> {
  const timestamp = new Date(occurredAt);
  const inserted = await transaction
    .insert(idempotencyRecords)
    .values({
      organizationId: context.tenant.organizationId,
      workspaceId: context.tenant.workspaceId,
      scope: IDEMPOTENCY_SCOPE,
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
    .where(idempotencyWhere(context, idempotencyKey))
    .limit(1);
  const record = rows[0];
  if (!record || record.requestHash !== requestHash) {
    throw new FactReviewPersistenceError(
      "idempotency_conflict",
      "The fact-review idempotency key was used for a different command.",
    );
  }
  if (record.status === "in_progress") {
    throw new FactReviewPersistenceError(
      "idempotency_in_progress",
      "The original fact review is still in progress.",
    );
  }
  if (record.status !== "succeeded" || !record.resultReference) {
    throw new FactReviewPersistenceError(
      "idempotency_conflict",
      "The original fact review cannot be replayed safely.",
    );
  }
  return decisionIdFromReference(record.resultReference);
}

async function completeIdempotency(
  transaction: Transaction,
  context: FactReviewRepositoryContext,
  idempotencyKey: string,
  decision: FactReviewDecision,
): Promise<void> {
  await transaction
    .update(idempotencyRecords)
    .set({
      status: "succeeded",
      resultReference: `${decision.decisionId}@${decision.decisionVersion}`,
      updatedAt: new Date(decision.decidedAt),
    })
    .where(idempotencyWhere(context, idempotencyKey));
}

async function loadCandidate(
  transaction: Transaction,
  context: FactReviewRepositoryContext,
  candidateId: string,
): Promise<ReviewableFactCandidate | null> {
  const candidateRows = await transaction
    .select()
    .from(factCandidates)
    .where(candidateWhere(context, candidateId))
    .limit(1);
  const candidate = candidateRows[0];
  if (!candidate) return null;
  const captureRows = await transaction
    .select()
    .from(sourceCaptures)
    .where(
      and(
        eq(sourceCaptures.organizationId, context.tenant.organizationId),
        eq(sourceCaptures.workspaceId, context.tenant.workspaceId),
        eq(sourceCaptures.sourceId, candidate.sourceId),
        eq(sourceCaptures.captureId, candidate.captureId),
      ),
    )
    .limit(1);
  const capture = captureRows[0];
  if (!capture) {
    throw new FactReviewPersistenceError(
      "integrity_conflict",
      "The fact candidate source capture is incomplete.",
    );
  }
  return mapCandidate(candidate, capture);
}

async function loadCurrentFact(
  transaction: Transaction,
  context: FactReviewRepositoryContext,
  profileId: string,
  fieldKey: string,
): Promise<ApprovedFactVersion | null> {
  const rows = await transaction
    .select()
    .from(approvedFactVersions)
    .where(
      and(
        eq(approvedFactVersions.organizationId, context.tenant.organizationId),
        eq(approvedFactVersions.workspaceId, context.tenant.workspaceId),
        eq(approvedFactVersions.profileId, profileId),
        eq(approvedFactVersions.fieldKey, fieldKey),
      ),
    )
    .orderBy(desc(approvedFactVersions.version))
    .limit(1);
  return rows[0] ? mapFactVersion(rows[0]) : null;
}

async function loadLatestDecisionVersion(
  transaction: Transaction,
  context: FactReviewRepositoryContext,
  candidateId: string,
): Promise<number> {
  const rows = await transaction
    .select({ decisionVersion: factReviewDecisions.decisionVersion })
    .from(factReviewDecisions)
    .where(
      and(
        eq(factReviewDecisions.organizationId, context.tenant.organizationId),
        eq(factReviewDecisions.workspaceId, context.tenant.workspaceId),
        eq(factReviewDecisions.candidateId, candidateId),
      ),
    )
    .orderBy(desc(factReviewDecisions.decisionVersion))
    .limit(1);
  return rows[0]?.decisionVersion ?? 0;
}

async function requireReview(
  transaction: Transaction,
  context: FactReviewRepositoryContext,
  decisionId: string,
): Promise<FactReviewResult> {
  const rows = await transaction
    .select()
    .from(factReviewDecisions)
    .where(
      and(
        eq(factReviewDecisions.organizationId, context.tenant.organizationId),
        eq(factReviewDecisions.workspaceId, context.tenant.workspaceId),
        eq(factReviewDecisions.decisionId, decisionId),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) {
    throw new FactReviewPersistenceError(
      "idempotency_conflict",
      "The committed fact-review result could not be reconciled.",
    );
  }
  const decision = mapDecision(row);
  if (row.candidateDisposition === "rejected") {
    return Object.freeze({
      kind: "rejected",
      decision,
      currentFactVersionId: row.currentFactVersionId,
    });
  }
  if (!row.approvedFactVersionId) {
    throw new FactReviewPersistenceError(
      "integrity_conflict",
      "The approved fact-review decision has no fact version.",
    );
  }
  const factRows = await transaction
    .select()
    .from(approvedFactVersions)
    .where(
      and(
        eq(approvedFactVersions.organizationId, context.tenant.organizationId),
        eq(approvedFactVersions.workspaceId, context.tenant.workspaceId),
        eq(approvedFactVersions.factVersionId, row.approvedFactVersionId),
      ),
    )
    .limit(1);
  if (!factRows[0]) {
    throw new FactReviewPersistenceError(
      "integrity_conflict",
      "The approved fact-review version could not be reconciled.",
    );
  }
  return Object.freeze({
    kind: "approved",
    decision,
    factVersion: mapFactVersion(factRows[0]),
  });
}

async function lockReviewedField(
  transaction: Transaction,
  context: FactReviewRepositoryContext,
  decision: FactReviewDecision,
): Promise<void> {
  const identity = [
    context.tenant.organizationId,
    context.tenant.workspaceId,
    decision.profileId,
    decision.fieldKey,
  ].join(":");
  await transaction.execute(sql`select pg_advisory_xact_lock(hashtextextended(${identity}, 0))`);
}

function mapCandidate(candidate: CandidateRow, capture: CaptureRow): ReviewableFactCandidate {
  return Object.freeze({
    candidateId: candidate.candidateId,
    tenantId: candidate.workspaceId,
    profileId: candidate.profileId,
    fieldKey: candidate.fieldKey,
    value: candidate.value as FactValue,
    authority: "provisional",
    verificationStatus: "unverified",
    source: Object.freeze({
      sourceId: candidate.sourceId,
      captureId: candidate.captureId,
      sourceLocation: capture.sourceLocation,
      sourceReference: capture.sourceReference,
      capturedAt: capture.capturedAt.toISOString(),
      extractorId: capture.extractorId,
      extractorVersion: capture.extractorVersion,
    }),
    conflict: Object.freeze({
      kind: candidate.conflictKind,
      detail: candidate.conflictDetail,
    }),
  });
}

function mapFactVersion(row: FactVersionRow): ApprovedFactVersion {
  const conflictResolution =
    row.conflictKind && row.conflictReasonCode
      ? Object.freeze({
          kind: row.conflictKind,
          reasonCode: row.conflictReasonCode,
        })
      : null;
  return Object.freeze({
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
}

function mapDecision(row: DecisionRow): FactReviewDecision {
  return Object.freeze({
    decisionId: row.decisionId,
    candidateId: row.candidateId,
    tenantId: row.workspaceId,
    profileId: row.profileId,
    fieldKey: row.fieldKey,
    decisionVersion: row.decisionVersion,
    action: row.action,
    reasonCode: row.reasonCode,
    candidateDisposition: row.candidateDisposition,
    approvedFactVersionId: row.approvedFactVersionId,
    profileApplicationStatus: "not_applied",
    decidedByActorId: row.decidedByActorId,
    decidedByRole: "owner",
    decidedAt: row.decidedAt.toISOString(),
  });
}

function assertReviewContext(context: FactReviewRepositoryContext, review: FactReviewResult): void {
  if (
    review.decision.tenantId !== context.tenant.workspaceId ||
    review.decision.decidedByActorId !== context.actorId ||
    review.decision.decidedByRole !== "owner" ||
    review.decision.profileApplicationStatus !== "not_applied"
  ) {
    throw new FactReviewPersistenceError(
      "invalid_context",
      "The authenticated owner does not match the fact review.",
    );
  }
  if (
    review.kind === "approved" &&
    (review.factVersion.tenantId !== context.tenant.workspaceId ||
      review.factVersion.verifiedByActorId !== context.actorId ||
      review.factVersion.verifiedByRole !== "owner")
  ) {
    throw new FactReviewPersistenceError(
      "invalid_context",
      "The approved fact version does not match the authenticated owner.",
    );
  }
}

function assertCandidateMatchesReview(
  candidate: ReviewableFactCandidate,
  review: FactReviewResult,
): void {
  if (
    review.decision.candidateId !== candidate.candidateId ||
    review.decision.profileId !== candidate.profileId ||
    review.decision.fieldKey !== candidate.fieldKey
  ) {
    throw new FactReviewPersistenceError(
      "integrity_conflict",
      "The fact-review decision does not match its candidate.",
    );
  }
  if (
    review.kind === "approved" &&
    (review.factVersion.profileId !== candidate.profileId ||
      review.factVersion.fieldKey !== candidate.fieldKey ||
      review.factVersion.sourceCandidateId !== candidate.candidateId ||
      stableSerialize(review.factVersion.source) !== stableSerialize(candidate.source))
  ) {
    throw new FactReviewPersistenceError(
      "integrity_conflict",
      "The approved fact version does not preserve candidate provenance.",
    );
  }
}

function assertCurrentFactMatchesReview(
  currentFact: ApprovedFactVersion | null,
  review: FactReviewResult,
): void {
  if (review.kind === "rejected") {
    if (review.currentFactVersionId !== (currentFact?.factVersionId ?? null)) {
      throw new FactReviewPersistenceError(
        "version_conflict",
        "The approved fact changed before rejection was committed.",
      );
    }
    return;
  }
  if (
    review.factVersion.version !== (currentFact?.version ?? 0) + 1 ||
    review.factVersion.supersedesFactVersionId !== (currentFact?.factVersionId ?? null)
  ) {
    throw new FactReviewPersistenceError(
      "version_conflict",
      "The approved fact changed before this version was committed.",
    );
  }
}

async function insertAuditEvent(
  transaction: Transaction,
  context: FactReviewRepositoryContext,
  idempotencyKey: string,
  review: FactReviewResult,
): Promise<void> {
  await transaction.insert(auditEvents).values({
    organizationId: context.tenant.organizationId,
    workspaceId: context.tenant.workspaceId,
    actorType: "human",
    actorId: context.actorId,
    action: "business_brain.fact_review_recorded",
    targetType: "fact_candidate",
    targetId: review.decision.candidateId,
    targetVersion: review.decision.decisionVersion,
    correlationId: deterministicUuid(review.decision.decisionId),
    idempotencyKey,
    policyResult: "allow",
    evidenceState: "verified",
    safeMetadata: {
      action: review.decision.action,
      disposition: review.decision.candidateDisposition,
      profileApplicationStatus: "not_applied",
      createdFactVersion: review.kind === "approved",
    },
    occurredAt: new Date(review.decision.decidedAt),
  });
}

function candidateWhere(context: FactReviewRepositoryContext, candidateId: string) {
  return and(
    eq(factCandidates.organizationId, context.tenant.organizationId),
    eq(factCandidates.workspaceId, context.tenant.workspaceId),
    eq(factCandidates.candidateId, candidateId),
  );
}

function idempotencyWhere(context: FactReviewRepositoryContext, idempotencyKey: string) {
  return and(
    eq(idempotencyRecords.organizationId, context.tenant.organizationId),
    eq(idempotencyRecords.workspaceId, context.tenant.workspaceId),
    eq(idempotencyRecords.scope, IDEMPOTENCY_SCOPE),
    eq(idempotencyRecords.idempotencyKey, idempotencyKey),
  );
}

function hashReviewRequest(request: FactReviewRequest): string {
  return createHash("sha256").update(stableSerialize(request)).digest("hex");
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

function decisionIdFromReference(reference: string): string {
  const separator = reference.lastIndexOf("@");
  const decisionId = reference.slice(0, separator);
  const version = Number(reference.slice(separator + 1));
  if (separator < 1 || !decisionId || !Number.isSafeInteger(version) || version < 1) {
    throw new FactReviewPersistenceError(
      "idempotency_conflict",
      "The stored fact-review result reference is invalid.",
    );
  }
  return decisionId;
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

function mapPersistenceError(error: unknown): Error {
  if (error instanceof FactReviewPersistenceError) return error;
  if (isPostgresError(error, "23505")) {
    return new FactReviewPersistenceError(
      "version_conflict",
      "The fact review conflicted with a concurrent version.",
    );
  }
  if (isPostgresError(error, "23503") || isPostgresError(error, "23514")) {
    return new FactReviewPersistenceError(
      "integrity_conflict",
      "The fact review violated a persistence invariant.",
    );
  }
  return error instanceof Error ? error : new Error("Unknown fact-review persistence error");
}

function isPostgresError(error: unknown, code: string): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === code,
  );
}
