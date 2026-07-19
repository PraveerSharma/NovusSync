import {
  FactReviewError,
  reviewFactCandidate,
  type ApprovedFactVersion,
  type CommandActor,
  type FactReviewAction,
  type FactReviewResult,
  type ReviewableFactCandidate,
  type TenantContext,
} from "@novussync/domain";

export type FactReviewCommandContext = Readonly<{
  tenant: TenantContext;
  actor: CommandActor;
  sessionExpiresAt: string;
  requestId: string;
}>;

export type ExecuteFactReviewInput = Readonly<{
  candidateId: string;
  expectedCurrentFactVersion: number;
  expectedDecisionVersion: number;
  action: FactReviewAction;
  reviewedValue?: unknown;
  reasonCode?: string;
  decisionId: string;
  factVersionId?: string;
  idempotencyKey: string;
}>;

export type FactReviewRepositoryContext = Readonly<{
  tenant: TenantContext;
  actorId: string;
}>;

export interface FactReviewRepositoryPort {
  findCandidate(
    context: FactReviewRepositoryContext,
    candidateId: string,
  ): Promise<ReviewableFactCandidate | null>;
  findCurrentFact(
    context: FactReviewRepositoryContext,
    profileId: string,
    fieldKey: string,
  ): Promise<ApprovedFactVersion | null>;
  commitReview(
    input: Readonly<{
      context: FactReviewRepositoryContext;
      idempotencyKey: string;
      review: FactReviewResult;
    }>,
  ): Promise<FactReviewResult>;
}

export type ExecuteFactReviewDependencies = Readonly<{
  repository: FactReviewRepositoryPort;
  now?: () => Date;
}>;

export type FactReviewAccessErrorCode =
  | "FACT_REVIEW_SESSION_INVALID"
  | "FACT_REVIEW_ACCESS_DENIED"
  | "FACT_REVIEW_CANDIDATE_NOT_FOUND"
  | "FACT_REVIEW_IDEMPOTENCY_INVALID";

export class FactReviewAccessError extends Error {
  readonly code: FactReviewAccessErrorCode;

  constructor(code: FactReviewAccessErrorCode, message: string) {
    super(message);
    this.name = "FactReviewAccessError";
    this.code = code;
  }
}

export async function executeFactReview(
  context: FactReviewCommandContext,
  input: ExecuteFactReviewInput,
  dependencies: ExecuteFactReviewDependencies,
): Promise<FactReviewResult> {
  const now = dependencies.now?.() ?? new Date();
  assertContext(context, now);
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey);
  const candidateId = normalizeIdentifier(input.candidateId, "candidateId");
  const repositoryContext = Object.freeze({
    tenant: Object.freeze({ ...context.tenant }),
    actorId: context.actor.id,
  });

  const candidate = await dependencies.repository.findCandidate(repositoryContext, candidateId);
  if (!candidate || candidate.tenantId !== context.tenant.workspaceId) {
    throw new FactReviewAccessError(
      "FACT_REVIEW_CANDIDATE_NOT_FOUND",
      "The requested fact candidate is not available in this workspace",
    );
  }

  const currentFact = await dependencies.repository.findCurrentFact(
    repositoryContext,
    candidate.profileId,
    candidate.fieldKey,
  );
  const review = reviewFactCandidate({
    candidate,
    currentFact,
    expectedCurrentFactVersion: input.expectedCurrentFactVersion,
    expectedDecisionVersion: input.expectedDecisionVersion,
    action: input.action,
    ...(input.reviewedValue !== undefined ? { reviewedValue: input.reviewedValue } : {}),
    ...(input.reasonCode !== undefined ? { reasonCode: input.reasonCode } : {}),
    decisionId: input.decisionId,
    ...(input.factVersionId !== undefined ? { factVersionId: input.factVersionId } : {}),
    actor: {
      id: context.actor.id,
      actorType: context.actor.actorType,
      role: context.actor.role,
    },
    reviewedAt: now.toISOString(),
  });

  return dependencies.repository.commitReview({
    context: repositoryContext,
    idempotencyKey,
    review,
  });
}

function assertContext(context: FactReviewCommandContext, now: Date): void {
  if (
    !context.tenant.organizationId.trim() ||
    !context.tenant.workspaceId.trim() ||
    !context.actor.id.trim() ||
    !context.requestId.trim() ||
    Number.isNaN(Date.parse(context.sessionExpiresAt))
  ) {
    throw new FactReviewAccessError(
      "FACT_REVIEW_SESSION_INVALID",
      "Fact review requires a current authenticated workspace session",
    );
  }
  if (Date.parse(context.sessionExpiresAt) <= now.getTime()) {
    throw new FactReviewAccessError(
      "FACT_REVIEW_SESSION_INVALID",
      "The fact review session has expired",
    );
  }
  if (
    context.actor.actorType !== "human" ||
    context.actor.role !== "owner" ||
    context.actor.accessKind !== "membership" ||
    context.actor.supportGrantId
  ) {
    throw new FactReviewAccessError(
      "FACT_REVIEW_ACCESS_DENIED",
      "Only a current workspace owner can review business facts",
    );
  }
}

function normalizeIdempotencyKey(value: string): string {
  const normalized = value.trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9:._-]{7,127}$/.test(normalized)) {
    throw new FactReviewAccessError(
      "FACT_REVIEW_IDEMPOTENCY_INVALID",
      "Fact review requires a bounded idempotency key",
    );
  }
  return normalized;
}

function normalizeIdentifier(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 128) {
    throw new FactReviewError("FACT_REVIEW_INVALID", `Fact review requires a valid ${field}`);
  }
  return normalized;
}
