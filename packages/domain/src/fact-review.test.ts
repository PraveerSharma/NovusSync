import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  FactReviewError,
  reviewFactCandidate,
  type ApprovedFactVersion,
  type ReviewableFactCandidate,
} from "./fact-review.ts";

const source = Object.freeze({
  sourceId: "source-website-001",
  captureId: "capture-001",
  sourceLocation: "https://northstar.example/intro",
  sourceReference: "main#intro-offer",
  capturedAt: "2026-07-19T01:00:00.000Z",
  extractorId: "bounded-html-fixture",
  extractorVersion: "1.0.0",
});

function candidate(overrides: Partial<ReviewableFactCandidate> = {}): ReviewableFactCandidate {
  return Object.freeze({
    candidateId: "candidate-001",
    tenantId: "workspace-001",
    profileId: "profile-001",
    fieldKey: "business.name",
    value: "Northstar Collective",
    authority: "provisional",
    verificationStatus: "unverified",
    source,
    conflict: Object.freeze({ kind: "none", detail: null }),
    ...overrides,
  });
}

function currentFact(): ApprovedFactVersion {
  return Object.freeze({
    factVersionId: "fact-version-001",
    tenantId: "workspace-001",
    profileId: "profile-001",
    fieldKey: "business.name",
    version: 1,
    value: "Northstar Yoga",
    state: "approved",
    sourceCandidateId: "candidate-prior",
    source,
    reviewAction: "verify",
    reasonCode: "OWNER_VERIFIED",
    supersedesFactVersionId: null,
    conflictResolution: null,
    verifiedByActorId: "actor-owner-001",
    verifiedByRole: "owner",
    verifiedAt: "2026-07-19T01:30:00.000Z",
  });
}

const baseInput = Object.freeze({
  currentFact: null,
  expectedCurrentFactVersion: 0,
  expectedDecisionVersion: 0,
  decisionId: "decision-001",
  factVersionId: "fact-version-002",
  actor: Object.freeze({
    id: "actor-owner-001",
    actorType: "human" as const,
    role: "owner" as const,
  }),
  reviewedAt: "2026-07-19T02:00:00.000Z",
});

describe("owner fact review", () => {
  it("verifies a clean candidate into an immutable approved version without applying the profile", () => {
    const result = reviewFactCandidate({
      ...baseInput,
      candidate: candidate(),
      action: "verify",
    });

    assert.equal(result.kind, "approved");
    if (result.kind !== "approved") return;
    assert.equal(result.factVersion.version, 1);
    assert.equal(result.factVersion.value, "Northstar Collective");
    assert.equal(result.factVersion.state, "approved");
    assert.equal(result.decision.profileApplicationStatus, "not_applied");
    assert.equal(result.decision.reasonCode, "OWNER_VERIFIED");
    assert(Object.isFrozen(result.factVersion));
    assert(Object.isFrozen(result.factVersion.source));
  });

  it("creates a superseding corrected version with an explicit reason", () => {
    const result = reviewFactCandidate({
      ...baseInput,
      candidate: candidate(),
      currentFact: currentFact(),
      expectedCurrentFactVersion: 1,
      action: "correct_and_verify",
      reviewedValue: "Northstar Collective Yoga",
      reasonCode: "OWNER_CORRECTION",
    });

    assert.equal(result.kind, "approved");
    if (result.kind !== "approved") return;
    assert.equal(result.factVersion.version, 2);
    assert.equal(result.factVersion.value, "Northstar Collective Yoga");
    assert.equal(result.factVersion.supersedesFactVersionId, "fact-version-001");
    assert.equal(result.factVersion.reviewAction, "correct_and_verify");
  });

  it("requires explicit resolution for a conflicting source", () => {
    const conflicting = candidate({
      fieldKey: "offer.trialPolicy",
      value: "First introductory class is free",
      conflict: Object.freeze({
        kind: "source_disagreement",
        detail: "Current approved policy lists a paid introductory class.",
      }),
    });

    assert.throws(
      () =>
        reviewFactCandidate({
          ...baseInput,
          candidate: conflicting,
          action: "verify",
        }),
      (error: unknown) =>
        error instanceof FactReviewError &&
        error.code === "FACT_REVIEW_CONFLICT_REQUIRES_RESOLUTION",
    );

    const resolved = reviewFactCandidate({
      ...baseInput,
      candidate: conflicting,
      action: "resolve_conflict",
      reviewedValue: "Introductory class is ₹299",
      reasonCode: "CURRENT_POLICY_CONFIRMED",
    });

    assert.equal(resolved.kind, "approved");
    if (resolved.kind !== "approved") return;
    assert.deepEqual(resolved.factVersion.conflictResolution, {
      kind: "source_disagreement",
      reasonCode: "CURRENT_POLICY_CONFIRMED",
    });
  });

  it("records rejection without replacing an existing approved fact", () => {
    const result = reviewFactCandidate({
      ...baseInput,
      candidate: candidate(),
      currentFact: currentFact(),
      expectedCurrentFactVersion: 1,
      action: "reject",
      reasonCode: "SOURCE_OUTDATED",
      factVersionId: undefined,
    });

    assert.equal(result.kind, "rejected");
    if (result.kind !== "rejected") return;
    assert.equal(result.currentFactVersionId, "fact-version-001");
    assert.equal(result.decision.approvedFactVersionId, null);
    assert.equal(result.decision.profileApplicationStatus, "not_applied");
  });

  it("fails closed for non-owners, stale versions, and fake corrections", () => {
    assert.throws(
      () =>
        reviewFactCandidate({
          ...baseInput,
          candidate: candidate(),
          action: "verify",
          actor: { id: "actor-staff-001", actorType: "human", role: "staff" },
        }),
      (error: unknown) =>
        error instanceof FactReviewError && error.code === "FACT_REVIEW_NOT_AUTHORIZED",
    );

    assert.throws(
      () =>
        reviewFactCandidate({
          ...baseInput,
          candidate: candidate(),
          currentFact: currentFact(),
          expectedCurrentFactVersion: 0,
          action: "verify",
        }),
      (error: unknown) =>
        error instanceof FactReviewError && error.code === "FACT_REVIEW_STALE_VERSION",
    );

    assert.throws(
      () =>
        reviewFactCandidate({
          ...baseInput,
          candidate: candidate(),
          action: "correct_and_verify",
          reviewedValue: "Northstar Collective",
          reasonCode: "OWNER_CORRECTION",
        }),
      (error: unknown) =>
        error instanceof FactReviewError && error.code === "FACT_REVIEW_CORRECTION_REQUIRED",
    );
  });
});
