import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  ApprovedFactVersion,
  FactReviewResult,
  ReviewableFactCandidate,
} from "@novussync/domain";

import {
  executeFactReview,
  FactReviewAccessError,
  type FactReviewCommandContext,
  type FactReviewRepositoryContext,
  type FactReviewRepositoryPort,
  type FactReviewRequest,
} from "./fact-review.ts";

const candidate: ReviewableFactCandidate = Object.freeze({
  candidateId: "candidate-001",
  tenantId: "workspace-001",
  profileId: "profile-001",
  fieldKey: "business.name",
  value: "Northstar Collective",
  authority: "provisional",
  verificationStatus: "unverified",
  source: Object.freeze({
    sourceId: "source-001",
    captureId: "capture-001",
    sourceLocation: "https://northstar.example/about",
    sourceReference: "main#business-name",
    capturedAt: "2026-07-19T01:00:00.000Z",
    extractorId: "bounded-html-fixture",
    extractorVersion: "1.0.0",
  }),
  conflict: Object.freeze({ kind: "none", detail: null }),
});

const ownerContext: FactReviewCommandContext = Object.freeze({
  tenant: Object.freeze({
    organizationId: "organization-001",
    workspaceId: "workspace-001",
  }),
  actor: Object.freeze({
    id: "actor-owner-001",
    actorType: "human",
    role: "owner",
    accessKind: "membership",
  }),
  sessionExpiresAt: "2026-07-19T04:00:00.000Z",
  requestId: "request-001",
});

class FakeFactReviewRepository implements FactReviewRepositoryPort {
  readonly calls: string[] = [];
  candidate: ReviewableFactCandidate | null = candidate;
  currentFact: ApprovedFactVersion | null = null;
  committed: FactReviewResult | null = null;
  replay: FactReviewResult | null = null;

  async findReviewByIdempotency(): Promise<FactReviewResult | null> {
    this.calls.push("findReviewByIdempotency");
    return this.replay;
  }

  async findCandidate(): Promise<ReviewableFactCandidate | null> {
    this.calls.push("findCandidate");
    return this.candidate;
  }

  async findCurrentFact(): Promise<ApprovedFactVersion | null> {
    this.calls.push("findCurrentFact");
    return this.currentFact;
  }

  async commitReview(input: {
    context: FactReviewRepositoryContext;
    idempotencyKey: string;
    request: FactReviewRequest;
    review: FactReviewResult;
  }): Promise<FactReviewResult> {
    this.calls.push("commitReview");
    this.committed = input.review;
    return input.review;
  }
}

const command = Object.freeze({
  candidateId: "candidate-001",
  expectedCurrentFactVersion: 0,
  expectedDecisionVersion: 0,
  action: "verify" as const,
  decisionId: "decision-001",
  factVersionId: "fact-version-001",
  idempotencyKey: "fact-review:request-001",
});

describe("executeFactReview", () => {
  it("authorizes before loading tenant-scoped state and commits one owner review", async () => {
    const repository = new FakeFactReviewRepository();
    const result = await executeFactReview(ownerContext, command, {
      repository,
      now: () => new Date("2026-07-19T02:00:00.000Z"),
    });

    assert.equal(result.kind, "approved");
    assert.deepEqual(repository.calls, [
      "findReviewByIdempotency",
      "findCandidate",
      "findCurrentFact",
      "commitReview",
    ]);
    assert.equal(repository.committed?.decision.decidedByActorId, "actor-owner-001");
  });

  it("returns an authorized tenant-scoped replay before loading changed fact state", async () => {
    const firstRepository = new FakeFactReviewRepository();
    const first = await executeFactReview(ownerContext, command, {
      repository: firstRepository,
      now: () => new Date("2026-07-19T02:00:00.000Z"),
    });
    const replayRepository = new FakeFactReviewRepository();
    replayRepository.replay = first;
    replayRepository.candidate = null;

    const replay = await executeFactReview(ownerContext, command, {
      repository: replayRepository,
      now: () => new Date("2026-07-19T03:00:00.000Z"),
    });

    assert.deepEqual(replay, first);
    assert.deepEqual(replayRepository.calls, ["findReviewByIdempotency"]);
  });

  it("rejects staff and expired sessions before repository access", async () => {
    const repository = new FakeFactReviewRepository();
    await assert.rejects(
      executeFactReview(
        {
          ...ownerContext,
          actor: { ...ownerContext.actor, role: "staff" },
        },
        command,
        { repository, now: () => new Date("2026-07-19T02:00:00.000Z") },
      ),
      (error: unknown) =>
        error instanceof FactReviewAccessError && error.code === "FACT_REVIEW_ACCESS_DENIED",
    );
    await assert.rejects(
      executeFactReview(ownerContext, command, {
        repository,
        now: () => new Date("2026-07-19T05:00:00.000Z"),
      }),
      (error: unknown) =>
        error instanceof FactReviewAccessError && error.code === "FACT_REVIEW_SESSION_INVALID",
    );
    assert.deepEqual(repository.calls, []);
  });

  it("fails closed when a scoped candidate cannot be loaded", async () => {
    const repository = new FakeFactReviewRepository();
    repository.candidate = null;

    await assert.rejects(
      executeFactReview(ownerContext, command, {
        repository,
        now: () => new Date("2026-07-19T02:00:00.000Z"),
      }),
      (error: unknown) =>
        error instanceof FactReviewAccessError && error.code === "FACT_REVIEW_CANDIDATE_NOT_FOUND",
    );
    assert.deepEqual(repository.calls, ["findReviewByIdempotency", "findCandidate"]);
  });
});
