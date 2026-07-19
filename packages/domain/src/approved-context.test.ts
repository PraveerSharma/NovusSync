import assert from "node:assert/strict";
import test from "node:test";

import type { ApprovedFactVersion } from "./fact-review.ts";
import {
  ApprovedContextError,
  projectApprovedContext,
  type ApprovedContextFactRecord,
  type ApprovedContextRequest,
} from "./approved-context.ts";

function approvedFact(overrides: Partial<ApprovedFactVersion> = {}): ApprovedFactVersion {
  return {
    factVersionId: "fact-version-1",
    tenantId: "tenant-1",
    profileId: "profile-1",
    fieldKey: "business.name",
    version: 3,
    value: "Northstar Yoga",
    state: "approved",
    sourceCandidateId: "candidate-1",
    source: { sourceType: "owner_interview", sourceReference: "INT-002" },
    reviewAction: "approve",
    reasonCode: "OWNER_CONFIRMED",
    supersedesFactVersionId: "fact-version-0",
    conflictResolution: null,
    verifiedByActorId: "owner-1",
    verifiedByRole: "owner",
    verifiedAt: "2026-07-18T09:00:00.000Z",
    ...overrides,
  } as unknown as ApprovedFactVersion;
}

function record(overrides: Partial<ApprovedContextFactRecord> = {}): ApprovedContextFactRecord {
  return {
    fact: approvedFact(),
    isCurrent: true,
    expiresAt: "2026-08-18T09:00:00.000Z",
    governance: {
      status: "available",
      allowedUseCases: ["campaign_planning", "concierge_response"],
      reasonCode: null,
    },
    ...overrides,
  };
}

function request(overrides: Partial<ApprovedContextRequest> = {}): ApprovedContextRequest {
  return {
    tenantId: "tenant-1",
    profileId: "profile-1",
    useCase: "campaign_planning",
    fieldKeys: ["business.name"],
    asOf: "2026-07-19T09:00:00.000Z",
    records: [record()],
    ...overrides,
  };
}

test("projects a current approved fact with citation and freshness", () => {
  const result = projectApprovedContext(request());
  const item = result.items[0];
  assert.equal(item.status, "usable");
  if (item.status === "usable") {
    assert.equal(item.value, "Northstar Yoga");
    assert.equal(item.citation.factVersionId, "fact-version-1");
    assert.equal(item.citation.version, 3);
    assert.equal(item.freshness.status, "current");
  }
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.items), true);
  assert.equal(Object.isFrozen(item), true);
});

test("returns explicit unavailable reasons instead of unsafe assertions", () => {
  const cases = [
    { name: "missing", records: [], code: "APPROVED_CONTEXT_MISSING" },
    {
      name: "cross scope",
      records: [record({ fact: approvedFact({ tenantId: "tenant-2" }) })],
      code: "APPROVED_CONTEXT_CROSS_SCOPE",
    },
    {
      name: "not current",
      records: [record({ isCurrent: false })],
      code: "APPROVED_CONTEXT_NOT_CURRENT",
    },
    {
      name: "integrity conflict",
      records: [record(), record({ fact: approvedFact({ factVersionId: "fact-2" }) })],
      code: "APPROVED_CONTEXT_INTEGRITY_CONFLICT",
    },
    {
      name: "expired",
      records: [record({ expiresAt: "2026-07-18T09:00:00.000Z" })],
      code: "APPROVED_CONTEXT_EXPIRED",
    },
    {
      name: "restricted",
      records: [
        record({
          governance: {
            status: "restricted",
            allowedUseCases: ["concierge_response"],
            reasonCode: "OWNER_ONLY",
          },
        }),
      ],
      code: "APPROVED_CONTEXT_RESTRICTED",
    },
    {
      name: "disputed",
      records: [
        record({
          governance: {
            status: "disputed",
            allowedUseCases: ["campaign_planning"],
            reasonCode: "OWNER_REVIEW_REQUIRED",
          },
        }),
      ],
      code: "APPROVED_CONTEXT_DISPUTED",
    },
  ] as const;

  for (const scenario of cases) {
    const item = projectApprovedContext(request({ records: scenario.records })).items[0];
    assert.equal(item.status, "unavailable", scenario.name);
    if (item.status === "unavailable") {
      assert.equal(item.reason.code, scenario.code, scenario.name);
      assert.equal("value" in item, false, scenario.name);
    }
  }
});

test("rejects malformed or ambiguous requests", () => {
  assert.throws(() => projectApprovedContext(request({ fieldKeys: [] })), ApprovedContextError);
  assert.throws(
    () => projectApprovedContext(request({ fieldKeys: ["business.name", "business.name"] })),
    /must not contain duplicates/,
  );
  assert.throws(
    () => projectApprovedContext(request({ asOf: "not-a-date" })),
    /valid ISO timestamp/,
  );
});
