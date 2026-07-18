import {
  createFactCandidateReviewDecision,
  type FactCandidate,
  type FactCandidateReviewDecision,
  type FactCandidateReviewOutcome,
  type SourceProposalBatch,
} from "@novussync/domain";

export interface SourceProposalPersistenceContext {
  readonly tenant: {
    readonly organizationId: string;
    readonly workspaceId: string;
  };
  readonly actor: {
    readonly id: string;
    readonly actorType: "human" | "system";
    readonly role: "owner" | "staff" | "internal_operator" | "system";
  };
  readonly correlationId: string;
  readonly session: { readonly expiresAt: string };
}

export interface SourceProposalRepositoryPort {
  persistBatch(
    context: SourceProposalPersistenceContext,
    batch: SourceProposalBatch,
    idempotencyKey: string,
  ): Promise<SourceProposalBatch>;
  findBatch(
    context: SourceProposalPersistenceContext,
    batchId: string,
  ): Promise<SourceProposalBatch | null>;
  recordDecision(
    context: SourceProposalPersistenceContext,
    candidate: FactCandidate,
    decision: FactCandidateReviewDecision,
    expectedCurrentVersion: number,
    idempotencyKey: string,
  ): Promise<FactCandidateReviewDecision>;
  listDecisions(
    context: SourceProposalPersistenceContext,
    candidate: FactCandidate,
  ): Promise<readonly FactCandidateReviewDecision[]>;
}

export class SourceProposalDecisionAccessError extends Error {
  public readonly code: "SESSION_EXPIRED" | "TENANT_MISMATCH" | "OWNER_REQUIRED";

  public constructor(
    code: "SESSION_EXPIRED" | "TENANT_MISMATCH" | "OWNER_REQUIRED",
    message: string,
  ) {
    super(message);
    this.name = "SourceProposalDecisionAccessError";
    this.code = code;
  }
}

export async function recordSourceProposalOwnerDecision(
  repository: SourceProposalRepositoryPort,
  context: SourceProposalPersistenceContext,
  command: {
    readonly decisionId: string;
    readonly candidate: FactCandidate;
    readonly expectedCurrentVersion: number;
    readonly outcome: FactCandidateReviewOutcome;
    readonly reasonCode: string;
    readonly decidedAt: string;
    readonly idempotencyKey: string;
  },
): Promise<FactCandidateReviewDecision> {
  if (Date.parse(context.session.expiresAt) <= Date.parse(command.decidedAt)) {
    throw new SourceProposalDecisionAccessError(
      "SESSION_EXPIRED",
      "A current authenticated session is required.",
    );
  }
  if (context.tenant.workspaceId !== command.candidate.tenantId) {
    throw new SourceProposalDecisionAccessError(
      "TENANT_MISMATCH",
      "The proposal candidate belongs to another workspace.",
    );
  }
  if (context.actor.actorType !== "human" || context.actor.role !== "owner") {
    throw new SourceProposalDecisionAccessError(
      "OWNER_REQUIRED",
      "Only an authenticated owner can decide a source proposal.",
    );
  }

  const decision = createFactCandidateReviewDecision({
    decisionId: command.decisionId,
    candidate: command.candidate,
    decisionVersion: command.expectedCurrentVersion + 1,
    outcome: command.outcome,
    reasonCode: command.reasonCode,
    decidedByActorId: context.actor.id,
    decidedByRole: "owner",
    decidedAt: command.decidedAt,
  });
  return repository.recordDecision(
    context,
    command.candidate,
    decision,
    command.expectedCurrentVersion,
    command.idempotencyKey,
  );
}
