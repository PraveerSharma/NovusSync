import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ApprovedContextFactRecord } from "@novussync/domain";

import {
  executeFactReverification,
  FactReverificationError,
  queryFactReverificationQueue,
  type FactFreshnessReadRepositoryPort,
  type FactReverificationCommandContext,
  type FactReverificationResult,
  type FactReverificationWriteRepositoryPort,
} from "./fact-reverification.ts";

const ownerContext: FactReverificationCommandContext = Object.freeze({
  tenant: { organizationId: "organization-001", workspaceId: "workspace-001" },
  actor: {
    id: "actor-owner-001",
    actorType: "human" as const,
    role: "owner" as const,
    accessKind: "membership" as const,
  },
  sessionExpiresAt: "2026-07-20T10:00:00.000Z",
  requestId: "request-001",
});

const expiredRecord: ApprovedContextFactRecord = Object.freeze({
  fact: Object.freeze({
    factVersionId: "fact-version-001",
    tenantId: "workspace-001",
    profileId: "profile-001",
    fieldKey: "offer.price",
    version: 1,
    value: "INR 499",
    state: "approved",
    sourceCandidateId: "candidate-001",
    source: Object.freeze({
      sourceId: "source-001",
      captureId: "capture-001",
      sourceLocation: "https://studio.example/offer",
      sourceReference: "offer-card",
      capturedAt: "2026-06-01T09:00:00.000Z",
      extractorId: "approved-html",
      extractorVersion: "1.0.0",
    }),
    reviewAction: "verify",
    reasonCode: "OWNER_VERIFIED",
    supersedesFactVersionId: null,
    conflictResolution: null,
    verifiedByActorId: "actor-owner-001",
    verifiedByRole: "owner",
    verifiedAt: "2026-06-01T10:00:00.000Z",
  }),
  isCurrent: true,
  expiresAt: "2026-07-01T10:00:00.000Z",
  governance: Object.freeze({
    status: "available",
    allowedUseCases: Object.freeze(["campaign_planning", "concierge_response"] as const),
    reasonCode: null,
  }),
});

class FakeReadRepository implements FactFreshnessReadRepositoryPort {
  records: readonly ApprovedContextFactRecord[] = [expiredRecord];
  calls = 0;

  async listCurrentFacts(): Promise<readonly ApprovedContextFactRecord[]> {
    this.calls += 1;
    return this.records;
  }
}

class FakeWriteRepository implements FactReverificationWriteRepositoryPort {
  replay: FactReverificationResult | null = null;
  committed: FactReverificationResult | null = null;

  async findReverificationByIdempotency(): Promise<FactReverificationResult | null> {
    return this.replay;
  }

  async commitReverification(input: {
    result: FactReverificationResult;
  }): Promise<FactReverificationResult> {
    this.committed = input.result;
    return input.result;
  }
}

const request = Object.freeze({
  profileId: "profile-001",
  factVersionId: "fact-version-001",
  expectedVersion: 1,
  newFactVersionId: "fact-version-002",
  idempotencyKey: "fact-reverification:fact-version-001:1",
});

describe("fact reverification", () => {
  it("prioritizes expired facts and derives legacy expiry when storage is empty", async () => {
    const repository = new FakeReadRepository();
    repository.records = [{ ...expiredRecord, expiresAt: null }];
    const queue = await queryFactReverificationQueue(
      ownerContext,
      { profileId: "profile-001", asOf: "2026-07-19T10:00:00.000Z" },
      { repository, now: () => new Date("2026-07-19T10:00:00.000Z") },
    );

    assert.equal(queue.expiredCount, 1);
    assert.equal(queue.items[0]?.status, "expired");
    assert.equal(queue.items[0]?.expiresAt, "2026-07-01T10:00:00.000Z");
    assert.equal(queue.items[0]?.canReverify, true);
  });

  it("creates a fresh immutable version and supports an exact idempotent replay", async () => {
    const readRepository = new FakeReadRepository();
    const writeRepository = new FakeWriteRepository();
    const result = await executeFactReverification(ownerContext, request, {
      readRepository,
      writeRepository,
      now: () => new Date("2026-07-19T10:00:00.000Z"),
    });

    assert.equal(result.version, 2);
    assert.equal(result.supersedesFactVersionId, "fact-version-001");
    assert.equal(result.expiresAt, "2026-08-18T10:00:00.000Z");
    assert.equal(result.reasonCode, "OWNER_REVERIFIED_UNCHANGED");

    writeRepository.replay = result;
    readRepository.records = [];
    const replay = await executeFactReverification(ownerContext, request, {
      readRepository,
      writeRepository,
      now: () => new Date("2026-07-19T10:01:00.000Z"),
    });
    assert.deepEqual(replay, result);
    assert.equal(readRepository.calls, 1);
  });

  it("rejects staff, stale versions, stable facts, and facts that are not due", async () => {
    const readRepository = new FakeReadRepository();
    const writeRepository = new FakeWriteRepository();
    await assert.rejects(
      queryFactReverificationQueue(
        { ...ownerContext, actor: { ...ownerContext.actor, role: "staff" } },
        { profileId: "profile-001" },
        { repository: readRepository, now: () => new Date("2026-07-19T10:00:00.000Z") },
      ),
      (error: unknown) =>
        error instanceof FactReverificationError &&
        error.code === "FACT_REVERIFICATION_ACCESS_DENIED",
    );

    await assert.rejects(
      executeFactReverification(
        ownerContext,
        { ...request, expectedVersion: 2 },
        {
          readRepository,
          writeRepository,
          now: () => new Date("2026-07-19T10:00:00.000Z"),
        },
      ),
      (error: unknown) =>
        error instanceof FactReverificationError &&
        error.code === "FACT_REVERIFICATION_STALE_VERSION",
    );

    readRepository.records = [
      {
        ...expiredRecord,
        fact: { ...expiredRecord.fact, fieldKey: "business.name" },
      },
    ];
    await assert.rejects(
      executeFactReverification(ownerContext, request, {
        readRepository,
        writeRepository,
        now: () => new Date("2026-07-19T10:00:00.000Z"),
      }),
      (error: unknown) =>
        error instanceof FactReverificationError &&
        error.code === "FACT_REVERIFICATION_NOT_TIME_SENSITIVE",
    );

    readRepository.records = [
      {
        ...expiredRecord,
        expiresAt: "2026-08-18T10:00:00.000Z",
      },
    ];
    await assert.rejects(
      executeFactReverification(ownerContext, request, {
        readRepository,
        writeRepository,
        now: () => new Date("2026-07-19T10:00:00.000Z"),
      }),
      (error: unknown) =>
        error instanceof FactReverificationError && error.code === "FACT_REVERIFICATION_NOT_DUE",
    );
  });
});
