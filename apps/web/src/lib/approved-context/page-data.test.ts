import assert from "node:assert/strict";
import test from "node:test";

import type { ApprovedContextSnapshot } from "@novussync/application";

import {
  createSyntheticApprovedContextPageData,
  createVerifiedApprovedContextPageData,
  parseApprovedContextScope,
  parseApprovedContextUiUseCase,
} from "./page-data.ts";

const scope = Object.freeze({
  organizationId: "11111111-1111-4111-8111-111111111111",
  workspaceId: "22222222-2222-4222-8222-222222222222",
  profileId: "33333333-3333-4333-8333-333333333333",
});

test("parses only one complete scoped workspace request", () => {
  assert.deepEqual(parseApprovedContextScope(scope), scope);
  assert.equal(parseApprovedContextScope({ ...scope, workspaceId: "not-a-uuid" }), null);
  assert.equal(parseApprovedContextScope({ ...scope, profileId: [scope.profileId] }), null);
  assert.equal(parseApprovedContextUiUseCase("concierge"), "concierge");
  assert.equal(parseApprovedContextUiUseCase("unsupported"), "campaign");
});

test("accepts a bounded text profile identifier while rejecting unsafe values", () => {
  assert.deepEqual(parseApprovedContextScope({ ...scope, profileId: "northstar-yoga-primary" }), {
    ...scope,
    profileId: "northstar-yoga-primary",
  });
  assert.equal(parseApprovedContextScope({ ...scope, profileId: "../other-profile" }), null);
});

test("never serializes blocked synthetic values into page data", () => {
  const page = createSyntheticApprovedContextPageData("campaign");
  const trial = page.facts.find((fact) => fact.id === "trial-policy");
  assert.equal(trial?.state, "blocked");
  assert.equal(trial && "value" in trial, false);
  assert.equal(
    page.facts.find((fact) => fact.id === "business-name")?.value,
    "Northstar Yoga Studio",
  );
});

test("maps a scoped immutable snapshot into cited UI data and explicit unknowns", () => {
  const snapshot: ApprovedContextSnapshot = Object.freeze({
    snapshotId: `verified-context:sha256:${"a".repeat(64)}`,
    schemaVersion: 1,
    organizationId: scope.organizationId,
    workspaceId: scope.workspaceId,
    profileId: scope.profileId,
    useCase: "campaign_planning",
    asOf: "2026-07-19T08:00:00.000Z",
    items: Object.freeze([
      Object.freeze({
        status: "usable" as const,
        fieldKey: "business_name",
        value: "Northstar Yoga Studio",
        citation: Object.freeze({
          factVersionId: "fact-version-1",
          version: 4,
          sourceCandidateId: "candidate-1",
          source: Object.freeze({
            sourceId: "source-1",
            captureId: "capture-1",
            sourceLocation: "owner-approved-profile",
            sourceReference: "Owner profile review",
            capturedAt: "2026-07-18T08:00:00.000Z",
            extractorId: "owner-review",
            extractorVersion: "1",
          }),
          verifiedByActorId: "actor-1",
          verifiedAt: "2026-07-18T09:00:00.000Z",
        }),
        freshness: Object.freeze({
          status: "current" as const,
          asOf: "2026-07-19T08:00:00.000Z",
          expiresAt: null,
        }),
      }),
      Object.freeze({
        status: "unavailable" as const,
        fieldKey: "ideal_audience",
        reason: Object.freeze({
          code: "APPROVED_CONTEXT_MISSING" as const,
          detail: "No current approved fact is available.",
          governanceReasonCode: null,
        }),
      }),
    ]),
  });

  const page = createVerifiedApprovedContextPageData(snapshot, scope, "campaign");
  assert.equal(page.sourceMode, "verified");
  assert.equal(page.facts[0]?.label, "Business name");
  assert.equal(page.facts[0]?.source, "Owner profile review");
  assert.equal(page.facts[1]?.state, "review");
  assert.equal(page.facts[1] && "value" in page.facts[1], false);
  assert.match(page.switchUrls.concierge, /useCase=concierge/);
  assert.match(page.switchUrls.concierge, new RegExp(scope.workspaceId));

  assert.throws(
    () =>
      createVerifiedApprovedContextPageData(
        snapshot,
        { ...scope, profileId: scope.workspaceId },
        "campaign",
      ),
    /scope does not match/,
  );
});
