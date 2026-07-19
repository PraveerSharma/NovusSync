import type { WorkspaceDirectoryResult } from "@novussync/application";

export type WorkspaceDirectoryProfileView = Readonly<{
  profileId: string;
  displayName: string;
  playbookLabel: string;
  draftVersion: number;
  approvedFactCount: number;
  lastVerifiedAt: string | null;
  contextHref: string;
  freshnessHref: string;
}>;

export type WorkspaceDirectoryWorkspaceView = Readonly<{
  organizationId: string;
  organizationName: string;
  workspaceId: string;
  workspaceName: string;
  roleLabel: "Owner" | "Staff";
  profiles: readonly WorkspaceDirectoryProfileView[];
}>;

export type WorkspaceDirectoryPageData =
  | Readonly<{
      status: "ready";
      mode: "verified" | "synthetic";
      asOf: string;
      workspaces: readonly WorkspaceDirectoryWorkspaceView[];
    }>
  | Readonly<{
      status: "unavailable";
      reason: string;
    }>;

const SYNTHETIC_ORGANIZATION_ID = "10000000-0000-4000-8000-000000000001";
const SYNTHETIC_WORKSPACE_ID = "10000000-0000-4000-8000-000000000101";

export function toWorkspaceDirectoryPageData(
  result: WorkspaceDirectoryResult,
  mode: "verified" | "synthetic" = "verified",
): WorkspaceDirectoryPageData {
  return Object.freeze({
    status: "ready",
    mode,
    asOf: result.asOf,
    workspaces: Object.freeze(
      result.workspaces.map((workspace) =>
        Object.freeze({
          organizationId: workspace.organizationId,
          organizationName: workspace.organizationName,
          workspaceId: workspace.workspaceId,
          workspaceName: workspace.workspaceName,
          roleLabel: workspace.role === "owner" ? "Owner" : "Staff",
          profiles: Object.freeze(
            workspace.profiles.map((profile) =>
              Object.freeze({
                profileId: profile.profileId,
                displayName: profile.displayName,
                playbookLabel: humanizePlaybook(profile.playbookId),
                draftVersion: profile.draftVersion,
                approvedFactCount: profile.approvedFactCount,
                lastVerifiedAt: profile.lastVerifiedAt,
                contextHref: buildApprovedContextHref({
                  organizationId: workspace.organizationId,
                  workspaceId: workspace.workspaceId,
                  profileId: profile.profileId,
                }),
                freshnessHref: buildFactReverificationHref({
                  organizationId: workspace.organizationId,
                  workspaceId: workspace.workspaceId,
                  profileId: profile.profileId,
                }),
              }),
            ),
          ),
        }),
      ),
    ),
  });
}

export function createSyntheticWorkspaceDirectoryPageData(): WorkspaceDirectoryPageData {
  return toWorkspaceDirectoryPageData(
    {
      asOf: "2026-07-19T10:00:00.000Z",
      sessionExpiresAt: "2026-07-19T11:00:00.000Z",
      workspaces: [
        {
          organizationId: SYNTHETIC_ORGANIZATION_ID,
          organizationName: "Northstar Collective",
          workspaceId: SYNTHETIC_WORKSPACE_ID,
          workspaceName: "Bengaluru pilot",
          role: "owner",
          profiles: [
            {
              profileId: "northstar-yoga-primary",
              displayName: "Northstar Yoga Studio",
              playbookId: "independent-yoga-studio",
              playbookVersion: 1,
              draftVersion: 3,
              updatedAt: "2026-07-19T09:30:00.000Z",
              approvedFactCount: 8,
              lastVerifiedAt: "2026-07-19T09:20:00.000Z",
            },
          ],
        },
      ],
    },
    "synthetic",
  );
}

export function createUnavailableWorkspaceDirectoryPageData(): WorkspaceDirectoryPageData {
  return Object.freeze({
    status: "unavailable",
    reason:
      "Your verified workspace directory is temporarily unavailable. No unverified workspace data was shown.",
  });
}

export function buildApprovedContextHref(scope: {
  organizationId: string;
  workspaceId: string;
  profileId: string;
}): string {
  const parameters = new URLSearchParams({
    organizationId: scope.organizationId,
    workspaceId: scope.workspaceId,
    profileId: scope.profileId,
    useCase: "campaign",
  });
  return "/business-profile/context?" + parameters.toString();
}

export function buildFactReverificationHref(scope: {
  organizationId: string;
  workspaceId: string;
  profileId: string;
}): string {
  const parameters = new URLSearchParams(scope);
  return "/business-profile/reverification?" + parameters.toString();
}

function humanizePlaybook(playbookId: string): string {
  return playbookId
    .split(/[-_.]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
