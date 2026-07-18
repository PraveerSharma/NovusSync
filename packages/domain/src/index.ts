export type WorkspaceId = string;
export type ActorId = string;
export type TenantId = string;
export type OrganizationId = string;

export const WORKSPACE_ROLES = ["owner", "staff", "internal_operator"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];
export type ActorType = "human" | "system";
export type ActorAccessKind = "membership" | "support_grant" | "system";

export type TenantContext = Readonly<{
  organizationId: OrganizationId;
  workspaceId: WorkspaceId;
}>;

export type CommandOrigin =
  | Readonly<{ type: "request"; requestId: string }>
  | Readonly<{ type: "job"; jobId: string; attempt: number }>;

export type CommandActor = Readonly<{
  id: ActorId;
  actorType: ActorType;
  role: WorkspaceRole | "system";
  accessKind: ActorAccessKind;
  supportGrantId?: string;
}>;

export type CommandEnvelope<TPayload = Record<string, unknown>> = {
  command: string;
  tenant: TenantContext;
  actor: CommandActor;
  correlationId: string;
  origin: CommandOrigin;
  payload: TPayload;
  createdAt: string;
};

export type CreateCommandEnvelopeInput<TPayload> = Readonly<{
  command: string;
  tenant: TenantContext;
  actor: CommandActor;
  correlationId: string;
  origin: CommandOrigin;
  payload: TPayload;
  createdAt?: string;
}>;

export function createDomainError(code: string, message: string) {
  return {
    code,
    message,
  } as const;
}

export function createCommandEnvelope<TPayload = Record<string, unknown>>(
  input: CreateCommandEnvelopeInput<TPayload>,
): CommandEnvelope<TPayload> {
  assertNonEmpty(input.command, "command");
  assertNonEmpty(input.tenant.organizationId, "tenant.organizationId");
  assertNonEmpty(input.tenant.workspaceId, "tenant.workspaceId");
  assertNonEmpty(input.actor.id, "actor.id");
  assertNonEmpty(input.correlationId, "correlationId");
  assertActorShape(input.actor);
  assertOrigin(input.origin);

  const createdAt = input.createdAt ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(createdAt))) {
    throw new Error("Command context requires a valid createdAt timestamp");
  }

  return Object.freeze({
    command: input.command,
    tenant: Object.freeze({ ...input.tenant }),
    actor: Object.freeze({ ...input.actor }),
    correlationId: input.correlationId,
    origin: Object.freeze({ ...input.origin }),
    payload: input.payload,
    createdAt,
  });
}

function assertNonEmpty(value: string, field: string): void {
  if (!value.trim()) {
    throw new Error(`Command context requires ${field}`);
  }
}

function assertActorShape(actor: CommandActor): void {
  if (actor.actorType === "system") {
    if (actor.role !== "system" || actor.accessKind !== "system" || actor.supportGrantId) {
      throw new Error("System command actor has an invalid authorization shape");
    }
    return;
  }

  if (actor.role === "system" || actor.accessKind === "system") {
    throw new Error("Human command actor has an invalid authorization shape");
  }
  if (
    actor.role === "internal_operator" &&
    (actor.accessKind !== "support_grant" || !actor.supportGrantId?.trim())
  ) {
    throw new Error("Internal operator commands require an explicit support grant");
  }
  if (
    (actor.role === "owner" || actor.role === "staff") &&
    (actor.accessKind !== "membership" || actor.supportGrantId)
  ) {
    throw new Error("Customer commands require direct membership authorization");
  }
}

function assertOrigin(origin: CommandOrigin): void {
  if (origin.type === "request") {
    assertNonEmpty(origin.requestId, "origin.requestId");
    return;
  }
  assertNonEmpty(origin.jobId, "origin.jobId");
  if (!Number.isSafeInteger(origin.attempt) || origin.attempt < 1) {
    throw new Error("Job command origin requires a positive attempt number");
  }
}
