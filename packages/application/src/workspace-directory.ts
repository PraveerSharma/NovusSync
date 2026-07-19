import type {
  AuthenticationAssurance,
  SessionVerifierPort,
  VerifiedSessionPrincipal,
} from "./authorization.ts";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROFILE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const PLAYBOOK_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export type WorkspaceDirectoryRole = "owner" | "staff";

export type WorkspaceDirectoryProfile = Readonly<{
  profileId: string;
  displayName: string;
  playbookId: string;
  playbookVersion: number;
  draftVersion: number;
  updatedAt: string;
  approvedFactCount: number;
  lastVerifiedAt: string | null;
}>;

export type WorkspaceDirectoryRecord = Readonly<{
  organizationId: string;
  organizationName: string;
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceDirectoryRole;
  profiles: readonly WorkspaceDirectoryProfile[];
}>;

export type WorkspaceDirectoryIdentityQuery = Readonly<{
  identityProvider: "supabase";
  providerSubject: string;
  assurance: AuthenticationAssurance;
}>;

export interface WorkspaceDirectoryRepositoryPort {
  listAccessibleWorkspaces(
    query: WorkspaceDirectoryIdentityQuery,
  ): Promise<readonly WorkspaceDirectoryRecord[]>;
}

export type WorkspaceDirectoryRequest = Readonly<{
  accessToken: string;
  requestId: string;
  now: string;
}>;

export type WorkspaceDirectoryResult = Readonly<{
  asOf: string;
  sessionExpiresAt: string;
  workspaces: readonly WorkspaceDirectoryRecord[];
}>;

export const WORKSPACE_DIRECTORY_ERROR_CODES = [
  "AUTHENTICATION_REQUIRED",
  "SESSION_INVALID",
  "DIRECTORY_RESPONSE_INVALID",
] as const;

export type WorkspaceDirectoryErrorCode = (typeof WORKSPACE_DIRECTORY_ERROR_CODES)[number];

export class WorkspaceDirectoryError extends Error {
  readonly code: WorkspaceDirectoryErrorCode;

  constructor(code: WorkspaceDirectoryErrorCode, message: string) {
    super(message);
    this.name = "WorkspaceDirectoryError";
    this.code = code;
  }
}

export async function queryWorkspaceDirectory(
  request: WorkspaceDirectoryRequest,
  dependencies: Readonly<{
    sessionVerifier: SessionVerifierPort;
    repository: WorkspaceDirectoryRepositoryPort;
  }>,
): Promise<WorkspaceDirectoryResult> {
  const nowMs = Date.parse(request.now);

  if (!request.accessToken.trim() || !isSafeText(request.requestId, 160) || Number.isNaN(nowMs)) {
    throw new WorkspaceDirectoryError("AUTHENTICATION_REQUIRED", "A verified session is required.");
  }

  let principal: VerifiedSessionPrincipal;
  try {
    principal = await dependencies.sessionVerifier.verify(request.accessToken);
  } catch {
    throw new WorkspaceDirectoryError("AUTHENTICATION_REQUIRED", "A verified session is required.");
  }

  validatePrincipal(principal, nowMs);

  const records = await dependencies.repository.listAccessibleWorkspaces({
    identityProvider: principal.provider,
    providerSubject: principal.subject,
    assurance: principal.assurance,
  });

  return Object.freeze({
    asOf: new Date(nowMs).toISOString(),
    sessionExpiresAt: principal.expiresAt,
    workspaces: validateRecords(records),
  });
}

function validatePrincipal(principal: VerifiedSessionPrincipal, nowMs: number): void {
  const issuedAtMs = Date.parse(principal.issuedAt);
  const expiresAtMs = Date.parse(principal.expiresAt);

  if (
    principal.provider !== "supabase" ||
    !isSafeText(principal.subject, 255) ||
    !isSafeText(principal.sessionId, 255) ||
    (principal.assurance !== "aal1" && principal.assurance !== "aal2") ||
    Number.isNaN(issuedAtMs) ||
    Number.isNaN(expiresAtMs) ||
    issuedAtMs > nowMs + 60_000 ||
    issuedAtMs >= expiresAtMs ||
    expiresAtMs <= nowMs
  ) {
    throw new WorkspaceDirectoryError("SESSION_INVALID", "The verified session is invalid.");
  }
}

function validateRecords(
  records: readonly WorkspaceDirectoryRecord[],
): readonly WorkspaceDirectoryRecord[] {
  if (!Array.isArray(records)) {
    throw invalidResponse();
  }

  const workspaceKeys = new Set<string>();
  return Object.freeze(
    records.map((record) => {
      if (
        !UUID_PATTERN.test(record.organizationId) ||
        !UUID_PATTERN.test(record.workspaceId) ||
        !isSafeText(record.organizationName, 160) ||
        !isSafeText(record.workspaceName, 160) ||
        (record.role !== "owner" && record.role !== "staff") ||
        !Array.isArray(record.profiles)
      ) {
        throw invalidResponse();
      }

      const workspaceKey = record.organizationId + ":" + record.workspaceId;
      if (workspaceKeys.has(workspaceKey)) {
        throw invalidResponse();
      }
      workspaceKeys.add(workspaceKey);

      const profileIds = new Set<string>();
      const profiles = Object.freeze(
        record.profiles.map((profile: WorkspaceDirectoryProfile) => {
          if (
            !PROFILE_ID_PATTERN.test(profile.profileId) ||
            !isSafeText(profile.displayName, 160) ||
            !PLAYBOOK_ID_PATTERN.test(profile.playbookId) ||
            !isPositiveInteger(profile.playbookVersion) ||
            !isPositiveInteger(profile.draftVersion) ||
            Number.isNaN(Date.parse(profile.updatedAt)) ||
            !isNonNegativeInteger(profile.approvedFactCount) ||
            (profile.lastVerifiedAt !== null && Number.isNaN(Date.parse(profile.lastVerifiedAt)))
          ) {
            throw invalidResponse();
          }

          if (profileIds.has(profile.profileId)) {
            throw invalidResponse();
          }
          profileIds.add(profile.profileId);

          return Object.freeze({
            profileId: profile.profileId,
            displayName: profile.displayName,
            playbookId: profile.playbookId,
            playbookVersion: profile.playbookVersion,
            draftVersion: profile.draftVersion,
            updatedAt: new Date(profile.updatedAt).toISOString(),
            approvedFactCount: profile.approvedFactCount,
            lastVerifiedAt:
              profile.lastVerifiedAt === null
                ? null
                : new Date(profile.lastVerifiedAt).toISOString(),
          });
        }),
      );

      return Object.freeze({
        organizationId: record.organizationId,
        organizationName: record.organizationName,
        workspaceId: record.workspaceId,
        workspaceName: record.workspaceName,
        role: record.role,
        profiles,
      });
    }),
  );
}

function isSafeText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maxLength &&
    value.trim() === value &&
    !CONTROL_CHARACTER_PATTERN.test(value)
  );
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function invalidResponse(): WorkspaceDirectoryError {
  return new WorkspaceDirectoryError(
    "DIRECTORY_RESPONSE_INVALID",
    "The workspace directory response was invalid.",
  );
}
