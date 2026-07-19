import { createHash } from "node:crypto";

import {
  APPROVED_CONTEXT_USE_CASES,
  projectApprovedContext,
  type ApprovedContextFactRecord,
  type ApprovedContextItem,
  type ApprovedContextUseCase,
  type CommandActor,
  type TenantContext,
} from "@novussync/domain";

export interface ApprovedContextQueryContext {
  readonly tenant: TenantContext;
  readonly actor: CommandActor;
  readonly sessionExpiresAt: string;
  readonly requestId: string;
}

export interface ApprovedContextQuery {
  readonly tenant: TenantContext;
  readonly profileId: string;
  readonly useCase: ApprovedContextUseCase;
  readonly fieldKeys: readonly string[];
}

export interface ApprovedContextRepositoryContext {
  readonly tenant: TenantContext;
  readonly actorId: string;
  readonly requestId: string;
}

export interface ApprovedContextRepository {
  loadApprovedContextRecords(
    context: ApprovedContextRepositoryContext,
    input: {
      readonly profileId: string;
      readonly useCase: ApprovedContextUseCase;
      readonly fieldKeys: readonly string[];
    },
  ): Promise<readonly ApprovedContextFactRecord[]>;
  persistApprovedContextSnapshot(
    context: ApprovedContextRepositoryContext,
    snapshot: ApprovedContextSnapshot,
  ): Promise<void>;
}

export interface ApprovedContextSnapshot {
  readonly snapshotId: `verified-context:sha256:${string}`;
  readonly schemaVersion: 1;
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly profileId: string;
  readonly useCase: ApprovedContextUseCase;
  readonly asOf: string;
  readonly items: readonly ApprovedContextItem[];
}

export interface ApprovedContextQueryDependencies {
  readonly repository: ApprovedContextRepository;
  readonly now?: () => Date;
}

export class ApprovedContextQueryError extends Error {
  public readonly code:
    | "APPROVED_CONTEXT_UNAUTHORIZED"
    | "APPROVED_CONTEXT_SESSION_EXPIRED"
    | "APPROVED_CONTEXT_INVALID_QUERY";

  public constructor(
    code:
      | "APPROVED_CONTEXT_UNAUTHORIZED"
      | "APPROVED_CONTEXT_SESSION_EXPIRED"
      | "APPROVED_CONTEXT_INVALID_QUERY",
    message: string,
  ) {
    super(message);
    this.name = "ApprovedContextQueryError";
    this.code = code;
  }
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

function actorShapeIsAuthorized(actor: CommandActor): boolean {
  if (actor.actorType === "system") {
    return false;
  }
  if (actor.role === "system" || actor.accessKind === "system") return false;
  if (actor.role === "internal_operator") {
    return actor.accessKind === "support_grant" && Boolean(actor.supportGrantId?.trim());
  }
  return (
    (actor.role === "owner" || actor.role === "staff") &&
    actor.accessKind === "membership" &&
    !actor.supportGrantId
  );
}

function authorize(
  context: ApprovedContextQueryContext,
  query: ApprovedContextQuery,
  now: Date,
): void {
  if (
    context.tenant.organizationId !== query.tenant.organizationId ||
    context.tenant.workspaceId !== query.tenant.workspaceId ||
    context.actor.id.trim().length === 0 ||
    context.requestId.trim().length === 0 ||
    !actorShapeIsAuthorized(context.actor)
  ) {
    throw new ApprovedContextQueryError(
      "APPROVED_CONTEXT_UNAUTHORIZED",
      "The actor is not authorized for the requested workspace scope.",
    );
  }
  const expiresAt = Date.parse(context.sessionExpiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= now.getTime()) {
    throw new ApprovedContextQueryError(
      "APPROVED_CONTEXT_SESSION_EXPIRED",
      "The authenticated session has expired.",
    );
  }
}

function validateQuery(query: ApprovedContextQuery): void {
  if (
    query.profileId.trim().length === 0 ||
    query.fieldKeys.length === 0 ||
    query.fieldKeys.some((fieldKey) => fieldKey.trim().length === 0) ||
    new Set(query.fieldKeys).size !== query.fieldKeys.length ||
    !APPROVED_CONTEXT_USE_CASES.includes(query.useCase)
  ) {
    throw new ApprovedContextQueryError(
      "APPROVED_CONTEXT_INVALID_QUERY",
      "Approved context requires a profile, supported use case, and unique field keys.",
    );
  }
}

export async function queryApprovedContext(
  context: ApprovedContextQueryContext,
  query: ApprovedContextQuery,
  dependencies: ApprovedContextQueryDependencies,
): Promise<ApprovedContextSnapshot> {
  const now = (dependencies.now ?? (() => new Date()))();
  authorize(context, query, now);
  validateQuery(query);

  const repositoryContext: ApprovedContextRepositoryContext = {
    tenant: context.tenant,
    actorId: context.actor.id,
    requestId: context.requestId,
  };
  const records = await dependencies.repository.loadApprovedContextRecords(repositoryContext, {
    profileId: query.profileId,
    useCase: query.useCase,
    fieldKeys: [...query.fieldKeys],
  });
  const projection = projectApprovedContext({
    tenantId: query.tenant.workspaceId,
    profileId: query.profileId,
    useCase: query.useCase,
    fieldKeys: query.fieldKeys,
    asOf: now.toISOString(),
    records,
  });
  const snapshotBody = {
    schemaVersion: 1 as const,
    organizationId: query.tenant.organizationId,
    workspaceId: query.tenant.workspaceId,
    profileId: projection.profileId,
    useCase: projection.useCase,
    asOf: projection.asOf,
    items: projection.items,
  };
  const digest = createHash("sha256")
    .update(JSON.stringify(canonicalize(snapshotBody)))
    .digest("hex");
  const snapshot = deepFreeze({
    snapshotId: `verified-context:sha256:${digest}` as const,
    ...snapshotBody,
  });

  await dependencies.repository.persistApprovedContextSnapshot(repositoryContext, snapshot);
  return snapshot;
}
