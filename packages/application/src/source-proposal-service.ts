import {
  SourceProposalError,
  assertApprovedWebsiteRedirect,
  createFactCandidate,
  createSourceCapture,
  createSourceProposalBatch,
  createSourceProposalFailure,
  type ApprovedBusinessSource,
  type SourceProposalBatch,
  type SourceProposalConflict,
  type SourceProposalFailure,
  type SourceProposalFailureCode,
  type SourceProposalValue,
} from "@novussync/domain";

export interface SourceProposalActorContext {
  readonly actorId: string;
  readonly tenantId: string;
  readonly role: "owner" | "operator";
  readonly sessionExpiresAt: string;
}

export interface ExtractedFactProposal {
  readonly candidateId: string;
  readonly fieldKey: string;
  readonly factTemplateVersion: string;
  readonly value: SourceProposalValue;
  readonly allowedUseCases: readonly string[];
  readonly confidence: number;
  readonly conflict: SourceProposalConflict;
}

export interface SourceExtractionSuccess {
  readonly status: "success";
  readonly batchId: string;
  readonly captureId: string;
  readonly sourceLocation: string;
  readonly sourceReference: string;
  readonly resolvedUrl: string | null;
  readonly capturedAt: string;
  readonly extractor: { readonly id: string; readonly version: string };
  readonly contentDigest: string;
  readonly contentBytes: number;
  readonly proposals: readonly ExtractedFactProposal[];
}

export interface SourceExtractionFailure {
  readonly status: "failure";
  readonly code: SourceProposalFailureCode;
  readonly retryable: boolean;
}

export type SourceExtractionResult = SourceExtractionSuccess | SourceExtractionFailure;

export interface SourceExtractorPort {
  extract(input: {
    readonly requestId: string;
    readonly tenantId: string;
    readonly profileId: string;
    readonly source: ApprovedBusinessSource;
    readonly requestedAt: string;
  }): Promise<SourceExtractionResult>;
}

export interface PrepareSourceProposalCommand {
  readonly requestId: string;
  readonly profileId: string;
  readonly playbookVersion: string;
  readonly source: ApprovedBusinessSource;
  readonly allowedFieldKeys: readonly string[];
  readonly requestedAt: string;
}

export type PrepareSourceProposalResult =
  | { readonly status: "ready_for_owner_review"; readonly batch: SourceProposalBatch }
  | SourceProposalFailure;

export const PROVIDER_OWNED_BOOKING_FIELD_KEYS = Object.freeze([
  "booking.availability",
  "booking.capacity",
  "booking.conflicts",
  "booking.paymentState",
  "booking.price",
  "booking.routing",
  "booking.schedule",
  "booking.waitlist",
]);

export class SourceProposalAccessError extends Error {
  public readonly code: "SESSION_EXPIRED" | "TENANT_MISMATCH";

  public constructor(code: "SESSION_EXPIRED" | "TENANT_MISMATCH", message: string) {
    super(message);
    this.name = "SourceProposalAccessError";
    this.code = code;
  }
}

function failure(
  source: ApprovedBusinessSource,
  code: SourceProposalFailureCode,
  occurredAt: string,
  retryable: boolean,
): SourceProposalFailure {
  return createSourceProposalFailure({ source, code, occurredAt, retryable });
}

function mappedFailureCode(error: unknown): SourceProposalFailureCode {
  if (!(error instanceof SourceProposalError)) {
    return "PARSER_ERROR";
  }
  switch (error.code) {
    case "UNSAFE_URL":
      return "UNSAFE_URL";
    case "REDIRECT_NOT_ALLOWED":
      return "REDIRECT_NOT_ALLOWED";
    case "CONTENT_TOO_LARGE":
      return "CONTENT_TOO_LARGE";
    case "DUPLICATE_CANDIDATE":
      return "DUPLICATE_SOURCE_OUTPUT";
    default:
      return "PARSER_ERROR";
  }
}

function isProviderOwnedBookingField(fieldKey: string): boolean {
  return PROVIDER_OWNED_BOOKING_FIELD_KEYS.includes(fieldKey);
}

export async function prepareSourceProposalBatch(
  extractor: SourceExtractorPort,
  actor: SourceProposalActorContext,
  command: PrepareSourceProposalCommand,
): Promise<PrepareSourceProposalResult> {
  if (Date.parse(actor.sessionExpiresAt) <= Date.parse(command.requestedAt)) {
    throw new SourceProposalAccessError(
      "SESSION_EXPIRED",
      "A current authenticated session is required.",
    );
  }
  if (actor.tenantId !== command.source.tenantId) {
    throw new SourceProposalAccessError(
      "TENANT_MISMATCH",
      "The approved source belongs to another workspace.",
    );
  }

  let extraction: SourceExtractionResult;
  try {
    extraction = await extractor.extract({
      requestId: command.requestId,
      tenantId: actor.tenantId,
      profileId: command.profileId,
      source: command.source,
      requestedAt: command.requestedAt,
    });
  } catch {
    return failure(command.source, "PARSER_ERROR", command.requestedAt, true);
  }

  if (extraction.status === "failure") {
    return failure(command.source, extraction.code, command.requestedAt, extraction.retryable);
  }

  const allowedFields = new Set(command.allowedFieldKeys);
  if (extraction.proposals.some((proposal) => !allowedFields.has(proposal.fieldKey))) {
    return failure(command.source, "PARSER_ERROR", command.requestedAt, false);
  }
  if (
    command.source.kind === "booking_route_metadata" &&
    extraction.proposals.some((proposal) => isProviderOwnedBookingField(proposal.fieldKey))
  ) {
    return failure(command.source, "PROVIDER_CONFLICT", command.requestedAt, false);
  }

  try {
    if (command.source.kind === "business_website" && extraction.resolvedUrl !== null) {
      assertApprovedWebsiteRedirect(command.source, extraction.resolvedUrl);
    }
    const capture = createSourceCapture({
      source: command.source,
      captureId: extraction.captureId,
      sourceLocation: extraction.sourceLocation,
      sourceReference: extraction.sourceReference,
      capturedAt: extraction.capturedAt,
      extractor: extraction.extractor,
      contentDigest: extraction.contentDigest,
      contentBytes: extraction.contentBytes,
    });
    const candidates = extraction.proposals.map((proposal) =>
      createFactCandidate({
        candidateId: proposal.candidateId,
        profileId: command.profileId,
        source: command.source,
        capture,
        fieldKey: proposal.fieldKey,
        factTemplateVersion: proposal.factTemplateVersion,
        playbookVersion: command.playbookVersion,
        value: proposal.value,
        allowedUseCases: proposal.allowedUseCases,
        confidence: proposal.confidence,
        conflict: proposal.conflict,
        createdAt: extraction.capturedAt,
      }),
    );
    const batch = createSourceProposalBatch({
      batchId: extraction.batchId,
      profileId: command.profileId,
      source: command.source,
      capture,
      candidates,
      createdAt: extraction.capturedAt,
    });
    return Object.freeze({ status: "ready_for_owner_review", batch });
  } catch (error) {
    return failure(
      command.source,
      mappedFailureCode(error),
      command.requestedAt,
      mappedFailureCode(error) === "PARSER_ERROR",
    );
  }
}
