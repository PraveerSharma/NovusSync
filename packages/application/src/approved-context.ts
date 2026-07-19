import { createHash } from "node:crypto";

import {
  projectApprovedContext,
  type ApprovedContextFactRecord,
  type ApprovedContextItem,
  type ApprovedContextUseCase,
} from "@novussync/domain";

export interface ApprovedContextQueryContext {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly actor: { readonly actorId: string; readonly role: "owner" | "operator" };
  readonly sessionExpiresAt: string;
  readonly requestId: string;
}

export interface ApprovedContextQuery {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly profileId: string;
  readonly useCase: ApprovedContextUseCase;
  readonly fieldKeys: readonly string[];
}

export interface ApprovedContextRepository {
  loadApprovedContextRecords(input: {
    readonly tenantId: string;
    readonly workspaceId: string;
    readonly profileId: string;
    readonly useCase: ApprovedContextUseCase;
    readonly fieldKeys: readonly string[];
  }): Promise<readonly ApprovedContextFactRecord[]>;
}

export interface ApprovedContextSnapshot {
  readonly snapshotId: `verified-context:sha256:${string}`;
  readonly schemaVersion: 1;
  readonly tenantId: string;
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
  public readonly code: "APPROVED_CONTEXT_UNAUTHORIZED" | "APPROVED_CONTEXT_SESSION_EXPIRED";

  public constructor(
    code: "APPROVED_CONTEXT_UNAUTHORIZED" | "APPROVED_CONTEXT_SESSION_EXPIRED",
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

function authorize(
  context: ApprovedContextQueryContext,
  query: ApprovedContextQuery,
  now: Date,
): void {
  if (
    context.tenantId !== query.tenantId ||
    context.workspaceId !== query.workspaceId ||
    context.actor.actorId.trim().length === 0 ||
    context.requestId.trim().length === 0 ||
    !["owner", "operator"].includes(context.actor.role)
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

export async function queryApprovedContext(
  context: ApprovedContextQueryContext,
  query: ApprovedContextQuery,
  dependencies: ApprovedContextQueryDependencies,
): Promise<ApprovedContextSnapshot> {
  const now = (dependencies.now ?? (() => new Date()))();
  authorize(context, query, now);
  const records = await dependencies.repository.loadApprovedContextRecords({
    tenantId: query.tenantId,
    workspaceId: query.workspaceId,
    profileId: query.profileId,
    useCase: query.useCase,
    fieldKeys: [...query.fieldKeys],
  });
  const projection = projectApprovedContext({
    tenantId: query.tenantId,
    profileId: query.profileId,
    useCase: query.useCase,
    fieldKeys: query.fieldKeys,
    asOf: now.toISOString(),
    records,
  });
  const snapshotBody = {
    schemaVersion: 1 as const,
    tenantId: projection.tenantId,
    workspaceId: query.workspaceId,
    profileId: projection.profileId,
    useCase: projection.useCase,
    asOf: projection.asOf,
    items: projection.items,
  };
  const digest = createHash("sha256")
    .update(JSON.stringify(canonicalize(snapshotBody)))
    .digest("hex");

  return deepFreeze({
    snapshotId: `verified-context:sha256:${digest}`,
    ...snapshotBody,
  });
}
