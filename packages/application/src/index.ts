import {
  createCommandEnvelope as baseCreateCommandEnvelope,
  type CommandActor,
  type CommandOrigin,
  type TenantContext,
} from "@novussync/domain";

export {
  assertCustomerApprovalAuthority,
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
  resolveAuthenticatedActor,
} from "./authorization.ts";
export type {
  AuthenticatedActorContext,
  AuthenticationAssurance,
  AuthorizationErrorCode,
  ResolveAuthenticatedActorRequest,
  SessionVerifierPort,
  VerifiedSessionPrincipal,
  WorkspaceAccessQuery,
  WorkspaceAccessRecord,
  WorkspaceAccessRepositoryPort,
} from "./authorization.ts";

export {
  decideFoundationExternalEffect,
  FOUNDATION_EXTERNAL_EFFECTS,
} from "./foundation-effect-policy.ts";
export type {
  FoundationEffectDecision,
  FoundationEffectRequest,
  FoundationExternalEffect,
} from "./foundation-effect-policy.ts";

export {
  createLeadLifecycleService,
  LeadLifecyclePersistenceError,
} from "./lead-lifecycle-service.ts";
export type {
  CreateLeadLifecycleCommand,
  CreateLeadLifecycleRecord,
  LeadLifecycleActor,
  LeadLifecycleCommandService,
  LeadLifecyclePersistenceErrorCode,
  LeadLifecycleRecord,
  LeadLifecycleRepositoryPort,
  LeadLifecycleTransitionRecord,
  TransitionLeadLifecycleCommand,
  TransitionLeadLifecycleRecord,
} from "./lead-lifecycle-service.ts";

export type ActorContext = {
  tenant: TenantContext;
  actor: CommandActor;
  correlationId: string;
  origin: CommandOrigin;
};

export function createCommandEnvelope<TPayload = Record<string, unknown>>(
  command: string,
  actor: ActorContext,
  payload: TPayload = {} as TPayload,
  createdAt?: string,
) {
  return baseCreateCommandEnvelope({
    command,
    tenant: actor.tenant,
    actor: actor.actor,
    correlationId: actor.correlationId,
    origin: actor.origin,
    payload,
    createdAt,
  });
}

export * from "./business-profile-service.ts";
