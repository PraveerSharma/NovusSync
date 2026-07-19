import type { ActorId, TenantId } from "./index.ts";

export const FACT_REVIEW_ACTIONS = [
  "verify",
  "correct_and_verify",
  "reject",
  "resolve_conflict",
] as const;

export type FactReviewAction = (typeof FACT_REVIEW_ACTIONS)[number];

export const FACT_CONFLICT_KINDS = [
  "none",
  "existing_value",
  "source_disagreement",
  "stale_source_label",
  "provider_conflict",
] as const;

export type FactConflictKind = (typeof FACT_CONFLICT_KINDS)[number];

export interface FactValueObject {
  readonly [key: string]: FactValue;
}

export type FactValue = string | number | boolean | readonly FactValue[] | FactValueObject;

export type FactSourceSnapshot = Readonly<{
  sourceId: string;
  captureId: string;
  sourceLocation: string;
  sourceReference: string;
  capturedAt: string;
  extractorId: string;
  extractorVersion: string;
}>;

export type ReviewableFactCandidate = Readonly<{
  candidateId: string;
  tenantId: TenantId;
  profileId: string;
  fieldKey: string;
  value: FactValue;
  authority: "provisional";
  verificationStatus: "unverified";
  source: FactSourceSnapshot;
  conflict: Readonly<{
    kind: FactConflictKind;
    detail: string | null;
  }>;
}>;

export type ApprovedFactVersion = Readonly<{
  factVersionId: string;
  tenantId: TenantId;
  profileId: string;
  fieldKey: string;
  version: number;
  value: FactValue;
  state: "approved";
  sourceCandidateId: string;
  source: FactSourceSnapshot;
  reviewAction: Exclude<FactReviewAction, "reject">;
  reasonCode: string;
  supersedesFactVersionId: string | null;
  conflictResolution: Readonly<{
    kind: Exclude<FactConflictKind, "none">;
    reasonCode: string;
  }> | null;
  verifiedByActorId: ActorId;
  verifiedByRole: "owner";
  verifiedAt: string;
}>;

export type FactReviewDecision = Readonly<{
  decisionId: string;
  candidateId: string;
  tenantId: TenantId;
  profileId: string;
  fieldKey: string;
  decisionVersion: number;
  action: FactReviewAction;
  reasonCode: string;
  candidateDisposition: "approved" | "rejected";
  approvedFactVersionId: string | null;
  profileApplicationStatus: "not_applied";
  decidedByActorId: ActorId;
  decidedByRole: "owner";
  decidedAt: string;
}>;

export type FactReviewResult =
  | Readonly<{
      kind: "approved";
      decision: FactReviewDecision;
      factVersion: ApprovedFactVersion;
    }>
  | Readonly<{
      kind: "rejected";
      decision: FactReviewDecision;
      currentFactVersionId: string | null;
    }>;

export type ReviewFactCandidateInput = Readonly<{
  candidate: ReviewableFactCandidate;
  currentFact: ApprovedFactVersion | null;
  expectedCurrentFactVersion: number;
  expectedDecisionVersion: number;
  action: FactReviewAction;
  reviewedValue?: unknown;
  reasonCode?: string;
  decisionId: string;
  factVersionId?: string;
  actor: Readonly<{
    id: ActorId;
    actorType: "human" | "system";
    role: "owner" | "staff" | "internal_operator" | "system";
  }>;
  reviewedAt: string;
}>;

export type FactReviewErrorCode =
  | "FACT_REVIEW_INVALID"
  | "FACT_REVIEW_NOT_AUTHORIZED"
  | "FACT_REVIEW_STALE_VERSION"
  | "FACT_REVIEW_ACTION_NOT_ALLOWED"
  | "FACT_REVIEW_REASON_REQUIRED"
  | "FACT_REVIEW_CONFLICT_REQUIRES_RESOLUTION"
  | "FACT_REVIEW_CORRECTION_REQUIRED";

export class FactReviewError extends Error {
  readonly code: FactReviewErrorCode;

  constructor(code: FactReviewErrorCode, message: string) {
    super(message);
    this.name = "FactReviewError";
    this.code = code;
  }
}

const MAX_FACT_VALUE_BYTES = 16_384;
const MAX_FACT_VALUE_DEPTH = 6;
const MAX_FACT_COLLECTION_ITEMS = 50;

export function reviewFactCandidate(input: ReviewFactCandidateInput): FactReviewResult {
  assertOwner(input.actor);
  const candidate = normalizeCandidate(input.candidate);
  const currentFact = normalizeCurrentFact(input.currentFact, candidate);
  assertExpectedVersions(input, currentFact);

  if (!FACT_REVIEW_ACTIONS.includes(input.action)) {
    throw new FactReviewError(
      "FACT_REVIEW_INVALID",
      "Fact review requires a supported owner action",
    );
  }

  const reviewedAt = parseTimestamp(input.reviewedAt, "reviewedAt");
  if (Date.parse(candidate.source.capturedAt) > Date.parse(reviewedAt)) {
    throw new FactReviewError(
      "FACT_REVIEW_INVALID",
      "Fact review cannot predate its source capture",
    );
  }
  if (currentFact && Date.parse(currentFact.verifiedAt) > Date.parse(reviewedAt)) {
    throw new FactReviewError(
      "FACT_REVIEW_INVALID",
      "Fact review cannot predate the current approved fact",
    );
  }

  const decisionId = normalizeIdentifier(input.decisionId, "decisionId");
  const reasonCode = normalizeReasonCode(input.reasonCode);
  const decisionVersion = input.expectedDecisionVersion + 1;

  if (input.action === "reject") {
    const rejectionReason = requireReason(reasonCode, "Rejecting a fact requires a reason");
    const decision = createDecision({
      candidate,
      decisionId,
      decisionVersion,
      action: input.action,
      reasonCode: rejectionReason,
      disposition: "rejected",
      approvedFactVersionId: null,
      actorId: input.actor.id,
      decidedAt: reviewedAt,
    });

    return Object.freeze({
      kind: "rejected",
      decision,
      currentFactVersionId: currentFact?.factVersionId ?? null,
    });
  }

  const approvedValue = resolveApprovedValue(input, candidate, reasonCode);
  const factVersionId = normalizeIdentifier(input.factVersionId, "factVersionId");
  const normalizedReason = reasonForApproval(input.action, reasonCode);
  const conflictResolution =
    input.action === "resolve_conflict"
      ? Object.freeze({
          kind: candidate.conflict.kind as Exclude<FactConflictKind, "none">,
          reasonCode: normalizedReason,
        })
      : null;

  const factVersion: ApprovedFactVersion = Object.freeze({
    factVersionId,
    tenantId: candidate.tenantId,
    profileId: candidate.profileId,
    fieldKey: candidate.fieldKey,
    version: (currentFact?.version ?? 0) + 1,
    value: approvedValue,
    state: "approved",
    sourceCandidateId: candidate.candidateId,
    source: candidate.source,
    reviewAction: input.action,
    reasonCode: normalizedReason,
    supersedesFactVersionId: currentFact?.factVersionId ?? null,
    conflictResolution,
    verifiedByActorId: input.actor.id,
    verifiedByRole: "owner",
    verifiedAt: reviewedAt,
  });

  const decision = createDecision({
    candidate,
    decisionId,
    decisionVersion,
    action: input.action,
    reasonCode: normalizedReason,
    disposition: "approved",
    approvedFactVersionId: factVersionId,
    actorId: input.actor.id,
    decidedAt: reviewedAt,
  });

  return Object.freeze({ kind: "approved", decision, factVersion });
}

function resolveApprovedValue(
  input: ReviewFactCandidateInput,
  candidate: ReviewableFactCandidate,
  reasonCode: string | undefined,
): FactValue {
  if (input.action === "verify") {
    if (candidate.conflict.kind !== "none") {
      throw new FactReviewError(
        "FACT_REVIEW_CONFLICT_REQUIRES_RESOLUTION",
        "A conflicting proposal must use an explicit conflict resolution action",
      );
    }
    if (input.reviewedValue !== undefined) {
      throw new FactReviewError(
        "FACT_REVIEW_ACTION_NOT_ALLOWED",
        "Verification cannot silently replace the proposed value",
      );
    }
    return candidate.value;
  }

  if (input.action === "correct_and_verify") {
    if (candidate.conflict.kind !== "none") {
      throw new FactReviewError(
        "FACT_REVIEW_CONFLICT_REQUIRES_RESOLUTION",
        "A conflicting proposal must be resolved rather than corrected implicitly",
      );
    }
    requireReason(reasonCode, "Correcting a fact requires a reason");
    const correctedValue = normalizeFactValue(input.reviewedValue, "reviewedValue");
    if (factValuesEqual(candidate.value, correctedValue)) {
      throw new FactReviewError(
        "FACT_REVIEW_CORRECTION_REQUIRED",
        "Correct and verify requires a value that differs from the proposal",
      );
    }
    return correctedValue;
  }

  if (input.action === "resolve_conflict") {
    if (candidate.conflict.kind === "none") {
      throw new FactReviewError(
        "FACT_REVIEW_ACTION_NOT_ALLOWED",
        "Conflict resolution requires a visible source or current-value conflict",
      );
    }
    requireReason(reasonCode, "Resolving a conflict requires a reason");
    return normalizeFactValue(input.reviewedValue, "reviewedValue");
  }

  throw new FactReviewError(
    "FACT_REVIEW_ACTION_NOT_ALLOWED",
    "The requested fact review action cannot approve a value",
  );
}

function createDecision(input: {
  candidate: ReviewableFactCandidate;
  decisionId: string;
  decisionVersion: number;
  action: FactReviewAction;
  reasonCode: string;
  disposition: "approved" | "rejected";
  approvedFactVersionId: string | null;
  actorId: ActorId;
  decidedAt: string;
}): FactReviewDecision {
  return Object.freeze({
    decisionId: input.decisionId,
    candidateId: input.candidate.candidateId,
    tenantId: input.candidate.tenantId,
    profileId: input.candidate.profileId,
    fieldKey: input.candidate.fieldKey,
    decisionVersion: input.decisionVersion,
    action: input.action,
    reasonCode: input.reasonCode,
    candidateDisposition: input.disposition,
    approvedFactVersionId: input.approvedFactVersionId,
    profileApplicationStatus: "not_applied",
    decidedByActorId: input.actorId,
    decidedByRole: "owner",
    decidedAt: input.decidedAt,
  });
}

function normalizeCandidate(candidate: ReviewableFactCandidate): ReviewableFactCandidate {
  const candidateId = normalizeIdentifier(candidate.candidateId, "candidateId");
  const tenantId = normalizeIdentifier(candidate.tenantId, "tenantId");
  const profileId = normalizeIdentifier(candidate.profileId, "profileId");
  const fieldKey = normalizeFieldKey(candidate.fieldKey);
  if (candidate.authority !== "provisional" || candidate.verificationStatus !== "unverified") {
    throw new FactReviewError(
      "FACT_REVIEW_ACTION_NOT_ALLOWED",
      "Only provisional, unverified candidates can enter owner review",
    );
  }
  if (!FACT_CONFLICT_KINDS.includes(candidate.conflict.kind)) {
    throw new FactReviewError("FACT_REVIEW_INVALID", "Fact candidate has an unknown conflict");
  }
  const detail = candidate.conflict.detail?.trim() || null;
  if ((candidate.conflict.kind === "none") !== (detail === null)) {
    throw new FactReviewError(
      "FACT_REVIEW_INVALID",
      "Fact conflict detail must match the conflict state",
    );
  }

  return Object.freeze({
    candidateId,
    tenantId,
    profileId,
    fieldKey,
    value: normalizeFactValue(candidate.value, "candidate.value"),
    authority: "provisional",
    verificationStatus: "unverified",
    source: normalizeSource(candidate.source),
    conflict: Object.freeze({ kind: candidate.conflict.kind, detail }),
  });
}

function normalizeCurrentFact(
  current: ApprovedFactVersion | null,
  candidate: ReviewableFactCandidate,
): ApprovedFactVersion | null {
  if (!current) return null;
  if (
    current.state !== "approved" ||
    current.tenantId !== candidate.tenantId ||
    current.profileId !== candidate.profileId ||
    current.fieldKey !== candidate.fieldKey ||
    !Number.isSafeInteger(current.version) ||
    current.version < 1
  ) {
    throw new FactReviewError(
      "FACT_REVIEW_INVALID",
      "Current fact does not match the reviewed field and tenant",
    );
  }
  normalizeIdentifier(current.factVersionId, "currentFact.factVersionId");
  parseTimestamp(current.verifiedAt, "currentFact.verifiedAt");
  normalizeFactValue(current.value, "currentFact.value");
  return current;
}

function assertExpectedVersions(
  input: ReviewFactCandidateInput,
  currentFact: ApprovedFactVersion | null,
): void {
  if (
    !Number.isSafeInteger(input.expectedCurrentFactVersion) ||
    input.expectedCurrentFactVersion < 0 ||
    !Number.isSafeInteger(input.expectedDecisionVersion) ||
    input.expectedDecisionVersion < 0
  ) {
    throw new FactReviewError(
      "FACT_REVIEW_INVALID",
      "Fact review requires non-negative optimistic versions",
    );
  }
  if ((currentFact?.version ?? 0) !== input.expectedCurrentFactVersion) {
    throw new FactReviewError(
      "FACT_REVIEW_STALE_VERSION",
      "The approved fact changed before this review was recorded",
    );
  }
}

function assertOwner(actor: ReviewFactCandidateInput["actor"]): void {
  if (actor.actorType !== "human" || actor.role !== "owner" || !actor.id.trim()) {
    throw new FactReviewError(
      "FACT_REVIEW_NOT_AUTHORIZED",
      "Only an authenticated human owner can decide business facts",
    );
  }
}

function normalizeSource(source: FactSourceSnapshot): FactSourceSnapshot {
  return Object.freeze({
    sourceId: normalizeIdentifier(source.sourceId, "source.sourceId"),
    captureId: normalizeIdentifier(source.captureId, "source.captureId"),
    sourceLocation: normalizeBoundedText(source.sourceLocation, "source.sourceLocation", 2_048),
    sourceReference: normalizeBoundedText(source.sourceReference, "source.sourceReference", 512),
    capturedAt: parseTimestamp(source.capturedAt, "source.capturedAt"),
    extractorId: normalizeIdentifier(source.extractorId, "source.extractorId"),
    extractorVersion: normalizeIdentifier(source.extractorVersion, "source.extractorVersion"),
  });
}

function normalizeFactValue(value: unknown, field: string, depth = 0): FactValue {
  if (depth > MAX_FACT_VALUE_DEPTH) {
    throw new FactReviewError("FACT_REVIEW_INVALID", `${field} exceeds the allowed depth`);
  }
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized || Buffer.byteLength(normalized, "utf8") > MAX_FACT_VALUE_BYTES) {
      throw new FactReviewError(
        "FACT_REVIEW_INVALID",
        `${field} requires a non-empty bounded string`,
      );
    }
    return normalized;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new FactReviewError("FACT_REVIEW_INVALID", `${field} requires a finite number`);
    }
    return value;
  }
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    if (!value.length || value.length > MAX_FACT_COLLECTION_ITEMS) {
      throw new FactReviewError(
        "FACT_REVIEW_INVALID",
        `${field} requires a non-empty bounded array`,
      );
    }
    const normalized = value.map((item, index) =>
      normalizeFactValue(item, `${field}[${index}]`, depth + 1),
    );
    assertSerializedSize(normalized, field);
    return Object.freeze(normalized);
  }
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right),
    );
    if (!entries.length || entries.length > MAX_FACT_COLLECTION_ITEMS) {
      throw new FactReviewError(
        "FACT_REVIEW_INVALID",
        `${field} requires a non-empty bounded object`,
      );
    }
    const normalized: Record<string, FactValue> = {};
    for (const [key, item] of entries) {
      if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(key)) {
        throw new FactReviewError("FACT_REVIEW_INVALID", `${field} contains an invalid key`);
      }
      normalized[key] = normalizeFactValue(item, `${field}.${key}`, depth + 1);
    }
    assertSerializedSize(normalized, field);
    return Object.freeze(normalized);
  }
  throw new FactReviewError(
    "FACT_REVIEW_INVALID",
    `${field} must be an explicit JSON-compatible business fact`,
  );
}

function assertSerializedSize(value: unknown, field: string): void {
  if (Buffer.byteLength(JSON.stringify(value), "utf8") > MAX_FACT_VALUE_BYTES) {
    throw new FactReviewError("FACT_REVIEW_INVALID", `${field} exceeds the allowed size`);
  }
}

function factValuesEqual(left: FactValue, right: FactValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function normalizeIdentifier(value: string | undefined, field: string): string {
  const normalized = value?.trim();
  if (!normalized || normalized.length > 128 || !/^[a-zA-Z0-9][a-zA-Z0-9:._-]*$/.test(normalized)) {
    throw new FactReviewError("FACT_REVIEW_INVALID", `Fact review requires a valid ${field}`);
  }
  return normalized;
}

function normalizeFieldKey(value: string): string {
  const normalized = value.trim();
  if (!/^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)+$/.test(normalized)) {
    throw new FactReviewError("FACT_REVIEW_INVALID", "Fact review requires a valid field key");
  }
  return normalized;
}

function normalizeReasonCode(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  if (!/^[A-Z][A-Z0-9_-]{0,63}$/.test(normalized)) {
    throw new FactReviewError(
      "FACT_REVIEW_INVALID",
      "Fact review reason must be a stable uppercase identifier",
    );
  }
  return normalized;
}

function requireReason(value: string | undefined, message: string): string {
  if (!value) throw new FactReviewError("FACT_REVIEW_REASON_REQUIRED", message);
  return value;
}

function reasonForApproval(action: Exclude<FactReviewAction, "reject">, reason?: string): string {
  if (action === "verify") return reason ?? "OWNER_VERIFIED";
  return requireReason(reason, "This fact review action requires a reason");
}

function normalizeBoundedText(value: string, field: string, maxLength: number): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new FactReviewError("FACT_REVIEW_INVALID", `Fact review requires a valid ${field}`);
  }
  return normalized;
}

function parseTimestamp(value: string, field: string): string {
  if (!value.trim() || Number.isNaN(Date.parse(value))) {
    throw new FactReviewError("FACT_REVIEW_INVALID", `Fact review requires a valid ${field}`);
  }
  return value;
}
