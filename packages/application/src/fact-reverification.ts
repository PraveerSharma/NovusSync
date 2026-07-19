import type {
  ApprovedContextFactRecord,
  CommandActor,
  FactFreshnessCategory,
  FactFreshnessStatus,
  TenantContext,
} from "@novussync/domain";
import {
  classifyFactFreshness,
  FACT_FRESHNESS_DUE_SOON_DAYS,
  resolveFactFreshness,
} from "@novussync/domain";

export type FactReverificationCommandContext = Readonly<{
  tenant: TenantContext;
  actor: CommandActor;
  sessionExpiresAt: string;
  requestId: string;
}>;

export type FactReverificationRepositoryContext = Readonly<{
  tenant: TenantContext;
  actorId: string;
  requestId: string;
}>;

export type FactReverificationQueueItem = Readonly<{
  factVersionId: string;
  profileId: string;
  fieldKey: string;
  value: unknown;
  version: number;
  category: FactFreshnessCategory;
  status: FactFreshnessStatus;
  verifiedAt: string;
  expiresAt: string;
  sourceLocation: string;
  sourceReference: string;
  canReverify: boolean;
}>;

export type FactReverificationQueue = Readonly<{
  profileId: string;
  asOf: string;
  policyVersion: string;
  dueSoonDays: number;
  expiredCount: number;
  dueSoonCount: number;
  currentCount: number;
  items: readonly FactReverificationQueueItem[];
}>;

export type FactReverificationResult = Readonly<{
  kind: "reverified";
  factVersionId: string;
  supersedesFactVersionId: string;
  profileId: string;
  fieldKey: string;
  version: number;
  verifiedAt: string;
  expiresAt: string;
  policyVersion: string;
  reasonCode: "OWNER_REVERIFIED_UNCHANGED";
}>;

export type FactReverificationRequest = Readonly<{
  profileId: string;
  factVersionId: string;
  expectedVersion: number;
  newFactVersionId: string;
  idempotencyKey: string;
}>;

export interface FactFreshnessReadRepositoryPort {
  listCurrentFacts(
    context: FactReverificationRepositoryContext,
    profileId: string,
  ): Promise<readonly ApprovedContextFactRecord[]>;
}

export interface FactReverificationWriteRepositoryPort {
  findReverificationByIdempotency(
    context: FactReverificationRepositoryContext,
    idempotencyKey: string,
  ): Promise<FactReverificationResult | null>;
  commitReverification(input: {
    context: FactReverificationRepositoryContext;
    idempotencyKey: string;
    current: ApprovedContextFactRecord;
    result: FactReverificationResult;
  }): Promise<FactReverificationResult>;
}

export type FactReverificationErrorCode =
  | "FACT_REVERIFICATION_ACCESS_DENIED"
  | "FACT_REVERIFICATION_SESSION_INVALID"
  | "FACT_REVERIFICATION_INVALID_REQUEST"
  | "FACT_REVERIFICATION_FACT_NOT_FOUND"
  | "FACT_REVERIFICATION_STALE_VERSION"
  | "FACT_REVERIFICATION_NOT_TIME_SENSITIVE"
  | "FACT_REVERIFICATION_NOT_DUE";

export class FactReverificationError extends Error {
  readonly code: FactReverificationErrorCode;

  constructor(code: FactReverificationErrorCode, message: string) {
    super(message);
    this.name = "FactReverificationError";
    this.code = code;
  }
}

export async function queryFactReverificationQueue(
  context: FactReverificationCommandContext,
  query: Readonly<{ profileId: string; asOf?: string }>,
  dependencies: Readonly<{
    repository: FactFreshnessReadRepositoryPort;
    now?: () => Date;
  }>,
): Promise<FactReverificationQueue> {
  const now = dependencies.now?.() ?? new Date();
  assertOwnerContext(context, now);
  assertIdentifier(query.profileId, "profileId");
  const asOf = normalizeTimestamp(query.asOf ?? now.toISOString(), "asOf");
  const repositoryContext = toRepositoryContext(context);
  const records = await dependencies.repository.listCurrentFacts(
    repositoryContext,
    query.profileId,
  );
  const items = records
    .map((record) => toQueueItem(record, asOf))
    .filter((item): item is FactReverificationQueueItem => item !== null)
    .sort(compareQueueItems);

  return Object.freeze({
    profileId: query.profileId,
    asOf,
    policyVersion: "fact-freshness@1",
    dueSoonDays: FACT_FRESHNESS_DUE_SOON_DAYS,
    expiredCount: items.filter((item) => item.status === "expired").length,
    dueSoonCount: items.filter((item) => item.status === "due_soon").length,
    currentCount: items.filter((item) => item.status === "current").length,
    items: Object.freeze(items),
  });
}

export async function executeFactReverification(
  context: FactReverificationCommandContext,
  request: FactReverificationRequest,
  dependencies: Readonly<{
    readRepository: FactFreshnessReadRepositoryPort;
    writeRepository: FactReverificationWriteRepositoryPort;
    now?: () => Date;
  }>,
): Promise<FactReverificationResult> {
  const now = dependencies.now?.() ?? new Date();
  assertOwnerContext(context, now);
  assertRequest(request);
  const repositoryContext = toRepositoryContext(context);
  const replay = await dependencies.writeRepository.findReverificationByIdempotency(
    repositoryContext,
    request.idempotencyKey,
  );
  if (replay) {
    if (
      replay.profileId !== request.profileId ||
      replay.supersedesFactVersionId !== request.factVersionId ||
      replay.version !== request.expectedVersion + 1
    ) {
      throw new FactReverificationError(
        "FACT_REVERIFICATION_INVALID_REQUEST",
        "The idempotency key is already bound to another reverification request.",
      );
    }
    return replay;
  }

  const records = await dependencies.readRepository.listCurrentFacts(
    repositoryContext,
    request.profileId,
  );
  const current = records.find((record) => record.fact.factVersionId === request.factVersionId);
  if (!current) {
    throw new FactReverificationError(
      "FACT_REVERIFICATION_FACT_NOT_FOUND",
      "The current fact version was not found in this business profile.",
    );
  }
  if (current.fact.version !== request.expectedVersion) {
    throw new FactReverificationError(
      "FACT_REVERIFICATION_STALE_VERSION",
      "The fact changed before reverification. Refresh and review the current version.",
    );
  }

  const previousRule = resolveFactFreshness(current.fact.fieldKey, current.fact.verifiedAt);
  if (!previousRule) {
    throw new FactReverificationError(
      "FACT_REVERIFICATION_NOT_TIME_SENSITIVE",
      "This fact is not governed by a time-sensitive freshness rule.",
    );
  }
  const previousExpiry = current.expiresAt ?? previousRule.expiresAt;
  if (classifyFactFreshness(previousExpiry, now.toISOString()) === "current") {
    throw new FactReverificationError(
      "FACT_REVERIFICATION_NOT_DUE",
      "This fact is still current and is not yet available for reverification.",
    );
  }

  const verifiedAt = now.toISOString();
  const nextRule = resolveFactFreshness(current.fact.fieldKey, verifiedAt);
  if (!nextRule) {
    throw new FactReverificationError(
      "FACT_REVERIFICATION_NOT_TIME_SENSITIVE",
      "This fact is not governed by a time-sensitive freshness rule.",
    );
  }
  const result: FactReverificationResult = Object.freeze({
    kind: "reverified",
    factVersionId: request.newFactVersionId,
    supersedesFactVersionId: current.fact.factVersionId,
    profileId: current.fact.profileId,
    fieldKey: current.fact.fieldKey,
    version: current.fact.version + 1,
    verifiedAt,
    expiresAt: nextRule.expiresAt,
    policyVersion: nextRule.policyVersion,
    reasonCode: "OWNER_REVERIFIED_UNCHANGED",
  });
  return dependencies.writeRepository.commitReverification({
    context: repositoryContext,
    idempotencyKey: request.idempotencyKey,
    current,
    result,
  });
}

function toQueueItem(
  record: ApprovedContextFactRecord,
  asOf: string,
): FactReverificationQueueItem | null {
  const rule = resolveFactFreshness(record.fact.fieldKey, record.fact.verifiedAt);
  if (!rule) return null;
  const expiresAt = record.expiresAt ?? rule.expiresAt;
  const status = classifyFactFreshness(expiresAt, asOf);
  return Object.freeze({
    factVersionId: record.fact.factVersionId,
    profileId: record.fact.profileId,
    fieldKey: record.fact.fieldKey,
    value: record.fact.value,
    version: record.fact.version,
    category: rule.category,
    status,
    verifiedAt: record.fact.verifiedAt,
    expiresAt,
    sourceLocation: record.fact.source.sourceLocation,
    sourceReference: record.fact.source.sourceReference,
    canReverify: status !== "current",
  });
}

function compareQueueItems(left: FactReverificationQueueItem, right: FactReverificationQueueItem) {
  const rank: Record<FactFreshnessStatus, number> = { expired: 0, due_soon: 1, current: 2 };
  return rank[left.status] - rank[right.status] || left.expiresAt.localeCompare(right.expiresAt);
}

function assertOwnerContext(context: FactReverificationCommandContext, now: Date): void {
  if (
    context.actor.actorType !== "human" ||
    context.actor.role !== "owner" ||
    context.actor.accessKind !== "membership" ||
    context.actor.supportGrantId
  ) {
    throw new FactReverificationError(
      "FACT_REVERIFICATION_ACCESS_DENIED",
      "Only a directly authorized business owner can reverify approved facts.",
    );
  }
  const expiresAt = Date.parse(context.sessionExpiresAt);
  if (Number.isNaN(expiresAt) || expiresAt <= now.getTime()) {
    throw new FactReverificationError(
      "FACT_REVERIFICATION_SESSION_INVALID",
      "The authenticated session is missing or expired.",
    );
  }
  assertIdentifier(context.requestId, "requestId");
}

function assertRequest(request: FactReverificationRequest): void {
  assertIdentifier(request.profileId, "profileId");
  assertIdentifier(request.factVersionId, "factVersionId");
  assertIdentifier(request.newFactVersionId, "newFactVersionId");
  assertIdentifier(request.idempotencyKey, "idempotencyKey");
  if (!Number.isSafeInteger(request.expectedVersion) || request.expectedVersion < 1) {
    throw new FactReverificationError(
      "FACT_REVERIFICATION_INVALID_REQUEST",
      "Fact reverification requires a positive expected version.",
    );
  }
}

function assertIdentifier(value: string, field: string): void {
  if (!value.trim() || value.length > 240) {
    throw new FactReverificationError(
      "FACT_REVERIFICATION_INVALID_REQUEST",
      "Fact reverification requires a valid " + field + ".",
    );
  }
}

function normalizeTimestamp(value: string, field: string): string {
  if (!value.trim() || Number.isNaN(Date.parse(value))) {
    throw new FactReverificationError(
      "FACT_REVERIFICATION_INVALID_REQUEST",
      "Fact reverification requires a valid " + field + " timestamp.",
    );
  }
  return new Date(value).toISOString();
}

function toRepositoryContext(
  context: FactReverificationCommandContext,
): FactReverificationRepositoryContext {
  return Object.freeze({
    tenant: context.tenant,
    actorId: context.actor.id,
    requestId: context.requestId,
  });
}
