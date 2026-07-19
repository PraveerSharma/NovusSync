import { createHash } from "node:crypto";

import { and, asc, desc, eq } from "drizzle-orm";

import type {
  SourceProposalPersistenceContext,
  SourceProposalRepositoryPort,
} from "@novussync/application";
import {
  approveBookingRouteMetadataSource,
  approveBusinessWebsiteSource,
  createFactCandidate,
  createFactCandidateReviewDecision,
  createSourceCapture,
  createSourceProposalBatch,
  type ApprovedBusinessSource,
  type FactCandidate,
  type FactCandidateReviewDecision,
  type SourceCapture,
  type SourceProposalBatch,
  type SourceProposalValue,
} from "@novussync/domain";

import type { Database } from "./client.ts";
import {
  approvedBusinessSources,
  auditEvents,
  factCandidateReviewDecisions,
  factCandidates,
  idempotencyRecords,
  sourceCaptures,
  sourceProposalBatches,
} from "./schema.ts";
import { withTenantTransaction } from "./tenant-transaction.ts";

export const SOURCE_PROPOSAL_PERSISTENCE_ERROR_CODES = [
  "not_found",
  "version_conflict",
  "idempotency_conflict",
  "idempotency_in_progress",
  "invalid_context",
  "source_conflict",
] as const;

export type SourceProposalPersistenceErrorCode =
  (typeof SOURCE_PROPOSAL_PERSISTENCE_ERROR_CODES)[number];

export class SourceProposalPersistenceError extends Error {
  override readonly name = "SourceProposalPersistenceError";
  readonly code: SourceProposalPersistenceErrorCode;

  constructor(code: SourceProposalPersistenceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type SourceProposalRepository = SourceProposalRepositoryPort;

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type SourceRow = typeof approvedBusinessSources.$inferSelect;
type CaptureRow = typeof sourceCaptures.$inferSelect;
type BatchRow = typeof sourceProposalBatches.$inferSelect;
type CandidateRow = typeof factCandidates.$inferSelect;
type DecisionRow = typeof factCandidateReviewDecisions.$inferSelect;

export function createSourceProposalRepository(database: Database): SourceProposalRepository {
  const repository: SourceProposalRepository = {
    async persistBatch(context, batch, idempotencyKey) {
      assertBatchContext(context, batch);
      return withTenantTransaction(database, context.tenant, async (transaction) => {
        const replay = await claimIdempotency(
          transaction,
          context,
          "source_proposal.persist_batch",
          idempotencyKey,
          hashRequest({ action: "persist_batch", batch }),
          batch.createdAt,
        );
        if (replay !== null) {
          const persisted = await loadBatch(transaction, context, replay.resultId);
          if (!persisted) {
            throw new SourceProposalPersistenceError(
              "idempotency_conflict",
              "The original proposal batch result could not be reconciled.",
            );
          }
          return persisted;
        }

        await ensureSource(transaction, context, batch.source);
        await ensureCapture(transaction, context, batch.capture);
        const existing = await transaction
          .select({ batchId: sourceProposalBatches.batchId })
          .from(sourceProposalBatches)
          .where(batchWhere(context, batch.batchId))
          .limit(1);
        if (existing[0]) {
          throw new SourceProposalPersistenceError(
            "version_conflict",
            "A proposal batch already exists for this identity.",
          );
        }

        await transaction.insert(sourceProposalBatches).values({
          organizationId: context.tenant.organizationId,
          workspaceId: context.tenant.workspaceId,
          batchId: batch.batchId,
          profileId: batch.profileId,
          sourceId: batch.source.sourceId,
          captureId: batch.capture.captureId,
          status: batch.status,
          createdAt: new Date(batch.createdAt),
        });
        await transaction.insert(factCandidates).values(
          batch.candidates.map((candidate) => ({
            organizationId: context.tenant.organizationId,
            workspaceId: context.tenant.workspaceId,
            candidateId: candidate.candidateId,
            batchId: batch.batchId,
            profileId: candidate.profileId,
            sourceId: candidate.provenance.sourceId,
            captureId: candidate.provenance.captureId,
            fieldKey: candidate.fieldKey,
            factTemplateVersion: candidate.factTemplateVersion,
            playbookVersion: candidate.playbookVersion,
            value: candidate.value,
            allowedUseCases: [...candidate.allowedUseCases],
            confidenceBasisPoints: Math.round(candidate.confidence * 10_000),
            conflictKind: candidate.conflict.kind,
            conflictDetail: candidate.conflict.detail,
            verificationStatus: candidate.verificationStatus,
            authority: candidate.authority,
            candidateCreatedAt: new Date(candidate.createdAt),
          })),
        );
        await insertAuditEvent(
          transaction,
          context,
          "source_proposal.batch_persisted",
          "source_proposal_batch",
          batch.batchId,
          1,
          idempotencyKey,
          batch.createdAt,
          {
            sourceKind: batch.source.kind,
            candidateCount: batch.candidates.length,
            status: batch.status,
          },
        );
        await completeIdempotency(
          transaction,
          context,
          "source_proposal.persist_batch",
          idempotencyKey,
          batch.batchId,
          1,
          batch.createdAt,
        );
        return batch;
      });
    },

    async findBatch(context, batchId) {
      return withTenantTransaction(database, context.tenant, (transaction) =>
        loadBatch(transaction, context, batchId),
      );
    },

    async recordDecision(context, candidate, decision, expectedCurrentVersion, idempotencyKey) {
      assertDecisionContext(context, candidate, decision);
      return withTenantTransaction(database, context.tenant, async (transaction) => {
        const replay = await claimIdempotency(
          transaction,
          context,
          "source_proposal.record_decision",
          idempotencyKey,
          hashRequest({ action: "record_decision", decision, expectedCurrentVersion }),
          decision.decidedAt,
        );
        if (replay !== null) {
          return requireDecision(transaction, context, candidate, replay.resultId);
        }

        const candidateRows = await transaction
          .select({ candidateId: factCandidates.candidateId })
          .from(factCandidates)
          .where(candidateWhere(context, candidate.candidateId))
          .limit(1);
        if (!candidateRows[0]) {
          throw new SourceProposalPersistenceError("not_found", "Proposal candidate not found.");
        }
        const latest = await transaction
          .select({ decisionVersion: factCandidateReviewDecisions.decisionVersion })
          .from(factCandidateReviewDecisions)
          .where(
            and(
              eq(factCandidateReviewDecisions.organizationId, context.tenant.organizationId),
              eq(factCandidateReviewDecisions.workspaceId, context.tenant.workspaceId),
              eq(factCandidateReviewDecisions.candidateId, candidate.candidateId),
            ),
          )
          .orderBy(desc(factCandidateReviewDecisions.decisionVersion))
          .limit(1);
        const currentVersion = latest[0]?.decisionVersion ?? 0;
        if (
          currentVersion !== expectedCurrentVersion ||
          decision.decisionVersion !== expectedCurrentVersion + 1
        ) {
          throw new SourceProposalPersistenceError(
            "version_conflict",
            "The proposal decision history changed before this decision was recorded.",
          );
        }

        await transaction.insert(factCandidateReviewDecisions).values({
          organizationId: context.tenant.organizationId,
          workspaceId: context.tenant.workspaceId,
          decisionId: decision.decisionId,
          candidateId: decision.candidateId,
          profileId: decision.profileId,
          decisionVersion: decision.decisionVersion,
          outcome: decision.outcome,
          reasonCode: decision.reasonCode,
          decidedByActorId: decision.decidedByActorId,
          candidateAuthority: decision.candidateAuthority,
          applicationStatus: decision.applicationStatus,
          decidedAt: new Date(decision.decidedAt),
        });
        await insertAuditEvent(
          transaction,
          context,
          "source_proposal.owner_decision_recorded",
          "fact_candidate",
          candidate.candidateId,
          decision.decisionVersion,
          idempotencyKey,
          decision.decidedAt,
          {
            outcome: decision.outcome,
            reasonCode: decision.reasonCode,
            applicationStatus: decision.applicationStatus,
          },
        );
        await completeIdempotency(
          transaction,
          context,
          "source_proposal.record_decision",
          idempotencyKey,
          decision.decisionId,
          decision.decisionVersion,
          decision.decidedAt,
        );
        return decision;
      });
    },

    async listDecisions(context, candidate) {
      assertCandidateContext(context, candidate);
      return withTenantTransaction(database, context.tenant, async (transaction) => {
        const rows = await transaction
          .select()
          .from(factCandidateReviewDecisions)
          .where(
            and(
              eq(factCandidateReviewDecisions.organizationId, context.tenant.organizationId),
              eq(factCandidateReviewDecisions.workspaceId, context.tenant.workspaceId),
              eq(factCandidateReviewDecisions.candidateId, candidate.candidateId),
            ),
          )
          .orderBy(asc(factCandidateReviewDecisions.decisionVersion));
        return Object.freeze(rows.map((row) => mapDecisionRow(row, candidate)));
      });
    },
  };

  return Object.freeze(repository);
}

async function ensureSource(
  transaction: Transaction,
  context: SourceProposalPersistenceContext,
  source: ApprovedBusinessSource,
): Promise<void> {
  await transaction
    .insert(approvedBusinessSources)
    .values({
      organizationId: context.tenant.organizationId,
      workspaceId: context.tenant.workspaceId,
      sourceId: source.sourceId,
      kind: source.kind,
      configuration: sourceConfiguration(source),
      approvedByActorId: source.approval.actorId,
      approvedAt: new Date(source.approval.approvedAt),
    })
    .onConflictDoNothing();
  const rows = await transaction
    .select()
    .from(approvedBusinessSources)
    .where(sourceWhere(context, source.sourceId))
    .limit(1);
  const row = rows[0];
  if (
    !row ||
    row.kind !== source.kind ||
    row.approvedByActorId !== source.approval.actorId ||
    row.approvedAt.toISOString() !== source.approval.approvedAt ||
    stableSerialize(row.configuration) !== stableSerialize(sourceConfiguration(source))
  ) {
    throw new SourceProposalPersistenceError(
      "source_conflict",
      "The approved source identity is already bound to different metadata.",
    );
  }
}

async function ensureCapture(
  transaction: Transaction,
  context: SourceProposalPersistenceContext,
  capture: SourceCapture,
): Promise<void> {
  await transaction
    .insert(sourceCaptures)
    .values({
      organizationId: context.tenant.organizationId,
      workspaceId: context.tenant.workspaceId,
      sourceId: capture.sourceId,
      captureId: capture.captureId,
      sourceKind: capture.sourceKind,
      sourceLocation: capture.sourceLocation,
      sourceReference: capture.sourceReference,
      capturedAt: new Date(capture.capturedAt),
      extractorId: capture.extractor.id,
      extractorVersion: capture.extractor.version,
      contentDigest: capture.contentDigest,
      contentBytes: capture.contentBytes,
    })
    .onConflictDoNothing();
  const rows = await transaction
    .select()
    .from(sourceCaptures)
    .where(captureWhere(context, capture.captureId))
    .limit(1);
  const row = rows[0];
  if (
    !row ||
    row.sourceId !== capture.sourceId ||
    row.sourceKind !== capture.sourceKind ||
    row.sourceLocation !== capture.sourceLocation ||
    row.sourceReference !== capture.sourceReference ||
    row.capturedAt.toISOString() !== capture.capturedAt ||
    row.extractorId !== capture.extractor.id ||
    row.extractorVersion !== capture.extractor.version ||
    row.contentDigest !== capture.contentDigest ||
    row.contentBytes !== capture.contentBytes
  ) {
    throw new SourceProposalPersistenceError(
      "source_conflict",
      "The source capture identity is already bound to different metadata.",
    );
  }
}

async function loadBatch(
  transaction: Transaction,
  context: SourceProposalPersistenceContext,
  batchId: string,
): Promise<SourceProposalBatch | null> {
  const batchRows = await transaction
    .select()
    .from(sourceProposalBatches)
    .where(batchWhere(context, batchId))
    .limit(1);
  const batch = batchRows[0];
  if (!batch) return null;
  const sourceRows = await transaction
    .select()
    .from(approvedBusinessSources)
    .where(sourceWhere(context, batch.sourceId))
    .limit(1);
  const captureRows = await transaction
    .select()
    .from(sourceCaptures)
    .where(captureWhere(context, batch.captureId))
    .limit(1);
  const candidateRows = await transaction
    .select()
    .from(factCandidates)
    .where(
      and(
        eq(factCandidates.organizationId, context.tenant.organizationId),
        eq(factCandidates.workspaceId, context.tenant.workspaceId),
        eq(factCandidates.batchId, batch.batchId),
      ),
    )
    .orderBy(asc(factCandidates.recordedAt), asc(factCandidates.candidateId));
  if (!sourceRows[0] || !captureRows[0] || candidateRows.length === 0) {
    throw new SourceProposalPersistenceError(
      "source_conflict",
      "The persisted proposal graph is incomplete.",
    );
  }
  return mapBatchRows(batch, sourceRows[0], captureRows[0], candidateRows);
}

function mapBatchRows(
  batch: BatchRow,
  sourceRow: SourceRow,
  captureRow: CaptureRow,
  candidateRows: readonly CandidateRow[],
): SourceProposalBatch {
  const configuration = objectConfiguration(sourceRow.configuration);
  const approval = {
    actorId: sourceRow.approvedByActorId,
    actorRole: "owner" as const,
    approvedAt: sourceRow.approvedAt.toISOString(),
  };
  const source =
    sourceRow.kind === "business_website"
      ? approveBusinessWebsiteSource({
          sourceId: sourceRow.sourceId,
          tenantId: sourceRow.workspaceId,
          entryUrl: configurationText(configuration, "entryUrl"),
          approval,
        })
      : approveBookingRouteMetadataSource({
          sourceId: sourceRow.sourceId,
          tenantId: sourceRow.workspaceId,
          bookingRouteId: configurationText(configuration, "bookingRouteId"),
          routeLabel: configurationText(configuration, "routeLabel"),
          sourceReference: configurationText(configuration, "sourceReference"),
          hostedUrl: configurationNullableText(configuration, "hostedUrl"),
          approval,
        });
  const capture = createSourceCapture({
    source,
    captureId: captureRow.captureId,
    sourceLocation: captureRow.sourceLocation,
    sourceReference: captureRow.sourceReference,
    capturedAt: captureRow.capturedAt.toISOString(),
    extractor: {
      id: captureRow.extractorId,
      version: captureRow.extractorVersion,
    },
    contentDigest: captureRow.contentDigest,
    contentBytes: captureRow.contentBytes,
  });
  const candidates = candidateRows.map((row) =>
    createFactCandidate({
      candidateId: row.candidateId,
      profileId: row.profileId,
      source,
      capture,
      fieldKey: row.fieldKey,
      factTemplateVersion: row.factTemplateVersion,
      playbookVersion: row.playbookVersion,
      value: row.value as SourceProposalValue,
      allowedUseCases: row.allowedUseCases,
      confidence: row.confidenceBasisPoints / 10_000,
      conflict: { kind: row.conflictKind, detail: row.conflictDetail },
      createdAt: row.candidateCreatedAt.toISOString(),
    }),
  );
  return createSourceProposalBatch({
    batchId: batch.batchId,
    profileId: batch.profileId,
    source,
    capture,
    candidates,
    createdAt: batch.createdAt.toISOString(),
  });
}

async function requireDecision(
  transaction: Transaction,
  context: SourceProposalPersistenceContext,
  candidate: FactCandidate,
  decisionId: string,
): Promise<FactCandidateReviewDecision> {
  const rows = await transaction
    .select()
    .from(factCandidateReviewDecisions)
    .where(
      and(
        eq(factCandidateReviewDecisions.organizationId, context.tenant.organizationId),
        eq(factCandidateReviewDecisions.workspaceId, context.tenant.workspaceId),
        eq(factCandidateReviewDecisions.decisionId, decisionId),
      ),
    )
    .limit(1);
  if (!rows[0]) {
    throw new SourceProposalPersistenceError(
      "idempotency_conflict",
      "The original decision result could not be reconciled.",
    );
  }
  return mapDecisionRow(rows[0], candidate);
}

function mapDecisionRow(row: DecisionRow, candidate: FactCandidate): FactCandidateReviewDecision {
  return createFactCandidateReviewDecision({
    decisionId: row.decisionId,
    candidate,
    decisionVersion: row.decisionVersion,
    outcome: row.outcome,
    reasonCode: row.reasonCode,
    decidedByActorId: row.decidedByActorId,
    decidedByRole: "owner",
    decidedAt: row.decidedAt.toISOString(),
  });
}

async function claimIdempotency(
  transaction: Transaction,
  context: SourceProposalPersistenceContext,
  scope: string,
  idempotencyKey: string,
  requestHash: string,
  now: string,
): Promise<{ readonly resultId: string; readonly version: number } | null> {
  const timestamp = new Date(now);
  const inserted = await transaction
    .insert(idempotencyRecords)
    .values({
      organizationId: context.tenant.organizationId,
      workspaceId: context.tenant.workspaceId,
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
    .where(idempotencyWhere(context, scope, idempotencyKey))
    .limit(1);
  const record = rows[0];
  if (!record || record.requestHash !== requestHash) {
    throw new SourceProposalPersistenceError(
      "idempotency_conflict",
      "The idempotency key was already used for a different request.",
    );
  }
  if (record.status === "in_progress") {
    throw new SourceProposalPersistenceError(
      "idempotency_in_progress",
      "The original proposal operation is still in progress.",
    );
  }
  if (record.status !== "succeeded" || !record.resultReference) {
    throw new SourceProposalPersistenceError(
      "idempotency_conflict",
      "The original proposal operation cannot be replayed safely.",
    );
  }
  const separator = record.resultReference.lastIndexOf("@");
  const resultId = record.resultReference.slice(0, separator);
  const version = Number(record.resultReference.slice(separator + 1));
  if (separator < 1 || resultId.length === 0 || !Number.isSafeInteger(version) || version < 1) {
    throw new SourceProposalPersistenceError(
      "idempotency_conflict",
      "The stored proposal operation reference is invalid.",
    );
  }
  return Object.freeze({ resultId, version });
}

async function completeIdempotency(
  transaction: Transaction,
  context: SourceProposalPersistenceContext,
  scope: string,
  idempotencyKey: string,
  resultId: string,
  version: number,
  now: string,
): Promise<void> {
  await transaction
    .update(idempotencyRecords)
    .set({
      status: "succeeded",
      resultReference: `${resultId}@${version}`,
      updatedAt: new Date(now),
    })
    .where(idempotencyWhere(context, scope, idempotencyKey));
}

async function insertAuditEvent(
  transaction: Transaction,
  context: SourceProposalPersistenceContext,
  action: string,
  targetType: string,
  targetId: string,
  targetVersion: number,
  idempotencyKey: string,
  occurredAt: string,
  safeMetadata: Record<string, unknown>,
): Promise<void> {
  await transaction.insert(auditEvents).values({
    organizationId: context.tenant.organizationId,
    workspaceId: context.tenant.workspaceId,
    actorType: context.actor.actorType,
    actorId: context.actor.actorType === "human" ? context.actor.id : null,
    action,
    targetType,
    targetId,
    targetVersion,
    correlationId: context.correlationId,
    idempotencyKey,
    policyResult: "allow",
    evidenceState: "unverified",
    safeMetadata,
    occurredAt: new Date(occurredAt),
  });
}

function sourceConfiguration(source: ApprovedBusinessSource): Record<string, unknown> {
  return source.kind === "business_website"
    ? { approvedOrigin: source.approvedOrigin, entryUrl: source.entryUrl }
    : {
        bookingRouteId: source.bookingRouteId,
        routeLabel: source.routeLabel,
        sourceReference: source.sourceReference,
        hostedUrl: source.hostedUrl,
      };
}

function objectConfiguration(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new SourceProposalPersistenceError(
      "source_conflict",
      "Persisted source configuration is invalid.",
    );
  }
  return value as Record<string, unknown>;
}

function configurationText(configuration: Record<string, unknown>, key: string): string {
  const value = configuration[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new SourceProposalPersistenceError(
      "source_conflict",
      "Persisted source configuration is incomplete.",
    );
  }
  return value;
}

function configurationNullableText(
  configuration: Record<string, unknown>,
  key: string,
): string | null {
  const value = configuration[key];
  if (value === null) return null;
  return configurationText(configuration, key);
}

function sourceWhere(context: SourceProposalPersistenceContext, sourceId: string) {
  return and(
    eq(approvedBusinessSources.organizationId, context.tenant.organizationId),
    eq(approvedBusinessSources.workspaceId, context.tenant.workspaceId),
    eq(approvedBusinessSources.sourceId, sourceId),
  );
}

function captureWhere(context: SourceProposalPersistenceContext, captureId: string) {
  return and(
    eq(sourceCaptures.organizationId, context.tenant.organizationId),
    eq(sourceCaptures.workspaceId, context.tenant.workspaceId),
    eq(sourceCaptures.captureId, captureId),
  );
}

function batchWhere(context: SourceProposalPersistenceContext, batchId: string) {
  return and(
    eq(sourceProposalBatches.organizationId, context.tenant.organizationId),
    eq(sourceProposalBatches.workspaceId, context.tenant.workspaceId),
    eq(sourceProposalBatches.batchId, batchId),
  );
}

function candidateWhere(context: SourceProposalPersistenceContext, candidateId: string) {
  return and(
    eq(factCandidates.organizationId, context.tenant.organizationId),
    eq(factCandidates.workspaceId, context.tenant.workspaceId),
    eq(factCandidates.candidateId, candidateId),
  );
}

function idempotencyWhere(
  context: SourceProposalPersistenceContext,
  scope: string,
  idempotencyKey: string,
) {
  return and(
    eq(idempotencyRecords.organizationId, context.tenant.organizationId),
    eq(idempotencyRecords.workspaceId, context.tenant.workspaceId),
    eq(idempotencyRecords.scope, scope),
    eq(idempotencyRecords.idempotencyKey, idempotencyKey),
  );
}

function assertBatchContext(
  context: SourceProposalPersistenceContext,
  batch: SourceProposalBatch,
): void {
  if (context.tenant.workspaceId !== batch.tenantId) {
    throw new SourceProposalPersistenceError(
      "invalid_context",
      "Authenticated context does not match the proposal workspace.",
    );
  }
}

function assertCandidateContext(
  context: SourceProposalPersistenceContext,
  candidate: FactCandidate,
): void {
  if (context.tenant.workspaceId !== candidate.tenantId) {
    throw new SourceProposalPersistenceError(
      "invalid_context",
      "Authenticated context does not match the candidate workspace.",
    );
  }
}

function assertDecisionContext(
  context: SourceProposalPersistenceContext,
  candidate: FactCandidate,
  decision: FactCandidateReviewDecision,
): void {
  assertCandidateContext(context, candidate);
  if (
    context.actor.actorType !== "human" ||
    context.actor.role !== "owner" ||
    context.actor.id !== decision.decidedByActorId ||
    decision.candidateId !== candidate.candidateId ||
    decision.profileId !== candidate.profileId
  ) {
    throw new SourceProposalPersistenceError(
      "invalid_context",
      "An authenticated owner must match the proposal decision.",
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
