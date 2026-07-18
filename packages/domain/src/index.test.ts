import assert from "node:assert/strict";
import test from "node:test";

import { createCommandEnvelope, createDomainError } from "./index.ts";

test("creates a tenant-scoped command with an injected timestamp", () => {
  const command = createCommandEnvelope({
    command: "foundation-check",
    tenant: {
      organizationId: "synthetic-organization",
      workspaceId: "synthetic-workspace",
    },
    actor: {
      id: "synthetic-actor",
      actorType: "human",
      role: "owner",
      accessKind: "membership",
    },
    correlationId: "synthetic-correlation",
    origin: { type: "request", requestId: "synthetic-request" },
    payload: { safe: true },
    createdAt: "2026-07-17T00:00:00.000Z",
  });

  assert.deepEqual(command, {
    command: "foundation-check",
    tenant: {
      organizationId: "synthetic-organization",
      workspaceId: "synthetic-workspace",
    },
    actor: {
      id: "synthetic-actor",
      actorType: "human",
      role: "owner",
      accessKind: "membership",
    },
    correlationId: "synthetic-correlation",
    origin: { type: "request", requestId: "synthetic-request" },
    payload: { safe: true },
    createdAt: "2026-07-17T00:00:00.000Z",
  });
});

test("rejects a background command when job context is lost", () => {
  assert.throws(
    () =>
      createCommandEnvelope({
        command: "foundation-check",
        tenant: { organizationId: "synthetic-organization", workspaceId: "synthetic-workspace" },
        actor: { id: "system-actor", actorType: "system", role: "system", accessKind: "system" },
        correlationId: "synthetic-correlation",
        origin: { type: "job", jobId: "", attempt: 0 },
        payload: {},
      }),
    /Job command origin|origin\.jobId/,
  );
});

test("creates stable domain errors", () => {
  assert.deepEqual(createDomainError("FOUNDATION_DENIED", "External actions are denied."), {
    code: "FOUNDATION_DENIED",
    message: "External actions are denied.",
  });
});
