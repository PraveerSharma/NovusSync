import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  approveBusinessWebsiteSource,
  createFactCandidate,
  createSourceCapture,
  type FactCandidateReviewDecision,
} from "@novussync/domain";

import {
  SourceProposalDecisionAccessError,
  recordSourceProposalOwnerDecision,
  type SourceProposalPersistenceContext,
  type SourceProposalRepositoryPort,
} from "./source-proposal-persistence.ts";

const candidate = (() => {
  const source = approveBusinessWebsiteSource({
    sourceId: "source-1",
    tenantId: "workspace-1",
    entryUrl: "https://studio.example.com/about",
    approval: {
      actorId: "owner-1",
      actorRole: "owner",
      approvedAt: "2026-07-18T08:00:00.000Z",
    },
  });
  const capture = createSourceCapture({
    source,
    captureId: "capture-1",
    sourceLocation: source.entryUrl,
    sourceReference: "primary-domain",
    capturedAt: "2026-07-18T08:05:00.000Z",
    extractor: { id: "approved-html", version: "1.0.0" },
    contentDigest: "sha256:application-decision",
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
    value: "A proposal.",
    allowedUseCases: ["profile_review"],
    confidence: 0.9,
    conflict: { kind: "none", detail: null },
    createdAt: "2026-07-18T08:05:00.000Z",
  });
})();

const ownerContext: SourceProposalPersistenceContext = {
  tenant: { organizationId: "organization-1", workspaceId: "workspace-1" },
  actor: { id: "owner-1", actorType: "human", role: "owner" },
  correlationId: "correlation-1",
  session: { expiresAt: "2026-07-18T10:00:00.000Z" },
};

function repositorySpy() {
  const recorded: FactCandidateReviewDecision[] = [];
  const repository: SourceProposalRepositoryPort = {
    persistBatch: async (_context, batch) => batch,
    findBatch: async () => null,
    recordDecision: async (_context, _candidate, decision) => {
      recorded.push(decision);
      return decision;
    },
    listDecisions: async () => recorded,
  };
  return { repository, recorded };
}

describe("recordSourceProposalOwnerDecision", () => {
  it("creates a versioned no-effect decision for the repository", async () => {
    const spy = repositorySpy();
    const decision = await recordSourceProposalOwnerDecision(spy.repository, ownerContext, {
      decisionId: "decision-1",
      candidate,
      expectedCurrentVersion: 0,
      outcome: "approved_for_profile_draft",
      reasonCode: "OWNER_CONFIRMED_SOURCE",
      decidedAt: "2026-07-18T08:10:00.000Z",
      idempotencyKey: "decision:1",
    });

    assert.equal(decision.decisionVersion, 1);
    assert.equal(decision.applicationStatus, "not_applied");
    assert.equal(spy.recorded.length, 1);
  });

  it("rejects non-owner and cross-workspace decisions before persistence", async () => {
    const spy = repositorySpy();
    const command = {
      decisionId: "decision-denied",
      candidate,
      expectedCurrentVersion: 0,
      outcome: "rejected" as const,
      reasonCode: "OWNER_REJECTED_SOURCE",
      decidedAt: "2026-07-18T08:10:00.000Z",
      idempotencyKey: "decision:denied",
    };

    await assert.rejects(
      () =>
        recordSourceProposalOwnerDecision(
          spy.repository,
          { ...ownerContext, actor: { ...ownerContext.actor, role: "staff" } },
          command,
        ),
      (error: unknown) =>
        error instanceof SourceProposalDecisionAccessError && error.code === "OWNER_REQUIRED",
    );
    await assert.rejects(
      () =>
        recordSourceProposalOwnerDecision(
          spy.repository,
          {
            ...ownerContext,
            tenant: { ...ownerContext.tenant, workspaceId: "workspace-other" },
          },
          command,
        ),
      (error: unknown) =>
        error instanceof SourceProposalDecisionAccessError && error.code === "TENANT_MISMATCH",
    );
    assert.equal(spy.recorded.length, 0);
  });
});
