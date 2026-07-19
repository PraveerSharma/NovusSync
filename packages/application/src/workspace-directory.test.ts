import assert from "node:assert/strict";
import test from "node:test";

import {
  queryWorkspaceDirectory,
  WorkspaceDirectoryError,
  type WorkspaceDirectoryRecord,
} from "./workspace-directory.ts";

const NOW = "2026-07-19T10:00:00.000Z";
const ORGANIZATION_ID = "10000000-0000-4000-8000-000000000001";
const WORKSPACE_ID = "10000000-0000-4000-8000-000000000101";

const validRecords: readonly WorkspaceDirectoryRecord[] = [
  {
    organizationId: ORGANIZATION_ID,
    organizationName: "Northstar Collective",
    workspaceId: WORKSPACE_ID,
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
];

test("verifies the session before listing only its identity-scoped workspaces", async () => {
  const calls: string[] = [];

  const result = await queryWorkspaceDirectory(
    { accessToken: "verified-access-token", requestId: "directory-request-1", now: NOW },
    {
      sessionVerifier: {
        verify: async (token) => {
          calls.push("verify:" + token);
          return principal();
        },
      },
      repository: {
        listAccessibleWorkspaces: async (query) => {
          calls.push("list:" + query.providerSubject);
          assert.deepEqual(query, {
            identityProvider: "supabase",
            providerSubject: "user-101",
            assurance: "aal1",
          });
          return validRecords;
        },
      },
    },
  );

  assert.deepEqual(calls, ["verify:verified-access-token", "list:user-101"]);
  assert.equal(result.asOf, NOW);
  assert.equal(result.workspaces[0]?.profiles[0]?.profileId, "northstar-yoga-primary");
  assert.equal(Object.isFrozen(result.workspaces), true);
  assert.equal(Object.isFrozen(result.workspaces[0]?.profiles), true);
});

test("rejects an expired verified session before the repository is queried", async () => {
  let queried = false;

  await assert.rejects(
    queryWorkspaceDirectory(
      { accessToken: "expired-access-token", requestId: "directory-request-2", now: NOW },
      {
        sessionVerifier: {
          verify: async () => principal({ expiresAt: "2026-07-19T09:59:59.000Z" }),
        },
        repository: {
          listAccessibleWorkspaces: async () => {
            queried = true;
            return validRecords;
          },
        },
      },
    ),
    (error) => error instanceof WorkspaceDirectoryError && error.code === "SESSION_INVALID",
  );

  assert.equal(queried, false);
});

test("maps verifier failures to a safe authentication error", async () => {
  await assert.rejects(
    queryWorkspaceDirectory(
      { accessToken: "bad-access-token", requestId: "directory-request-3", now: NOW },
      {
        sessionVerifier: {
          verify: async () => {
            throw new Error("provider detail that must not escape");
          },
        },
        repository: { listAccessibleWorkspaces: async () => validRecords },
      },
    ),
    (error) =>
      error instanceof WorkspaceDirectoryError &&
      error.code === "AUTHENTICATION_REQUIRED" &&
      !error.message.includes("provider detail"),
  );
});

test("fails closed when a repository returns duplicate or malformed tenant data", async () => {
  const duplicate = [validRecords[0], validRecords[0]] as readonly WorkspaceDirectoryRecord[];

  await assert.rejects(
    queryWorkspaceDirectory(
      { accessToken: "verified-access-token", requestId: "directory-request-4", now: NOW },
      {
        sessionVerifier: { verify: async () => principal() },
        repository: { listAccessibleWorkspaces: async () => duplicate },
      },
    ),
    (error) =>
      error instanceof WorkspaceDirectoryError && error.code === "DIRECTORY_RESPONSE_INVALID",
  );
});

function principal(overrides: Partial<ReturnType<typeof principalBase>> = {}) {
  return { ...principalBase(), ...overrides };
}

function principalBase() {
  return {
    provider: "supabase" as const,
    subject: "user-101",
    sessionId: "session-101",
    assurance: "aal1" as const,
    issuedAt: "2026-07-19T09:00:00.000Z",
    expiresAt: "2026-07-19T11:00:00.000Z",
  };
}
