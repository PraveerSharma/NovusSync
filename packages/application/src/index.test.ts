import assert from "node:assert/strict";
import test from "node:test";

import { createCommandEnvelope } from "./index.ts";

test("requires explicit tenant and actor context at the application boundary", () => {
  const command = createCommandEnvelope(
    "foundation-check",
    {
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
    },
    { releaseId: "test-release" },
    "2026-07-17T00:00:00.000Z",
  );

  assert.equal(command.tenant.workspaceId, "synthetic-workspace");
  assert.equal(command.actor.id, "synthetic-actor");
  assert.equal(command.correlationId, "synthetic-correlation");
  assert.deepEqual(command.payload, { releaseId: "test-release" });
});
