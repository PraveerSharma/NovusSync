import assert from "node:assert/strict";
import test from "node:test";

import { LeadLifecycleError } from "@novussync/domain";

import {
  AuthorizationError,
  createLeadLifecycleService,
  LeadLifecyclePersistenceError,
  type AuthenticatedActorContext,
  type LeadLifecycleRecord,
  type LeadLifecycleRepositoryPort,
} from "./index.ts";

const tenant = Object.freeze({
  organizationId: "00000000-0000-4000-8000-000000000001",
  workspaceId: "00000000-0000-4000-8000-000000000101",
});
const leadId = "00000000-0000-4000-8000-000000000801";

function actorContext(
  overrides: Partial<AuthenticatedActorContext> = {},
): AuthenticatedActorContext {
  return {
    tenant,
    actor: {
      id: "00000000-0000-4000-8000-000000000201",
      actorType: "human",
      role: "owner",
      accessKind: "membership",
    },
    correlationId: "00000000-0000-4000-8000-000000000501",
    origin: { type: "request", requestId: "synthetic-request" },
    session: {
      sessionId: "00000000-0000-4000-8000-000000000701",
      assurance: "aal1",
      issuedAt: "2026-07-18T09:00:00.000Z",
      expiresAt: "2026-07-18T11:00:00.000Z",
    },
    ...overrides,
  };
}

function record(
  stage: LeadLifecycleRecord["stage"],
  version: number,
  updatedAt: string,
): LeadLifecycleRecord {
  return {
    organizationId: tenant.organizationId,
    workspaceId: tenant.workspaceId,
    leadId,
    stage,
    version,
    openedAt: "2026-07-18T10:00:00.000Z",
    updatedAt,
  };
}

function repository(
  overrides: Partial<LeadLifecycleRepositoryPort> = {},
): LeadLifecycleRepositoryPort {
  return {
    create: async (_context, input) => record("new", 1, input.occurredAt),
    findById: async () => null,
    listTransitions: async () => [],
    transition: async (_context, input) =>
      record(input.nextStage, input.expectedVersion + 1, input.occurredAt),
    ...overrides,
  };
}

test("creates a lifecycle through an authorized, idempotent application command", async () => {
  let observedActor: string | undefined;
  const service = createLeadLifecycleService({
    repository: repository({
      create: async (_context, input) => {
        observedActor = input.actor.id;
        assert.equal(input.idempotencyKey, "lead-create-801");
        return record("new", 1, input.occurredAt);
      },
    }),
  });

  const state = await service.create(actorContext(), {
    leadId,
    occurredAt: "2026-07-18T10:00:00.000Z",
    idempotencyKey: "lead-create-801",
  });

  assert.equal(state.stage, "new");
  assert.equal(state.version, 1);
  assert.equal(observedActor, actorContext().actor.id);
});

test("rehydrates domain state and persists one legal transition", async () => {
  let transitionCalls = 0;
  const service = createLeadLifecycleService({
    repository: repository({
      findById: async () => record("qualified", 3, "2026-07-18T10:00:00.000Z"),
      transition: async (_context, input) => {
        transitionCalls += 1;
        assert.equal(input.nextStage, "booking_proposed");
        assert.equal(input.expectedVersion, 3);
        return record("booking_proposed", 4, input.occurredAt);
      },
    }),
  });

  const result = await service.transition(actorContext(), {
    leadId,
    expectedVersion: 3,
    to: "booking_proposed",
    occurredAt: "2026-07-18T10:01:00.000Z",
    idempotencyKey: "lead-transition-801-4",
  });

  assert.equal(result.state.stage, "booking_proposed");
  assert.equal(result.transition.from, "qualified");
  assert.equal(result.transition.version, 4);
  assert.equal(transitionCalls, 1);
});

test("rejects a stale version before attempting a write", async () => {
  let transitionCalls = 0;
  const service = createLeadLifecycleService({
    repository: repository({
      findById: async () => record("contacted", 2, "2026-07-18T10:00:00.000Z"),
      transition: async (_context, input) => {
        transitionCalls += 1;
        return record(input.nextStage, input.expectedVersion + 1, input.occurredAt);
      },
    }),
  });

  await assert.rejects(
    service.transition(actorContext(), {
      leadId,
      expectedVersion: 1,
      to: "qualified",
      occurredAt: "2026-07-18T10:01:00.000Z",
      idempotencyKey: "lead-transition-stale",
    }),
    (error: unknown) =>
      error instanceof LeadLifecyclePersistenceError && error.code === "version_conflict",
  );
  assert.equal(transitionCalls, 0);
});

test("rejects an illegal stage skip before attempting a write", async () => {
  let transitionCalls = 0;
  const service = createLeadLifecycleService({
    repository: repository({
      findById: async () => record("new", 1, "2026-07-18T10:00:00.000Z"),
      transition: async (_context, input) => {
        transitionCalls += 1;
        return record(input.nextStage, input.expectedVersion + 1, input.occurredAt);
      },
    }),
  });

  await assert.rejects(
    service.transition(actorContext(), {
      leadId,
      expectedVersion: 1,
      to: "booked",
      occurredAt: "2026-07-18T10:01:00.000Z",
      idempotencyKey: "lead-transition-skip",
    }),
    (error: unknown) =>
      error instanceof LeadLifecycleError && error.code === "LEAD_TRANSITION_NOT_ALLOWED",
  );
  assert.equal(transitionCalls, 0);
});

test("rejects an expired authenticated context before repository access", async () => {
  let repositoryCalls = 0;
  const service = createLeadLifecycleService({
    repository: repository({
      create: async (_context, input) => {
        repositoryCalls += 1;
        return record("new", 1, input.occurredAt);
      },
    }),
  });

  await assert.rejects(
    service.create(
      actorContext({
        session: {
          sessionId: "00000000-0000-4000-8000-000000000701",
          assurance: "aal1",
          issuedAt: "2026-07-18T09:00:00.000Z",
          expiresAt: "2026-07-18T09:59:59.000Z",
        },
      }),
      {
        leadId,
        occurredAt: "2026-07-18T10:00:00.000Z",
        idempotencyKey: "lead-create-expired",
      },
    ),
    (error: unknown) => error instanceof AuthorizationError && error.code === "SESSION_EXPIRED",
  );
  assert.equal(repositoryCalls, 0);
});
