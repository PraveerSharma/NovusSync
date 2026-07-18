import assert from "node:assert/strict";
import test from "node:test";

import {
  LEAD_LIFECYCLE_STAGES,
  LeadLifecycleError,
  createCommandEnvelope,
  createDomainError,
  createLeadLifecycle,
  isTerminalLeadStage,
  transitionLeadLifecycle,
  type LeadLifecycleState,
  type LeadLifecycleStage,
} from "./index.ts";

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

const syntheticTenant = {
  organizationId: "synthetic-organization",
  workspaceId: "synthetic-workspace",
} as const;

test("creates an immutable tenant-scoped lead lifecycle", () => {
  const lifecycle = createLeadLifecycle({
    leadId: "synthetic-lead",
    tenant: syntheticTenant,
    occurredAt: "2026-07-18T00:00:00.000Z",
  });

  assert.deepEqual(lifecycle, {
    leadId: "synthetic-lead",
    tenant: syntheticTenant,
    stage: "new",
    version: 1,
    updatedAt: "2026-07-18T00:00:00.000Z",
  });
  assert.equal(Object.isFrozen(lifecycle), true);
  assert.equal(Object.isFrozen(lifecycle.tenant), true);
});

test("advances through the generic booking-to-conversion path with versioned evidence", () => {
  let state = createLeadLifecycle({
    leadId: "synthetic-lead",
    tenant: syntheticTenant,
    occurredAt: "2026-07-18T00:00:00.000Z",
  });
  const stages: readonly LeadLifecycleStage[] = [
    "contacted",
    "qualified",
    "booking_proposed",
    "booked",
    "booking_confirmed",
    "outcome_verified",
    "conversion_follow_up",
    "converted",
  ];

  stages.forEach((stage, index) => {
    const result = transitionLeadLifecycle(state, {
      to: stage,
      occurredAt: `2026-07-18T00:00:${String(index + 1).padStart(2, "0")}.000Z`,
    });
    assert.equal(result.transition.from, state.stage);
    assert.equal(result.transition.to, stage);
    assert.equal(result.transition.version, state.version + 1);
    state = result.state;
  });

  assert.equal(state.stage, "converted");
  assert.equal(state.version, 9);
  assert.equal(isTerminalLeadStage(state.stage), true);
});

test("rejects lifecycle skips that would invent booking or outcome evidence", () => {
  const lifecycle = createLeadLifecycle({
    leadId: "synthetic-lead",
    tenant: syntheticTenant,
    occurredAt: "2026-07-18T00:00:00.000Z",
  });

  assert.throws(
    () =>
      transitionLeadLifecycle(lifecycle, {
        to: "outcome_verified",
        occurredAt: "2026-07-18T00:00:01.000Z",
      }),
    (error: unknown) =>
      error instanceof LeadLifecycleError && error.code === "LEAD_TRANSITION_NOT_ALLOWED",
  );
});

test("requires coded evidence for missed and closed outcomes", () => {
  const confirmed = advanceLifecycle([
    "contacted",
    "qualified",
    "booking_proposed",
    "booked",
    "booking_confirmed",
  ]);

  assert.throws(
    () =>
      transitionLeadLifecycle(confirmed, {
        to: "outcome_missed",
        occurredAt: "2026-07-18T00:01:00.000Z",
      }),
    (error: unknown) =>
      error instanceof LeadLifecycleError && error.code === "LEAD_TRANSITION_REASON_REQUIRED",
  );

  const missed = transitionLeadLifecycle(confirmed, {
    to: "outcome_missed",
    occurredAt: "2026-07-18T00:01:00.000Z",
    reasonCode: "NO_SHOW",
  });
  assert.equal(missed.transition.reasonCode, "NO_SHOW");
});

test("supports a controlled rebooking path after a missed outcome", () => {
  const confirmed = advanceLifecycle([
    "contacted",
    "qualified",
    "booking_proposed",
    "booked",
    "booking_confirmed",
  ]);
  const missed = transitionLeadLifecycle(confirmed, {
    to: "outcome_missed",
    occurredAt: "2026-07-18T00:01:00.000Z",
    reasonCode: "CUSTOMER_UNAVAILABLE",
  }).state;
  const rebooking = transitionLeadLifecycle(missed, {
    to: "booking_proposed",
    occurredAt: "2026-07-18T00:02:00.000Z",
  });

  assert.equal(rebooking.state.stage, "booking_proposed");
  assert.equal(rebooking.transition.from, "outcome_missed");
});

test("prevents terminal-state changes and timestamp regressions", () => {
  const converted = advanceLifecycle([
    "contacted",
    "qualified",
    "booking_proposed",
    "booked",
    "booking_confirmed",
    "outcome_verified",
    "converted",
  ]);

  assert.throws(
    () =>
      transitionLeadLifecycle(converted, {
        to: "conversion_follow_up",
        occurredAt: "2026-07-18T01:00:00.000Z",
      }),
    (error: unknown) =>
      error instanceof LeadLifecycleError && error.code === "LEAD_TRANSITION_NOT_ALLOWED",
  );

  const contacted = advanceLifecycle(["contacted"]);
  assert.throws(
    () =>
      transitionLeadLifecycle(contacted, {
        to: "qualified",
        occurredAt: "2026-07-17T23:59:59.000Z",
      }),
    (error: unknown) =>
      error instanceof LeadLifecycleError && error.code === "LEAD_TRANSITION_TIME_REGRESSION",
  );
});

test("keeps generic lifecycle terminology free of pilot-specific vocabulary", () => {
  LEAD_LIFECYCLE_STAGES.forEach((stage) => {
    assert.doesNotMatch(stage, /yoga|trial|membership/i);
  });
});

function advanceLifecycle(stages: readonly LeadLifecycleStage[]): LeadLifecycleState {
  let state = createLeadLifecycle({
    leadId: "synthetic-lead",
    tenant: syntheticTenant,
    occurredAt: "2026-07-18T00:00:00.000Z",
  });
  stages.forEach((stage, index) => {
    state = transitionLeadLifecycle(state, {
      to: stage,
      occurredAt: `2026-07-18T00:00:${String(index + 1).padStart(2, "0")}.000Z`,
    }).state;
  });
  return state;
}
