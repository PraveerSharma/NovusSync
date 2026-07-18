export const MAX_SOURCE_CAPTURE_BYTES = 256_000;

export const APPROVED_BUSINESS_SOURCE_KINDS = [
  "business_website",
  "booking_route_metadata",
] as const;

export type ApprovedBusinessSourceKind = (typeof APPROVED_BUSINESS_SOURCE_KINDS)[number];

export const SOURCE_PROPOSAL_CONFLICT_KINDS = [
  "none",
  "existing_value",
  "source_disagreement",
  "stale_source_label",
  "provider_conflict",
] as const;

export type SourceProposalConflictKind = (typeof SOURCE_PROPOSAL_CONFLICT_KINDS)[number];

export const SOURCE_PROPOSAL_FAILURE_CODES = [
  "UNSAFE_URL",
  "REDIRECT_NOT_ALLOWED",
  "CONTENT_TOO_LARGE",
  "PARSER_ERROR",
  "DUPLICATE_SOURCE_OUTPUT",
  "STALE_SOURCE_LABEL",
  "PROVIDER_CONFLICT",
] as const;

export type SourceProposalFailureCode = (typeof SOURCE_PROPOSAL_FAILURE_CODES)[number];

export const SOURCE_PROPOSAL_ERROR_CODES = [
  "INVALID_SOURCE",
  "UNSAFE_URL",
  "REDIRECT_NOT_ALLOWED",
  "CONTENT_TOO_LARGE",
  "INVALID_CAPTURE",
  "INVALID_CANDIDATE",
  "DUPLICATE_CANDIDATE",
  "SOURCE_MISMATCH",
  "TENANT_MISMATCH",
] as const;

export type SourceProposalErrorCode = (typeof SOURCE_PROPOSAL_ERROR_CODES)[number];

export type SourceProposalValue =
  | boolean
  | number
  | string
  | null
  | readonly SourceProposalValue[]
  | { readonly [key: string]: SourceProposalValue };

export interface SourceApproval {
  readonly actorId: string;
  readonly actorRole: "owner";
  readonly approvedAt: string;
}

interface ApprovedSourceBase {
  readonly sourceId: string;
  readonly tenantId: string;
  readonly approval: SourceApproval;
}

export interface ApprovedBusinessWebsiteSource extends ApprovedSourceBase {
  readonly kind: "business_website";
  readonly approvedOrigin: string;
  readonly entryUrl: string;
}

export interface ApprovedBookingRouteMetadataSource extends ApprovedSourceBase {
  readonly kind: "booking_route_metadata";
  readonly bookingRouteId: string;
  readonly routeLabel: string;
  readonly sourceReference: string;
  readonly hostedUrl: string | null;
}

export type ApprovedBusinessSource =
  ApprovedBusinessWebsiteSource | ApprovedBookingRouteMetadataSource;

export interface SourceExtractorIdentity {
  readonly id: string;
  readonly version: string;
}

export interface SourceCapture {
  readonly captureId: string;
  readonly sourceId: string;
  readonly tenantId: string;
  readonly sourceKind: ApprovedBusinessSourceKind;
  readonly sourceLocation: string;
  readonly sourceReference: string;
  readonly capturedAt: string;
  readonly extractor: SourceExtractorIdentity;
  readonly contentDigest: string;
  readonly contentBytes: number;
}

export interface SourceProposalConflict {
  readonly kind: SourceProposalConflictKind;
  readonly detail: string | null;
}

export interface FactCandidateProvenance {
  readonly sourceId: string;
  readonly sourceKind: ApprovedBusinessSourceKind;
  readonly captureId: string;
  readonly sourceLocation: string;
  readonly sourceReference: string;
  readonly capturedAt: string;
  readonly extractor: SourceExtractorIdentity;
}

export interface FactCandidate {
  readonly candidateId: string;
  readonly profileId: string;
  readonly tenantId: string;
  readonly fieldKey: string;
  readonly factTemplateVersion: string;
  readonly playbookVersion: string;
  readonly value: SourceProposalValue;
  readonly allowedUseCases: readonly string[];
  readonly provenance: FactCandidateProvenance;
  readonly confidence: number;
  readonly conflict: SourceProposalConflict;
  readonly verificationStatus: "unverified";
  readonly authority: "provisional";
  readonly createdAt: string;
}

export interface SourceProposalBatch {
  readonly batchId: string;
  readonly profileId: string;
  readonly tenantId: string;
  readonly source: ApprovedBusinessSource;
  readonly capture: SourceCapture;
  readonly candidates: readonly FactCandidate[];
  readonly status: "requires_owner_review";
  readonly createdAt: string;
}

export interface SourceProposalFailure {
  readonly status: "failed";
  readonly code: SourceProposalFailureCode;
  readonly sourceId: string;
  readonly tenantId: string;
  readonly occurredAt: string;
  readonly retryable: boolean;
  readonly safeMessage: string;
}

export class SourceProposalError extends Error {
  public readonly code: SourceProposalErrorCode;

  public constructor(code: SourceProposalErrorCode, message: string) {
    super(message);
    this.name = "SourceProposalError";
    this.code = code;
  }
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new SourceProposalError("INVALID_SOURCE", `${label} must not be empty.`);
  }
  return normalized;
}

function timestamp(value: string, code: SourceProposalErrorCode): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new SourceProposalError(code, "A valid timestamp is required.");
  }
  return new Date(parsed).toISOString();
}

function isIpLiteral(hostname: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
}

function safeHttpsUrl(value: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new SourceProposalError("UNSAFE_URL", "A valid HTTPS URL is required.");
  }

  const hostname = parsed.hostname.toLowerCase();
  const unsafeHostname =
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    !hostname.includes(".") ||
    isIpLiteral(hostname);

  if (
    parsed.protocol !== "https:" ||
    parsed.username.length > 0 ||
    parsed.password.length > 0 ||
    parsed.port.length > 0 ||
    unsafeHostname
  ) {
    throw new SourceProposalError(
      "UNSAFE_URL",
      "Only public HTTPS origins without credentials or custom ports are allowed.",
    );
  }

  parsed.hash = "";
  return parsed;
}

function approval(input: SourceApproval): SourceApproval {
  if (input.actorRole !== "owner") {
    throw new SourceProposalError("INVALID_SOURCE", "An owner must approve each source.");
  }
  return Object.freeze({
    actorId: requiredText(input.actorId, "Approval actor"),
    actorRole: "owner",
    approvedAt: timestamp(input.approvedAt, "INVALID_SOURCE"),
  });
}

export function approveBusinessWebsiteSource(input: {
  readonly sourceId: string;
  readonly tenantId: string;
  readonly entryUrl: string;
  readonly approval: SourceApproval;
}): ApprovedBusinessWebsiteSource {
  const entryUrl = safeHttpsUrl(input.entryUrl);
  return Object.freeze({
    sourceId: requiredText(input.sourceId, "Source ID"),
    tenantId: requiredText(input.tenantId, "Tenant ID"),
    kind: "business_website",
    approvedOrigin: entryUrl.origin,
    entryUrl: entryUrl.toString(),
    approval: approval(input.approval),
  });
}

export function approveBookingRouteMetadataSource(input: {
  readonly sourceId: string;
  readonly tenantId: string;
  readonly bookingRouteId: string;
  readonly routeLabel: string;
  readonly sourceReference: string;
  readonly hostedUrl?: string | null;
  readonly approval: SourceApproval;
}): ApprovedBookingRouteMetadataSource {
  return Object.freeze({
    sourceId: requiredText(input.sourceId, "Source ID"),
    tenantId: requiredText(input.tenantId, "Tenant ID"),
    kind: "booking_route_metadata",
    bookingRouteId: requiredText(input.bookingRouteId, "Booking route ID"),
    routeLabel: requiredText(input.routeLabel, "Booking route label"),
    sourceReference: requiredText(input.sourceReference, "Source reference"),
    hostedUrl:
      input.hostedUrl === undefined || input.hostedUrl === null
        ? null
        : safeHttpsUrl(input.hostedUrl).toString(),
    approval: approval(input.approval),
  });
}

export function assertApprovedWebsiteRedirect(
  source: ApprovedBusinessWebsiteSource,
  resolvedUrl: string,
): string {
  const parsed = safeHttpsUrl(resolvedUrl);
  if (parsed.origin !== source.approvedOrigin) {
    throw new SourceProposalError(
      "REDIRECT_NOT_ALLOWED",
      "Website extraction cannot leave the owner-approved origin.",
    );
  }
  return parsed.toString();
}

export function assertSourceCaptureSize(contentBytes: number): number {
  if (!Number.isSafeInteger(contentBytes) || contentBytes <= 0) {
    throw new SourceProposalError("INVALID_CAPTURE", "Capture size must be a positive integer.");
  }
  if (contentBytes > MAX_SOURCE_CAPTURE_BYTES) {
    throw new SourceProposalError(
      "CONTENT_TOO_LARGE",
      "The approved source exceeds the capture limit.",
    );
  }
  return contentBytes;
}

export function createSourceCapture(input: {
  readonly source: ApprovedBusinessSource;
  readonly captureId: string;
  readonly sourceLocation: string;
  readonly sourceReference: string;
  readonly capturedAt: string;
  readonly extractor: SourceExtractorIdentity;
  readonly contentDigest: string;
  readonly contentBytes: number;
}): SourceCapture {
  const capturedAt = timestamp(input.capturedAt, "INVALID_CAPTURE");
  if (Date.parse(capturedAt) < Date.parse(input.source.approval.approvedAt)) {
    throw new SourceProposalError("INVALID_CAPTURE", "A capture cannot predate source approval.");
  }

  let sourceLocation = requiredText(input.sourceLocation, "Source location");
  if (input.source.kind === "business_website") {
    sourceLocation = assertApprovedWebsiteRedirect(input.source, sourceLocation);
  } else if (input.sourceReference !== input.source.sourceReference) {
    throw new SourceProposalError(
      "SOURCE_MISMATCH",
      "Booking metadata must retain its approved source reference.",
    );
  }

  return Object.freeze({
    captureId: requiredText(input.captureId, "Capture ID"),
    sourceId: input.source.sourceId,
    tenantId: input.source.tenantId,
    sourceKind: input.source.kind,
    sourceLocation,
    sourceReference: requiredText(input.sourceReference, "Source reference"),
    capturedAt,
    extractor: Object.freeze({
      id: requiredText(input.extractor.id, "Extractor ID"),
      version: requiredText(input.extractor.version, "Extractor version"),
    }),
    contentDigest: requiredText(input.contentDigest, "Content digest"),
    contentBytes: assertSourceCaptureSize(input.contentBytes),
  });
}

function proposalValue(value: SourceProposalValue): SourceProposalValue {
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(value);
  } catch {
    serialized = undefined;
  }
  if (serialized === undefined) {
    throw new SourceProposalError(
      "INVALID_CANDIDATE",
      "Candidate values must be JSON serializable.",
    );
  }
  return JSON.parse(serialized) as SourceProposalValue;
}

function fieldKey(value: string): string {
  const normalized = requiredText(value, "Field key");
  if (!/^[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*)+$/.test(normalized)) {
    throw new SourceProposalError("INVALID_CANDIDATE", "Field keys must use a dotted namespace.");
  }
  return normalized;
}

export function createFactCandidate(input: {
  readonly candidateId: string;
  readonly profileId: string;
  readonly source: ApprovedBusinessSource;
  readonly capture: SourceCapture;
  readonly fieldKey: string;
  readonly factTemplateVersion: string;
  readonly playbookVersion: string;
  readonly value: SourceProposalValue;
  readonly allowedUseCases: readonly string[];
  readonly confidence: number;
  readonly conflict: SourceProposalConflict;
  readonly createdAt: string;
}): FactCandidate {
  if (
    input.capture.sourceId !== input.source.sourceId ||
    input.capture.tenantId !== input.source.tenantId ||
    input.capture.sourceKind !== input.source.kind
  ) {
    throw new SourceProposalError(
      "SOURCE_MISMATCH",
      "Candidate provenance must match its approved source and capture.",
    );
  }
  if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1) {
    throw new SourceProposalError("INVALID_CANDIDATE", "Confidence must be between zero and one.");
  }
  if (!SOURCE_PROPOSAL_CONFLICT_KINDS.includes(input.conflict.kind)) {
    throw new SourceProposalError("INVALID_CANDIDATE", "The conflict kind is not supported.");
  }

  const useCases = [...new Set(input.allowedUseCases.map((item) => item.trim()))].filter(
    (item) => item.length > 0,
  );
  if (useCases.length === 0) {
    throw new SourceProposalError(
      "INVALID_CANDIDATE",
      "At least one bounded use case is required.",
    );
  }

  const createdAt = timestamp(input.createdAt, "INVALID_CANDIDATE");
  if (Date.parse(createdAt) < Date.parse(input.capture.capturedAt)) {
    throw new SourceProposalError(
      "INVALID_CANDIDATE",
      "A candidate cannot predate its source capture.",
    );
  }

  return Object.freeze({
    candidateId: requiredText(input.candidateId, "Candidate ID"),
    profileId: requiredText(input.profileId, "Profile ID"),
    tenantId: input.source.tenantId,
    fieldKey: fieldKey(input.fieldKey),
    factTemplateVersion: requiredText(input.factTemplateVersion, "Fact template version"),
    playbookVersion: requiredText(input.playbookVersion, "Playbook version"),
    value: proposalValue(input.value),
    allowedUseCases: Object.freeze(useCases),
    provenance: Object.freeze({
      sourceId: input.source.sourceId,
      sourceKind: input.source.kind,
      captureId: input.capture.captureId,
      sourceLocation: input.capture.sourceLocation,
      sourceReference: input.capture.sourceReference,
      capturedAt: input.capture.capturedAt,
      extractor: input.capture.extractor,
    }),
    confidence: input.confidence,
    conflict: Object.freeze({
      kind: input.conflict.kind,
      detail:
        input.conflict.detail === null
          ? null
          : requiredText(input.conflict.detail, "Conflict detail"),
    }),
    verificationStatus: "unverified",
    authority: "provisional",
    createdAt,
  });
}

export function createSourceProposalBatch(input: {
  readonly batchId: string;
  readonly profileId: string;
  readonly source: ApprovedBusinessSource;
  readonly capture: SourceCapture;
  readonly candidates: readonly FactCandidate[];
  readonly createdAt: string;
}): SourceProposalBatch {
  if (input.candidates.length === 0) {
    throw new SourceProposalError(
      "INVALID_CANDIDATE",
      "A proposal batch must contain at least one candidate.",
    );
  }
  const candidateIds = new Set<string>();
  const fieldKeys = new Set<string>();
  for (const candidate of input.candidates) {
    if (
      candidate.tenantId !== input.source.tenantId ||
      candidate.profileId !== input.profileId ||
      candidate.provenance.sourceId !== input.source.sourceId ||
      candidate.provenance.captureId !== input.capture.captureId
    ) {
      throw new SourceProposalError(
        "SOURCE_MISMATCH",
        "Every candidate must belong to the same profile, source and capture.",
      );
    }
    if (candidateIds.has(candidate.candidateId) || fieldKeys.has(candidate.fieldKey)) {
      throw new SourceProposalError(
        "DUPLICATE_CANDIDATE",
        "A source cannot propose the same candidate or field twice in one batch.",
      );
    }
    candidateIds.add(candidate.candidateId);
    fieldKeys.add(candidate.fieldKey);
  }

  return Object.freeze({
    batchId: requiredText(input.batchId, "Batch ID"),
    profileId: requiredText(input.profileId, "Profile ID"),
    tenantId: input.source.tenantId,
    source: input.source,
    capture: input.capture,
    candidates: Object.freeze([...input.candidates]),
    status: "requires_owner_review",
    createdAt: timestamp(input.createdAt, "INVALID_CANDIDATE"),
  });
}

const FAILURE_MESSAGES: Readonly<Record<SourceProposalFailureCode, string>> = {
  UNSAFE_URL: "The approved source URL is not safe to process.",
  REDIRECT_NOT_ALLOWED: "The source redirected outside its approved origin.",
  CONTENT_TOO_LARGE: "The approved source is larger than the capture limit.",
  PARSER_ERROR: "The approved source could not be converted into proposals.",
  DUPLICATE_SOURCE_OUTPUT: "The source returned duplicate proposals.",
  STALE_SOURCE_LABEL: "The source label may be out of date and needs owner review.",
  PROVIDER_CONFLICT: "Operational booking data remains controlled by its provider.",
};

export function createSourceProposalFailure(input: {
  readonly source: ApprovedBusinessSource;
  readonly code: SourceProposalFailureCode;
  readonly occurredAt: string;
  readonly retryable: boolean;
}): SourceProposalFailure {
  return Object.freeze({
    status: "failed",
    code: input.code,
    sourceId: input.source.sourceId,
    tenantId: input.source.tenantId,
    occurredAt: timestamp(input.occurredAt, "INVALID_CAPTURE"),
    retryable: input.retryable,
    safeMessage: FAILURE_MESSAGES[input.code],
  });
}
