import assert from "node:assert/strict";
import test from "node:test";

import type { ApprovedContextFactRecord, ApprovedFactVersion } from "@novussync/domain";
import {
  ApprovedContextQueryError,
  queryApprovedContext,
  type ApprovedContextQueryContext,
  type ApprovedContextRepository,
  type ApprovedContextSnapshot,
} from "./approved-context.ts";

const FIXED_NOW = new Date("2026-07-19T10:00:00.000Z");
const tenant = {
  organizationId: "00000000-0000-4000-8000-000000000001",
  workspaceId: "00000000-0000-4000-8000-000000000002",
};

function fact(value = "Northstar Yoga"): ApprovedFactVersion {
  return {
    factVersionId: "fact-version-1",
    tenantId: tenant.workspaceId,
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
    verifiedByActorId: "00000000-0000-4000-8000-000000000003",
    verifiedByRole: "owner",
    verifiedAt: "2026-07-18T09:00:00.000Z",
  } as unknown as ApprovedFactVersion;
}

function context(
  overrides: Partial<ApprovedContextQueryContext> = {},
): ApprovedContextQueryContext {
  return {
    tenant,
    actor: {
      id: "00000000-0000-4000-8000-000000000003",
      actorType: "human",
      role: "owner",
      accessKind: "membership",
    },
    sessionExpiresAt: "2026-07-19T11:00:00.000Z",
    requestId: "request-1",
    ...overrides,
  };
}

function repository(
  records: readonly ApprovedContextFactRecord[],
  calls: string[],
  snapshots: ApprovedContextSnapshot[],
): ApprovedContextRepository {
  return {
    async loadApprovedContextRecords() {
      calls.push("load");
      return records;
    },
    async persistApprovedContextSnapshot(_context, snapshot) {
      calls.push("persist");
      snapshots.push(snapshot);
    },
  };
}

const query = {
  tenant,
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

test("authorizes, projects and persists an immutable verified-context snapshot", async () => {
  const calls: string[] = [];
  const snapshots: ApprovedContextSnapshot[] = [];
  const dependencies = {
    repository: repository([availableRecord()], calls, snapshots),
    now: () => FIXED_NOW,
  };
  const first = await queryApprovedContext(context(), query, dependencies);
  const second = await queryApprovedContext(context(), query, dependencies);
  assert.deepEqual(calls, ["load", "persist", "load", "persist"]);
  assert.equal(snapshots.length, 2);
  assert.match(first.snapshotId, /^verified-context:sha256:[a-f0-9]{64}$/);
  assert.equal(first.snapshotId, second.snapshotId);
  assert.equal(first.organizationId, tenant.organizationId);
  assert.equal(first.workspaceId, tenant.workspaceId);
  assert.equal(first.items[0]?.status, "usable");
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.items), true);
});

test("snapshot identity changes when verified content changes", async () => {
  const first = await queryApprovedContext(context(), query, {
    repository: repository([availableRecord("Northstar Yoga")], [], []),
    now: () => FIXED_NOW,
  });
  const second = await queryApprovedContext(context(), query, {
    repository: repository([availableRecord("Northstar Movement")], [], []),
    now: () => FIXED_NOW,
  });
  assert.notEqual(first.snapshotId, second.snapshotId);
});

test("rejects cross-workspace requests before repository access", async () => {
  const calls: string[] = [];
  await assert.rejects(
    queryApprovedContext(
      context(),
      {
        ...query,
        tenant: { ...tenant, workspaceId: "00000000-0000-4000-8000-000000000099" },
      },
      { repository: repository([], calls, []), now: () => FIXED_NOW },
    ),
    (error: unknown) =>
      error instanceof ApprovedContextQueryError && error.code === "APPROVED_CONTEXT_UNAUTHORIZED",
  );
  assert.deepEqual(calls, []);
});

test("rejects expired sessions and malformed queries before repository access", async () => {
  const calls: string[] = [];
  const dependency = { repository: repository([], calls, []), now: () => FIXED_NOW };
  await assert.rejects(
    queryApprovedContext(
      context({ sessionExpiresAt: "2026-07-19T09:59:59.000Z" }),
      query,
      dependency,
    ),
    (error: unknown) =>
      error instanceof ApprovedContextQueryError &&
      error.code === "APPROVED_CONTEXT_SESSION_EXPIRED",
  );
  await assert.rejects(
    queryApprovedContext(context(), { ...query, fieldKeys: [] }, dependency),
    (error: unknown) =>
      error instanceof ApprovedContextQueryError && error.code === "APPROVED_CONTEXT_INVALID_QUERY",
  );
  assert.deepEqual(calls, []);
});
