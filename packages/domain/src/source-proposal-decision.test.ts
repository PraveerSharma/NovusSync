import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  SourceProposalError,
  approveBusinessWebsiteSource,
  createFactCandidate,
  createFactCandidateReviewDecision,
  createSourceCapture,
} from "./source-proposal.ts";

const approvedAt = "2026-07-18T08:00:00.000Z";
const capturedAt = "2026-07-18T08:05:00.000Z";

function candidateFixture() {
  const source = approveBusinessWebsiteSource({
    sourceId: "source-1",
    tenantId: "workspace-1",
    entryUrl: "https://studio.example.com/about",
    approval: { actorId: "owner-1", actorRole: "owner", approvedAt },
  });
  const capture = createSourceCapture({
    source,
    captureId: "capture-1",
    sourceLocation: source.entryUrl,
    sourceReference: "primary-domain",
    capturedAt,
    extractor: { id: "approved-html", version: "1.0.0" },
    contentDigest: "sha256:decision-fixture",
    contentBytes: 512,
  });
  return createFactCandidate({
    candidateId: "candidate-1",
    profileId: "profile-1",
    source,
    capture,
    fieldKey: "business.summary",
    factTemplateVersion: "business-summary@1",
    playbookVersion: "yoga-studio@1",
    value: "A source proposal.",
    allowedUseCases: ["profile_review"],
    confidence: 0.9,
    conflict: { kind: "none", detail: null },
    createdAt: capturedAt,
  });
}

describe("fact candidate review decisions", () => {
  it("records an owner decision without applying or promoting the candidate", () => {
    const candidate = candidateFixture();
    const decision = createFactCandidateReviewDecision({
      decisionId: "decision-1",
      candidate,
      decisionVersion: 1,
      outcome: "approved_for_profile_draft",
      reasonCode: "OWNER_CONFIRMED_SOURCE",
      decidedByActorId: "owner-1",
      decidedByRole: "owner",
      decidedAt: "2026-07-18T08:10:00.000Z",
    });

    assert.equal(decision.applicationStatus, "not_applied");
    assert.equal(decision.candidateAuthority, "provisional");
    assert.equal(decision.decisionVersion, 1);
    assert.equal(candidate.verificationStatus, "unverified");
  });

  it("rejects malformed versions and reason codes", () => {
    const candidate = candidateFixture();
    assert.throws(
      () =>
        createFactCandidateReviewDecision({
          decisionId: "decision-invalid",
          candidate,
          decisionVersion: 0,
          outcome: "rejected",
          reasonCode: "not bounded",
          decidedByActorId: "owner-1",
          decidedByRole: "owner",
          decidedAt: "2026-07-18T08:10:00.000Z",
        }),
      (error: unknown) =>
        error instanceof SourceProposalError && error.code === "INVALID_CANDIDATE",
    );
  });
});
