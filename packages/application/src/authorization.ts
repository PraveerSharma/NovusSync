import type {
  ActorType,
  CommandActor,
  CommandOrigin,
  TenantContext,
  WorkspaceRole,
} from "@novussync/domain";

export const AUTHORIZATION_ERROR_CODES = [
  "AUTHENTICATION_REQUIRED",
  "SESSION_EXPIRED",
  "COMMAND_CONTEXT_INVALID",
  "WORKSPACE_ACCESS_DENIED",
  "MFA_REQUIRED",
  "SUPPORT_GRANT_REQUIRED",
  "CUSTOMER_APPROVAL_REQUIRED",
] as const;

export type AuthorizationErrorCode = (typeof AUTHORIZATION_ERROR_CODES)[number];
export type AuthenticationAssurance = "aal1" | "aal2";

export class AuthorizationError extends Error {
  readonly code: AuthorizationErrorCode;

  constructor(code: AuthorizationErrorCode, message: string) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
  }
}

export type VerifiedSessionPrincipal = Readonly<{
  provider: "supabase";
  subject: string;
  sessionId: string;
  assurance: AuthenticationAssurance;
  issuedAt: string;
  expiresAt: string;
}>;

export interface SessionVerifierPort {
  verify(accessToken: string): Promise<VerifiedSessionPrincipal>;
}

export type WorkspaceAccessQuery = Readonly<{
  identityProvider: "supabase";
  providerSubject: string;
  organizationId: string;
  workspaceId: string;
  assurance: AuthenticationAssurance;
}>;

export type WorkspaceAccessRecord = Readonly<{
  actorId: string;
  actorType: ActorType;
  role: WorkspaceRole;
  accessKind: "membership" | "support_grant";
  supportGrantId?: string;
}>;

export interface WorkspaceAccessRepositoryPort {
  resolveWorkspaceAccess(query: WorkspaceAccessQuery): Promise<WorkspaceAccessRecord | null>;
}

export type ResolveAuthenticatedActorRequest = Readonly<{
  accessToken: string;
  tenant: TenantContext;
  correlationId: string;
  origin: CommandOrigin;
  now: string;
}>;

export type AuthenticatedActorContext = Readonly<{
  tenant: TenantContext;
  actor: CommandActor;
  correlationId: string;
  origin: CommandOrigin;
  session: Readonly<{
    sessionId: string;
    assurance: AuthenticationAssurance;
    issuedAt: string;
    expiresAt: string;
  }>;
}>;

export async function resolveAuthenticatedActor(
  dependencies: Readonly<{
    sessionVerifier: SessionVerifierPort;
    workspaceAccess: WorkspaceAccessRepositoryPort;
  }>,
  request: ResolveAuthenticatedActorRequest,
): Promise<AuthenticatedActorContext> {
  if (!request.accessToken.trim()) {
    throw new AuthorizationError("AUTHENTICATION_REQUIRED", "A verified session is required.");
  }
  if (
    !request.tenant.organizationId.trim() ||
    !request.tenant.workspaceId.trim() ||
    !request.correlationId.trim() ||
    Number.isNaN(Date.parse(request.now))
  ) {
    throw new AuthorizationError(
      "COMMAND_CONTEXT_INVALID",
      "Tenant, correlation, origin, and clock context are required.",
    );
  }

  let principal: VerifiedSessionPrincipal;
  try {
    principal = await dependencies.sessionVerifier.verify(request.accessToken);
  } catch {
    throw new AuthorizationError("AUTHENTICATION_REQUIRED", "A verified session is required.");
  }

  const now = Date.parse(request.now);
  const issuedAt = Date.parse(principal.issuedAt);
  const expiresAt = Date.parse(principal.expiresAt);
  if (Number.isNaN(issuedAt) || Number.isNaN(expiresAt) || issuedAt > now + 60_000) {
    throw new AuthorizationError("AUTHENTICATION_REQUIRED", "The session claims are invalid.");
  }
  if (expiresAt <= now) {
    throw new AuthorizationError("SESSION_EXPIRED", "The session has expired.");
  }

  const access = await dependencies.workspaceAccess.resolveWorkspaceAccess({
    identityProvider: principal.provider,
    providerSubject: principal.subject,
    organizationId: request.tenant.organizationId,
    workspaceId: request.tenant.workspaceId,
    assurance: principal.assurance,
  });
  if (!access || access.actorType !== "human") {
    throw new AuthorizationError(
      "WORKSPACE_ACCESS_DENIED",
      "Current workspace access was not found.",
    );
  }

  if (access.role === "internal_operator") {
    if (principal.assurance !== "aal2") {
      throw new AuthorizationError("MFA_REQUIRED", "Internal operator access requires MFA.");
    }
    if (access.accessKind !== "support_grant" || !access.supportGrantId) {
      throw new AuthorizationError(
        "SUPPORT_GRANT_REQUIRED",
        "Internal operator access requires an active support grant.",
      );
    }
  } else if (access.accessKind !== "membership" || access.supportGrantId) {
    throw new AuthorizationError(
      "WORKSPACE_ACCESS_DENIED",
      "Customer access requires a current direct membership.",
    );
  }

  return Object.freeze({
    tenant: Object.freeze({ ...request.tenant }),
    actor: Object.freeze({
      id: access.actorId,
      actorType: access.actorType,
      role: access.role,
      accessKind: access.accessKind,
      ...(access.supportGrantId ? { supportGrantId: access.supportGrantId } : {}),
    }),
    correlationId: request.correlationId,
    origin: Object.freeze({ ...request.origin }),
    session: Object.freeze({
      sessionId: principal.sessionId,
      assurance: principal.assurance,
      issuedAt: principal.issuedAt,
      expiresAt: principal.expiresAt,
    }),
  });
}

export function assertCustomerApprovalAuthority(context: AuthenticatedActorContext): void {
  if (context.actor.role !== "owner" || context.actor.accessKind !== "membership") {
    throw new AuthorizationError(
      "CUSTOMER_APPROVAL_REQUIRED",
      "This action requires an authorized customer owner.",
    );
  }
}
