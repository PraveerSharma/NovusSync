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

export type LeadId = string;

export const LEAD_LIFECYCLE_STAGES = [
  "new",
  "contacted",
  "qualified",
  "booking_proposed",
  "booked",
  "booking_confirmed",
  "outcome_verified",
  "outcome_missed",
  "conversion_follow_up",
  "converted",
  "closed_not_converted",
] as const;

export type LeadLifecycleStage = (typeof LEAD_LIFECYCLE_STAGES)[number];

export type LeadLifecycleState = Readonly<{
  leadId: LeadId;
  tenant: TenantContext;
  stage: LeadLifecycleStage;
  version: number;
  updatedAt: string;
}>;

export type CreateLeadLifecycleInput = Readonly<{
  leadId: LeadId;
  tenant: TenantContext;
  occurredAt: string;
}>;

export type TransitionLeadLifecycleInput = Readonly<{
  to: LeadLifecycleStage;
  occurredAt: string;
  reasonCode?: string;
}>;

export type LeadLifecycleTransition = Readonly<{
  leadId: LeadId;
  tenant: TenantContext;
  from: LeadLifecycleStage;
  to: LeadLifecycleStage;
  version: number;
  occurredAt: string;
  reasonCode?: string;
}>;

export type LeadLifecycleTransitionResult = Readonly<{
  state: LeadLifecycleState;
  transition: LeadLifecycleTransition;
}>;

export type LeadLifecycleErrorCode =
  | "LEAD_LIFECYCLE_INVALID"
  | "LEAD_TRANSITION_NOT_ALLOWED"
  | "LEAD_TRANSITION_REASON_REQUIRED"
  | "LEAD_TRANSITION_TIME_REGRESSION";

export class LeadLifecycleError extends Error {
  readonly code: LeadLifecycleErrorCode;

  constructor(code: LeadLifecycleErrorCode, message: string) {
    super(message);
    this.name = "LeadLifecycleError";
    this.code = code;
  }
}

const TERMINAL_LEAD_STAGES: readonly LeadLifecycleStage[] = ["converted", "closed_not_converted"];

const REASON_REQUIRED_LEAD_STAGES: readonly LeadLifecycleStage[] = [
  "outcome_missed",
  "closed_not_converted",
];

const ALLOWED_LEAD_STAGE_TRANSITIONS: Readonly<
  Record<LeadLifecycleStage, readonly LeadLifecycleStage[]>
> = {
  new: ["contacted", "closed_not_converted"],
  contacted: ["qualified", "closed_not_converted"],
  qualified: ["booking_proposed", "closed_not_converted"],
  booking_proposed: ["booked", "closed_not_converted"],
  booked: ["booking_confirmed", "booking_proposed", "closed_not_converted"],
  booking_confirmed: [
    "outcome_verified",
    "outcome_missed",
    "booking_proposed",
    "closed_not_converted",
  ],
  outcome_verified: ["conversion_follow_up", "converted", "closed_not_converted"],
  outcome_missed: ["booking_proposed", "conversion_follow_up", "closed_not_converted"],
  conversion_follow_up: ["booking_proposed", "converted", "closed_not_converted"],
  converted: [],
  closed_not_converted: [],
};

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

export function isLeadLifecycleStage(value: unknown): value is LeadLifecycleStage {
  return typeof value === "string" && LEAD_LIFECYCLE_STAGES.includes(value as LeadLifecycleStage);
}

export function isTerminalLeadStage(stage: LeadLifecycleStage): boolean {
  return TERMINAL_LEAD_STAGES.includes(stage);
}

export function canTransitionLeadLifecycle(
  from: LeadLifecycleStage,
  to: LeadLifecycleStage,
): boolean {
  return ALLOWED_LEAD_STAGE_TRANSITIONS[from].includes(to);
}

export function createLeadLifecycle(input: CreateLeadLifecycleInput): LeadLifecycleState {
  assertLeadIdentity(input.leadId, input.tenant);
  const occurredAt = parseLeadTimestamp(input.occurredAt);

  return freezeLeadLifecycleState({
    leadId: input.leadId,
    tenant: input.tenant,
    stage: "new",
    version: 1,
    updatedAt: occurredAt,
  });
}

export function transitionLeadLifecycle(
  current: LeadLifecycleState,
  input: TransitionLeadLifecycleInput,
): LeadLifecycleTransitionResult {
  assertLeadLifecycleState(current);
  if (!isLeadLifecycleStage(input.to)) {
    throw new LeadLifecycleError(
      "LEAD_LIFECYCLE_INVALID",
      "Lead lifecycle transition requires a known destination stage",
    );
  }
  if (!canTransitionLeadLifecycle(current.stage, input.to)) {
    throw new LeadLifecycleError(
      "LEAD_TRANSITION_NOT_ALLOWED",
      `Lead lifecycle cannot transition from ${current.stage} to ${input.to}`,
    );
  }

  const occurredAt = parseLeadTimestamp(input.occurredAt);
  if (Date.parse(occurredAt) < Date.parse(current.updatedAt)) {
    throw new LeadLifecycleError(
      "LEAD_TRANSITION_TIME_REGRESSION",
      "Lead lifecycle transition cannot predate the current state",
    );
  }

  const reasonCode = normalizeLeadReasonCode(input.reasonCode);
  if (REASON_REQUIRED_LEAD_STAGES.includes(input.to) && !reasonCode) {
    throw new LeadLifecycleError(
      "LEAD_TRANSITION_REASON_REQUIRED",
      `Lead lifecycle stage ${input.to} requires a reason code`,
    );
  }

  const version = current.version + 1;
  const state = freezeLeadLifecycleState({
    leadId: current.leadId,
    tenant: current.tenant,
    stage: input.to,
    version,
    updatedAt: occurredAt,
  });
  const transition = Object.freeze({
    leadId: current.leadId,
    tenant: Object.freeze({ ...current.tenant }),
    from: current.stage,
    to: input.to,
    version,
    occurredAt,
    ...(reasonCode ? { reasonCode } : {}),
  });

  return Object.freeze({ state, transition });
}

function assertLeadLifecycleState(state: LeadLifecycleState): void {
  assertLeadIdentity(state.leadId, state.tenant);
  if (!isLeadLifecycleStage(state.stage)) {
    throw new LeadLifecycleError("LEAD_LIFECYCLE_INVALID", "Lead lifecycle has an unknown stage");
  }
  if (!Number.isSafeInteger(state.version) || state.version < 1) {
    throw new LeadLifecycleError(
      "LEAD_LIFECYCLE_INVALID",
      "Lead lifecycle requires a positive version",
    );
  }
  parseLeadTimestamp(state.updatedAt);
}

function assertLeadIdentity(leadId: LeadId, tenant: TenantContext): void {
  if (!leadId.trim() || !tenant.organizationId.trim() || !tenant.workspaceId.trim()) {
    throw new LeadLifecycleError(
      "LEAD_LIFECYCLE_INVALID",
      "Lead lifecycle requires lead and tenant identity",
    );
  }
}

function parseLeadTimestamp(value: string): string {
  if (!value.trim() || Number.isNaN(Date.parse(value))) {
    throw new LeadLifecycleError(
      "LEAD_LIFECYCLE_INVALID",
      "Lead lifecycle requires a valid timestamp",
    );
  }
  return value;
}

function normalizeLeadReasonCode(value: string | undefined): string | undefined {
  const reasonCode = value?.trim();
  if (!reasonCode) return undefined;
  if (!/^[A-Z][A-Z0-9_-]{0,63}$/.test(reasonCode)) {
    throw new LeadLifecycleError(
      "LEAD_LIFECYCLE_INVALID",
      "Lead lifecycle reason code must be a stable uppercase identifier",
    );
  }
  return reasonCode;
}

function freezeLeadLifecycleState(state: LeadLifecycleState): LeadLifecycleState {
  return Object.freeze({
    ...state,
    tenant: Object.freeze({ ...state.tenant }),
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

export * from "./business-profile.ts";
export * from "./fact-review.ts";
export * from "./source-proposal.ts";
export * from "./approved-context.ts";
export * from "./fact-freshness.ts";
