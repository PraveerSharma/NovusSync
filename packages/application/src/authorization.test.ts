import assert from "node:assert/strict";
import test from "node:test";

import {
  assertCustomerApprovalAuthority,
  AuthorizationError,
  resolveAuthenticatedActor,
  type AuthenticationAssurance,
  type VerifiedSessionPrincipal,
  type WorkspaceAccessRecord,
} from "./index.ts";

const request = Object.freeze({
  accessToken: "synthetic-access-token",
  tenant: {
    organizationId: "00000000-0000-4000-8000-000000000001",
    workspaceId: "00000000-0000-4000-8000-000000000101",
  },
  correlationId: "00000000-0000-4000-8000-000000000501",
  origin: { type: "request" as const, requestId: "synthetic-request" },
  now: "2026-07-18T10:00:00.000Z",
});

function session(
  assurance: AuthenticationAssurance = "aal1",
  overrides: Partial<VerifiedSessionPrincipal> = {},
): VerifiedSessionPrincipal {
  return {
    provider: "supabase",
    subject: "00000000-0000-4000-8000-000000000601",
    sessionId: "00000000-0000-4000-8000-000000000701",
    assurance,
    issuedAt: "2026-07-18T09:00:00.000Z",
    expiresAt: "2026-07-18T11:00:00.000Z",
    ...overrides,
  };
}

function ownerAccess(): WorkspaceAccessRecord {
  return {
    actorId: "00000000-0000-4000-8000-000000000201",
    actorType: "human",
    role: "owner",
    accessKind: "membership",
  };
}

async function expectAuthorizationCode(
  promise: Promise<unknown>,
  code: AuthorizationError["code"],
): Promise<void> {
  await assert.rejects(
    promise,
    (error: unknown) => error instanceof AuthorizationError && error.code === code,
  );
}

test("resolves an authenticated owner from a verified session and current membership", async () => {
  const context = await resolveAuthenticatedActor(
    {
      sessionVerifier: { verify: async () => session() },
      workspaceAccess: { resolveWorkspaceAccess: async () => ownerAccess() },
    },
    request,
  );

  assert.equal(context.actor.role, "owner");
  assert.equal(context.actor.accessKind, "membership");
  assert.equal(context.session.assurance, "aal1");
  assert.doesNotThrow(() => assertCustomerApprovalAuthority(context));
});

test("rejects an unauthenticated command before querying workspace access", async () => {
  let repositoryCalls = 0;
  await expectAuthorizationCode(
    resolveAuthenticatedActor(
      {
        sessionVerifier: { verify: async () => session() },
        workspaceAccess: {
          resolveWorkspaceAccess: async () => {
            repositoryCalls += 1;
            return ownerAccess();
          },
        },
      },
      { ...request, accessToken: "" },
    ),
    "AUTHENTICATION_REQUIRED",
  );
  assert.equal(repositoryCalls, 0);
});

test("normalizes provider verification failures without exposing their details", async () => {
  await expectAuthorizationCode(
    resolveAuthenticatedActor(
      {
        sessionVerifier: {
          verify: async () => {
            throw new Error("provider-secret-canary");
          },
        },
        workspaceAccess: { resolveWorkspaceAccess: async () => ownerAccess() },
      },
      request,
    ),
    "AUTHENTICATION_REQUIRED",
  );
});

test("rejects an expired session", async () => {
  await expectAuthorizationCode(
    resolveAuthenticatedActor(
      {
        sessionVerifier: {
          verify: async () => session("aal1", { expiresAt: "2026-07-18T09:59:59.000Z" }),
        },
        workspaceAccess: { resolveWorkspaceAccess: async () => ownerAccess() },
      },
      request,
    ),
    "SESSION_EXPIRED",
  );
});

test("fails closed when current workspace access is absent", async () => {
  await expectAuthorizationCode(
    resolveAuthenticatedActor(
      {
        sessionVerifier: { verify: async () => session() },
        workspaceAccess: { resolveWorkspaceAccess: async () => null },
      },
      request,
    ),
    "WORKSPACE_ACCESS_DENIED",
  );
});

test("requires aal2 and a current grant for an internal operator", async () => {
  const operatorAccess: WorkspaceAccessRecord = {
    actorId: "00000000-0000-4000-8000-000000000202",
    actorType: "human",
    role: "internal_operator",
    accessKind: "support_grant",
    supportGrantId: "00000000-0000-4000-8000-000000000402",
  };

  await expectAuthorizationCode(
    resolveAuthenticatedActor(
      {
        sessionVerifier: { verify: async () => session("aal1") },
        workspaceAccess: { resolveWorkspaceAccess: async () => operatorAccess },
      },
      request,
    ),
    "MFA_REQUIRED",
  );

  const context = await resolveAuthenticatedActor(
    {
      sessionVerifier: { verify: async () => session("aal2") },
      workspaceAccess: { resolveWorkspaceAccess: async () => operatorAccess },
    },
    request,
  );
  assert.equal(context.actor.supportGrantId, operatorAccess.supportGrantId);
  await expectAuthorizationCode(
    Promise.resolve().then(() => assertCustomerApprovalAuthority(context)),
    "CUSTOMER_APPROVAL_REQUIRED",
  );
});

test("rejects an operator record without explicit support-grant evidence", async () => {
  await expectAuthorizationCode(
    resolveAuthenticatedActor(
      {
        sessionVerifier: { verify: async () => session("aal2") },
        workspaceAccess: {
          resolveWorkspaceAccess: async () => ({
            actorId: "00000000-0000-4000-8000-000000000202",
            actorType: "human",
            role: "internal_operator",
            accessKind: "support_grant",
          }),
        },
      },
      request,
    ),
    "SUPPORT_GRANT_REQUIRED",
  );
});
