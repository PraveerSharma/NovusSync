import type { ApprovedFactVersion, FactValue } from "./fact-review.ts";

export const APPROVED_CONTEXT_USE_CASES = ["campaign_planning", "concierge_response"] as const;

export type ApprovedContextUseCase = (typeof APPROVED_CONTEXT_USE_CASES)[number];

export const APPROVED_CONTEXT_UNAVAILABLE_CODES = [
  "APPROVED_CONTEXT_MISSING",
  "APPROVED_CONTEXT_CROSS_SCOPE",
  "APPROVED_CONTEXT_NOT_CURRENT",
  "APPROVED_CONTEXT_EXPIRED",
  "APPROVED_CONTEXT_RESTRICTED",
  "APPROVED_CONTEXT_DISPUTED",
  "APPROVED_CONTEXT_INTEGRITY_CONFLICT",
] as const;

export type ApprovedContextUnavailableCode = (typeof APPROVED_CONTEXT_UNAVAILABLE_CODES)[number];

export interface ApprovedContextFactRecord {
  readonly fact: ApprovedFactVersion;
  readonly isCurrent: boolean;
  readonly expiresAt: string | null;
  readonly governance: {
    readonly status: "available" | "restricted" | "disputed";
    readonly allowedUseCases: readonly ApprovedContextUseCase[];
    readonly reasonCode: string | null;
  };
}

export interface ApprovedContextRequest {
  readonly tenantId: string;
  readonly profileId: string;
  readonly useCase: ApprovedContextUseCase;
  readonly fieldKeys: readonly string[];
  readonly asOf: string;
  readonly records: readonly ApprovedContextFactRecord[];
}

export interface UsableApprovedContextItem {
  readonly status: "usable";
  readonly fieldKey: string;
  readonly value: FactValue;
  readonly citation: {
    readonly factVersionId: string;
    readonly version: number;
    readonly sourceCandidateId: string;
    readonly source: ApprovedFactVersion["source"];
    readonly verifiedByActorId: string;
    readonly verifiedAt: string;
  };
  readonly freshness: {
    readonly status: "current";
    readonly asOf: string;
    readonly expiresAt: string | null;
  };
}

export interface UnavailableApprovedContextItem {
  readonly status: "unavailable";
  readonly fieldKey: string;
  readonly reason: {
    readonly code: ApprovedContextUnavailableCode;
    readonly detail: string;
    readonly governanceReasonCode: string | null;
  };
}

export type ApprovedContextItem = UsableApprovedContextItem | UnavailableApprovedContextItem;

export interface ApprovedContextProjection {
  readonly tenantId: string;
  readonly profileId: string;
  readonly useCase: ApprovedContextUseCase;
  readonly asOf: string;
  readonly items: readonly ApprovedContextItem[];
}

export class ApprovedContextError extends Error {
  public readonly code = "APPROVED_CONTEXT_INVALID_REQUEST" as const;

  public constructor(message: string) {
    super(message);
    this.name = "ApprovedContextError";
  }
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new ApprovedContextError(`${field} must not be empty.`);
  }
}

function parseInstant(value: string, field: string): number {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new ApprovedContextError(`${field} must be a valid ISO timestamp.`);
  }
  return timestamp;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

function unavailable(
  fieldKey: string,
  code: ApprovedContextUnavailableCode,
  detail: string,
  governanceReasonCode: string | null = null,
): UnavailableApprovedContextItem {
  return {
    status: "unavailable",
    fieldKey,
    reason: { code, detail, governanceReasonCode },
  };
}

function projectField(
  request: ApprovedContextRequest,
  fieldKey: string,
  asOfTimestamp: number,
): ApprovedContextItem {
  const matching = request.records.filter(({ fact }) => fact.fieldKey === fieldKey);
  if (matching.length === 0) {
    return unavailable(
      fieldKey,
      "APPROVED_CONTEXT_MISSING",
      "No approved fact is available for this field.",
    );
  }
  if (
    matching.some(
      ({ fact }) => fact.tenantId !== request.tenantId || fact.profileId !== request.profileId,
    )
  ) {
    return unavailable(
      fieldKey,
      "APPROVED_CONTEXT_CROSS_SCOPE",
      "A record outside the requested tenant or profile scope was rejected.",
    );
  }

  const current = matching.filter(({ isCurrent }) => isCurrent);
  if (current.length === 0) {
    return unavailable(
      fieldKey,
      "APPROVED_CONTEXT_NOT_CURRENT",
      "Only superseded or non-current fact versions are available.",
    );
  }
  if (current.length > 1) {
    return unavailable(
      fieldKey,
      "APPROVED_CONTEXT_INTEGRITY_CONFLICT",
      "More than one fact version is marked current, so no assertion is allowed.",
    );
  }

  const record = current[0];
  if (record.fact.state !== "approved") {
    return unavailable(
      fieldKey,
      "APPROVED_CONTEXT_NOT_CURRENT",
      "The current record is not an approved fact.",
    );
  }
  if (record.governance.status === "disputed") {
    return unavailable(
      fieldKey,
      "APPROVED_CONTEXT_DISPUTED",
      "The approved fact is under dispute and cannot be used.",
      record.governance.reasonCode,
    );
  }
  if (
    record.governance.status === "restricted" ||
    !record.governance.allowedUseCases.includes(request.useCase)
  ) {
    return unavailable(
      fieldKey,
      "APPROVED_CONTEXT_RESTRICTED",
      "The approved fact is not permitted for this use case.",
      record.governance.reasonCode,
    );
  }
  if (
    record.expiresAt !== null &&
    parseInstant(record.expiresAt, `${fieldKey}.expiresAt`) <= asOfTimestamp
  ) {
    return unavailable(
      fieldKey,
      "APPROVED_CONTEXT_EXPIRED",
      "The approved fact has expired and must be reviewed again.",
      record.governance.reasonCode,
    );
  }

  return {
    status: "usable",
    fieldKey,
    value: structuredClone(record.fact.value),
    citation: {
      factVersionId: record.fact.factVersionId,
      version: record.fact.version,
      sourceCandidateId: record.fact.sourceCandidateId,
      source: structuredClone(record.fact.source),
      verifiedByActorId: record.fact.verifiedByActorId,
      verifiedAt: record.fact.verifiedAt,
    },
    freshness: { status: "current", asOf: request.asOf, expiresAt: record.expiresAt },
  };
}

export function projectApprovedContext(request: ApprovedContextRequest): ApprovedContextProjection {
  assertNonEmpty(request.tenantId, "tenantId");
  assertNonEmpty(request.profileId, "profileId");
  if (!APPROVED_CONTEXT_USE_CASES.includes(request.useCase)) {
    throw new ApprovedContextError("useCase is not supported.");
  }
  if (request.fieldKeys.length === 0) {
    throw new ApprovedContextError("fieldKeys must contain at least one field.");
  }
  if (new Set(request.fieldKeys).size !== request.fieldKeys.length) {
    throw new ApprovedContextError("fieldKeys must not contain duplicates.");
  }
  for (const fieldKey of request.fieldKeys) assertNonEmpty(fieldKey, "fieldKey");

  const asOfTimestamp = parseInstant(request.asOf, "asOf");
  return deepFreeze({
    tenantId: request.tenantId,
    profileId: request.profileId,
    useCase: request.useCase,
    asOf: request.asOf,
    items: request.fieldKeys.map((fieldKey) => projectField(request, fieldKey, asOfTimestamp)),
  });
}
