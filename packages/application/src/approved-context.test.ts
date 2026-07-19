import assert from "node:assert/strict";
import test from "node:test";

import type { ApprovedContextFactRecord, ApprovedFactVersion } from "@novussync/domain";
import {
  ApprovedContextQueryError,
  queryApprovedContext,
  type ApprovedContextQueryContext,
  type ApprovedContextRepository,
} from "./approved-context.ts";

const FIXED_NOW = new Date("2026-07-19T10:00:00.000Z");

function fact(value = "Northstar Yoga"): ApprovedFactVersion {
  return {
    factVersionId: "fact-version-1",
    tenantId: "tenant-1",
    profileId: "profile-1",
    fieldKey: "business.name",
    version: 1,
    value,
    state: "approved",
    sourceCandidateId: "candidate-1",
    source: { sourceType: "owner_interview", sourceReference: "INT-002" },
    reviewAction: "approve",
    reasonCode: "OWNER_CONFIRMED",
    supersedesFactVersionId: null,
    conflictResolution: null,
    verifiedByActorId: "owner-1",
    verifiedByRole: "owner",
    verifiedAt: "2026-07-18T09:00:00.000Z",
  } as unknown as ApprovedFactVersion;
}

function context(
  overrides: Partial<ApprovedContextQueryContext> = {},
): ApprovedContextQueryContext {
  return {
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    actor: { actorId: "owner-1", role: "owner" },
    sessionExpiresAt: "2026-07-19T11:00:00.000Z",
    requestId: "request-1",
    ...overrides,
  };
}

function repository(
  records: readonly ApprovedContextFactRecord[],
  calls: unknown[],
): ApprovedContextRepository {
  return {
    async loadApprovedContextRecords(input) {
      calls.push(input);
      return records;
    },
  };
}

const query = {
  tenantId: "tenant-1",
  workspaceId: "workspace-1",
  profileId: "profile-1",
  useCase: "campaign_planning" as const,
  fieldKeys: ["business.name"],
};

function availableRecord(value = "Northstar Yoga"): ApprovedContextFactRecord {
  return {
    fact: fact(value),
    isCurrent: true,
    expiresAt: null,
    governance: {
      status: "available",
      allowedUseCases: ["campaign_planning"],
      reasonCode: null,
    },
  };
}

test("authorizes, projects and seals an immutable verified-context snapshot", async () => {
  const calls: unknown[] = [];
  const dependencies = {
    repository: repository([availableRecord()], calls),
    now: () => FIXED_NOW,
  };
  const first = await queryApprovedContext(context(), query, dependencies);
  const second = await queryApprovedContext(context(), query, dependencies);
  assert.equal(calls.length, 2);
  assert.match(first.snapshotId, /^verified-context:sha256:[a-f0-9]{64}$/);
  assert.equal(first.snapshotId, second.snapshotId);
  assert.equal(first.items[0]?.status, "usable");
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.items), true);
});

test("snapshot identity changes when verified content changes", async () => {
  const first = await queryApprovedContext(context(), query, {
    repository: repository([availableRecord("Northstar Yoga")], []),
    now: () => FIXED_NOW,
  });
  const second = await queryApprovedContext(context(), query, {
    repository: repository([availableRecord("Northstar Movement")], []),
    now: () => FIXED_NOW,
  });
  assert.notEqual(first.snapshotId, second.snapshotId);
});

test("rejects cross-workspace requests before repository access", async () => {
  const calls: unknown[] = [];
  await assert.rejects(
    queryApprovedContext(
      context(),
      { ...query, workspaceId: "workspace-2" },
      { repository: repository([], calls), now: () => FIXED_NOW },
    ),
    (error: unknown) =>
      error instanceof ApprovedContextQueryError && error.code === "APPROVED_CONTEXT_UNAUTHORIZED",
  );
  assert.equal(calls.length, 0);
});

test("rejects expired sessions before repository access", async () => {
  const calls: unknown[] = [];
  await assert.rejects(
    queryApprovedContext(context({ sessionExpiresAt: "2026-07-19T09:59:59.000Z" }), query, {
      repository: repository([], calls),
      now: () => FIXED_NOW,
    }),
    (error: unknown) =>
      error instanceof ApprovedContextQueryError &&
      error.code === "APPROVED_CONTEXT_SESSION_EXPIRED",
  );
  assert.equal(calls.length, 0);
});
