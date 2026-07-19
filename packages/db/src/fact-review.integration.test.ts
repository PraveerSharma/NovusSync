import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  executeFactReverification,
  executeFactReview,
  FactReviewAccessError,
  queryFactReverificationQueue,
  type FactReviewCommandContext,
  type SourceProposalPersistenceContext,
} from "@novussync/application";
import {
  approveBusinessWebsiteSource,
  createFactCandidate,
  createSourceCapture,
  createSourceProposalBatch,
  type FactConflictKind,
} from "@novussync/domain";

import { createDatabase, type DatabaseHandle } from "./client.js";
import {
  createApprovedContextRepository,
  type ApprovedContextPersistenceRepository,
} from "./approved-context-repository.js";
import {
  createFactReverificationRepository,
  type FactReverificationRepository,
} from "./fact-reverification-repository.js";
import { createFactReviewRepository, type FactReviewRepository } from "./fact-review-repository.js";
import {
  createSourceProposalRepository,
  type SourceProposalRepository,
} from "./source-proposal-repository.js";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "TEST_DATABASE_URL is required. Fact-review integration tests must use an isolated synthetic database.",
  );
}

const fixture = Object.freeze({
  organizationA: randomUUID(),
  workspaceA: randomUUID(),
  actorA: randomUUID(),
  profileA: `profile-${randomUUID()}`,
  organizationB: randomUUID(),
  workspaceB: randomUUID(),
  actorB: randomUUID(),
  profileB: `profile-${randomUUID()}`,
});

let database: DatabaseHandle;
let repository: FactReviewRepository;
let sourceRepository: SourceProposalRepository;
let approvedContextRepository: ApprovedContextPersistenceRepository;
let reverificationRepository: FactReverificationRepository;

describe("tenant-scoped fact-review persistence", () => {
  beforeAll(async () => {
    database = createDatabase({
      connectionString,
      applicationName: "novussync-fact-review-integration",
      maxConnections: 6,
    });
    repository = createFactReviewRepository(database.db);
    sourceRepository = createSourceProposalRepository(database.db);
    approvedContextRepository = createApprovedContextRepository(database.db);
    reverificationRepository = createFactReverificationRepository(database.db);
    await seedTenantsAndProfiles();
  });

  afterAll(async () => database.close());

  it("commits and replays one approved fact with immutable provenance and audit", async () => {
    const candidate = await persistCandidate({ fieldKey: "business.name" });
    const idempotencyKey = `fact-review:${randomUUID()}`;
    const command = {
      candidateId: candidate.candidateId,
      expectedCurrentFactVersion: 0,
      expectedDecisionVersion: 0,
      action: "verify" as const,
      decisionId: `decision-${randomUUID()}`,
      factVersionId: `fact-version-${randomUUID()}`,
      idempotencyKey,
    };

    const approved = await executeFactReview(factContextA(), command, {
      repository,
    });
    const replayed = await executeFactReview(factContextA(), command, {
      repository,
    });
    const current = await repository.findCurrentFact(
      repositoryContextA(),
      fixture.profileA,
      "business.name",
    );

    expect(approved.kind).toBe("approved");
    expect(replayed).toEqual(approved);
    expect(current).toMatchObject({
      version: 1,
      sourceCandidateId: candidate.candidateId,
      supersedesFactVersionId: null,
      reviewAction: "verify",
    });
    const audit = await database.pool.query(
      `select action, evidence_state, safe_metadata
       from audit_event
       where organization_id = $1 and workspace_id = $2 and idempotency_key = $3`,
      [fixture.organizationA, fixture.workspaceA, idempotencyKey],
    );
    expect(audit.rows).toHaveLength(1);
    expect(audit.rows[0]).toMatchObject({
      action: "business_brain.fact_review_recorded",
      evidence_state: "verified",
      safe_metadata: {
        profileApplicationStatus: "not_applied",
        createdFactVersion: true,
      },
    });
  });

  it("supersedes approved facts and records rejection without applying profile state", async () => {
    const firstCandidate = await persistCandidate({ fieldKey: "offer.trialPolicy" });
    const first = await executeFactReview(
      factContextA(),
      {
        candidateId: firstCandidate.candidateId,
        expectedCurrentFactVersion: 0,
        expectedDecisionVersion: 0,
        action: "verify",
        decisionId: `decision-${randomUUID()}`,
        factVersionId: `fact-version-${randomUUID()}`,
        idempotencyKey: `fact-review:${randomUUID()}`,
      },
      { repository },
    );
    expect(first.kind).toBe("approved");
    if (first.kind !== "approved") return;

    const conflictingCandidate = await persistCandidate({
      fieldKey: "offer.trialPolicy",
      value: "First trial is free",
      conflict: {
        kind: "source_disagreement",
        detail: "The current approved policy records a paid introductory class.",
      },
    });
    const resolved = await executeFactReview(
      factContextA(),
      {
        candidateId: conflictingCandidate.candidateId,
        expectedCurrentFactVersion: 1,
        expectedDecisionVersion: 0,
        action: "resolve_conflict",
        reviewedValue: "Introductory class is ₹299",
        reasonCode: "OWNER_CONFIRMED_CURRENT_POLICY",
        decisionId: `decision-${randomUUID()}`,
        factVersionId: `fact-version-${randomUUID()}`,
        idempotencyKey: `fact-review:${randomUUID()}`,
      },
      { repository },
    );
    expect(resolved.kind).toBe("approved");
    if (resolved.kind !== "approved") return;
    expect(resolved.factVersion).toMatchObject({
      version: 2,
      supersedesFactVersionId: first.factVersion.factVersionId,
      conflictResolution: {
        kind: "source_disagreement",
        reasonCode: "OWNER_CONFIRMED_CURRENT_POLICY",
      },
    });

    const rejectedCandidate = await persistCandidate({
      fieldKey: "offer.trialPolicy",
      value: "Outdated trial label",
    });
    const rejected = await executeFactReview(
      factContextA(),
      {
        candidateId: rejectedCandidate.candidateId,
        expectedCurrentFactVersion: 2,
        expectedDecisionVersion: 0,
        action: "reject",
        reasonCode: "STALE_SOURCE_LABEL",
        decisionId: `decision-${randomUUID()}`,
        idempotencyKey: `fact-review:${randomUUID()}`,
      },
      { repository },
    );
    expect(rejected).toMatchObject({
      kind: "rejected",
      currentFactVersionId: resolved.factVersion.factVersionId,
      decision: { profileApplicationStatus: "not_applied" },
    });
    const current = await repository.findCurrentFact(
      repositoryContextA(),
      fixture.profileA,
      "offer.trialPolicy",
    );
    expect(current?.factVersionId).toBe(resolved.factVersion.factVersionId);
  });

  it("fails closed across tenants and serializes concurrent field approvals", async () => {
    const tenantCandidate = await persistCandidate({ fieldKey: "business.summary" });
    await expect(
      executeFactReview(
        factContextB(),
        {
          candidateId: tenantCandidate.candidateId,
          expectedCurrentFactVersion: 0,
          expectedDecisionVersion: 0,
          action: "verify",
          decisionId: `decision-${randomUUID()}`,
          factVersionId: `fact-version-${randomUUID()}`,
          idempotencyKey: `fact-review:${randomUUID()}`,
        },
        { repository },
      ),
    ).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof FactReviewAccessError && error.code === "FACT_REVIEW_CANDIDATE_NOT_FOUND",
    );

    const left = await persistCandidate({ fieldKey: "audience.primary" });
    const right = await persistCandidate({ fieldKey: "audience.primary" });
    const results = await Promise.allSettled(
      [left, right].map((candidate) =>
        executeFactReview(
          factContextA(),
          {
            candidateId: candidate.candidateId,
            expectedCurrentFactVersion: 0,
            expectedDecisionVersion: 0,
            action: "verify",
            decisionId: `decision-${randomUUID()}`,
            factVersionId: `fact-version-${randomUUID()}`,
            idempotencyKey: `fact-review:${randomUUID()}`,
          },
          { repository },
        ),
      ),
    );
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toSatisfy((error: unknown) => {
      if (!(error instanceof Error) || !("code" in error)) return false;
      const code = (error as { code: unknown }).code;
      return (
        (error.name === "FactReviewError" && code === "FACT_REVIEW_STALE_VERSION") ||
        (error.name === "FactReviewPersistenceError" && code === "version_conflict")
      );
    });
  });

  it("expires time-sensitive facts and atomically revalidates them with audit evidence", async () => {
    const candidate = await persistCandidate({ fieldKey: "offer.price", value: "INR 499" });
    const reviewedAt = new Date(Date.now() + 5 * 60_000);
    const reverifiedAt = new Date(reviewedAt.getTime() + 31 * 24 * 60 * 60 * 1_000);
    const approved = await executeFactReview(
      factContextA(),
      {
        candidateId: candidate.candidateId,
        expectedCurrentFactVersion: 0,
        expectedDecisionVersion: 0,
        action: "verify",
        decisionId: "decision-" + randomUUID(),
        factVersionId: "fact-version-" + randomUUID(),
        idempotencyKey: "fact-review:" + randomUUID(),
      },
      { repository, now: () => reviewedAt },
    );
    expect(approved.kind).toBe("approved");
    if (approved.kind !== "approved") return;

    const queueContext = { ...factContextA(), requestId: randomUUID() };
    const queue = await queryFactReverificationQueue(
      queueContext,
      { profileId: fixture.profileA },
      { repository: approvedContextRepository, now: () => reverifiedAt },
    );
    const expired = queue.items.find(
      (item) => item.factVersionId === approved.factVersion.factVersionId,
    );
    expect(expired).toMatchObject({ status: "expired", canReverify: true });

    const command = {
      profileId: fixture.profileA,
      factVersionId: approved.factVersion.factVersionId,
      expectedVersion: 1,
      newFactVersionId: "fact-version-" + randomUUID(),
      idempotencyKey: "fact-reverification:" + approved.factVersion.factVersionId + ":1",
    };
    const result = await executeFactReverification(queueContext, command, {
      readRepository: approvedContextRepository,
      writeRepository: reverificationRepository,
      now: () => reverifiedAt,
    });
    const replay = await executeFactReverification(queueContext, command, {
      readRepository: approvedContextRepository,
      writeRepository: reverificationRepository,
      now: () => new Date(reverifiedAt.getTime() + 1_000),
    });

    expect(replay).toEqual(result);
    expect(result).toMatchObject({
      version: 2,
      supersedesFactVersionId: approved.factVersion.factVersionId,
      reasonCode: "OWNER_REVERIFIED_UNCHANGED",
    });
    const persisted = await database.pool.query(
      `select version, value, reason_code, expires_at
       from approved_fact_version
       where organization_id = $1 and workspace_id = $2 and profile_id = $3 and field_key = 'offer.price'
       order by version`,
      [fixture.organizationA, fixture.workspaceA, fixture.profileA],
    );
    expect(persisted.rows).toHaveLength(2);
    expect(persisted.rows[0]?.expires_at.toISOString()).toBe(
      new Date(reviewedAt.getTime() + 30 * 24 * 60 * 60 * 1_000).toISOString(),
    );
    expect(persisted.rows[1]).toMatchObject({
      version: 2,
      value: "INR 499",
      reason_code: "OWNER_REVERIFIED_UNCHANGED",
    });
    expect(persisted.rows[1]?.expires_at.toISOString()).toBe(result.expiresAt);

    const audit = await database.pool.query(
      `select action, actor_id, policy_result, evidence_state, safe_metadata
       from audit_event
       where organization_id = $1 and workspace_id = $2 and idempotency_key = $3`,
      [fixture.organizationA, fixture.workspaceA, command.idempotencyKey],
    );
    expect(audit.rows).toHaveLength(1);
    expect(audit.rows[0]).toMatchObject({
      action: "business_brain.fact_reverified",
      actor_id: fixture.actorA,
      policy_result: "allow",
      evidence_state: "verified",
    });
    expect(audit.rows[0]?.safe_metadata).not.toHaveProperty("value");
  });

  it("forces tenant RLS, least privilege, and append-only fact history", async () => {
    const candidate = await persistCandidate({ fieldKey: "booking.routeLabel" });
    const approved = await executeFactReview(
      factContextA(),
      {
        candidateId: candidate.candidateId,
        expectedCurrentFactVersion: 0,
        expectedDecisionVersion: 0,
        action: "verify",
        decisionId: `decision-${randomUUID()}`,
        factVersionId: `fact-version-${randomUUID()}`,
        idempotencyKey: `fact-review:${randomUUID()}`,
      },
      { repository },
    );
    expect(approved.kind).toBe("approved");
    if (approved.kind !== "approved") return;

    await withAppRole(factContextB().tenant, async (client) => {
      const hidden = await client.query(
        "select fact_version_id from approved_fact_version where fact_version_id = $1",
        [approved.factVersion.factVersionId],
      );
      expect(hidden.rows).toHaveLength(0);
    });
    await withAppRole(factContextA().tenant, async (client) => {
      await expect(
        client.query(
          "update approved_fact_version set reason_code = 'ALTERED' where fact_version_id = $1",
          [approved.factVersion.factVersionId],
        ),
      ).rejects.toMatchObject({ code: "42501" });
    });
    await expect(
      database.pool.query(
        "update approved_fact_version set reason_code = 'ALTERED' where fact_version_id = $1",
        [approved.factVersion.factVersionId],
      ),
    ).rejects.toMatchObject({ code: "55000" });
    await expect(
      database.pool.query("delete from fact_review_decision where approved_fact_version_id = $1", [
        approved.factVersion.factVersionId,
      ]),
    ).rejects.toMatchObject({ code: "55000" });

    const controls = await database.pool.query(
      `select c.relname, c.relforcerowsecurity,
              has_table_privilege('novussync_app', c.oid, 'SELECT') as can_select,
              has_table_privilege('novussync_app', c.oid, 'INSERT') as can_insert,
              has_table_privilege('novussync_app', c.oid, 'UPDATE') as can_update,
              has_table_privilege('novussync_app', c.oid, 'DELETE') as can_delete
       from pg_class c
       where c.relname in ('approved_fact_version', 'fact_review_decision')
       order by c.relname`,
    );
    expect(controls.rows).toEqual([
      {
        relname: "approved_fact_version",
        relforcerowsecurity: true,
        can_select: true,
        can_insert: true,
        can_update: false,
        can_delete: false,
      },
      {
        relname: "fact_review_decision",
        relforcerowsecurity: true,
        can_select: true,
        can_insert: true,
        can_update: false,
        can_delete: false,
      },
    ]);
  });
});

async function persistCandidate(input: {
  fieldKey: string;
  value?: string;
  conflict?: { kind: FactConflictKind; detail: string | null };
}) {
  const approvedAt = new Date(Date.now() - 120_000).toISOString();
  const capturedAt = new Date(Date.now() - 60_000).toISOString();
  const source = approveBusinessWebsiteSource({
    sourceId: `source-${randomUUID()}`,
    tenantId: fixture.workspaceA,
    entryUrl: `https://studio.example.com/${randomUUID()}`,
    approval: {
      actorId: fixture.actorA,
      actorRole: "owner",
      approvedAt,
    },
  });
  const capture = createSourceCapture({
    source,
    captureId: `capture-${randomUUID()}`,
    sourceLocation: source.entryUrl,
    sourceReference: "owner-approved-test-source",
    capturedAt,
    extractor: { id: "approved-html", version: "1.0.0" },
    contentDigest: `sha256:${randomUUID()}`,
    contentBytes: 1_024,
  });
  const candidate = createFactCandidate({
    candidateId: `candidate-${randomUUID()}`,
    profileId: fixture.profileA,
    source,
    capture,
    fieldKey: input.fieldKey,
    factTemplateVersion: "fact-review@1",
    playbookVersion: "integration-profile@1",
    value: input.value ?? `Synthetic value ${randomUUID()}`,
    allowedUseCases: ["profile_review"],
    confidence: 0.9,
    conflict: input.conflict ?? { kind: "none", detail: null },
    createdAt: capturedAt,
  });
  const batch = createSourceProposalBatch({
    batchId: `batch-${randomUUID()}`,
    profileId: fixture.profileA,
    source,
    capture,
    candidates: [candidate],
    createdAt: capturedAt,
  });
  await sourceRepository.persistBatch(sourceContextA(), batch, `proposal:persist:${randomUUID()}`);
  return candidate;
}

async function seedTenantsAndProfiles(): Promise<void> {
  await database.pool.query(
    `insert into organization (id, slug, name)
     values ($1, $2, 'Fact Tenant A'), ($3, $4, 'Fact Tenant B')`,
    [
      fixture.organizationA,
      `fact-${fixture.organizationA}`,
      fixture.organizationB,
      `fact-${fixture.organizationB}`,
    ],
  );
  await database.pool.query(
    `insert into workspace (id, organization_id, slug, name)
     values ($1, $2, 'fact-a', 'Fact Workspace A'),
            ($3, $4, 'fact-b', 'Fact Workspace B')`,
    [fixture.workspaceA, fixture.organizationA, fixture.workspaceB, fixture.organizationB],
  );
  await database.pool.query(
    `insert into app_actor (id, actor_type, identity_provider, provider_subject)
     values ($1, 'human', 'synthetic', $2), ($3, 'human', 'synthetic', $4)`,
    [fixture.actorA, `fact-a-${fixture.actorA}`, fixture.actorB, `fact-b-${fixture.actorB}`],
  );
  await database.pool.query(
    `insert into business_profile_draft
       (organization_id, workspace_id, profile_id, playbook_id, playbook_version, values, version, created_at, updated_at)
     values ($1, $2, $3, 'integration-profile', 1, '{}'::jsonb, 1, now(), now()),
            ($4, $5, $6, 'integration-profile', 1, '{}'::jsonb, 1, now(), now())`,
    [
      fixture.organizationA,
      fixture.workspaceA,
      fixture.profileA,
      fixture.organizationB,
      fixture.workspaceB,
      fixture.profileB,
    ],
  );
}

async function withAppRole(
  tenant: { organizationId: string; workspaceId: string },
  operation: (client: PoolClient) => Promise<void>,
): Promise<void> {
  const client = await database.pool.connect();
  try {
    await client.query("begin");
    await client.query("set local role novussync_app");
    await client.query(
      "select set_config('app.organization_id', $1, true), set_config('app.workspace_id', $2, true)",
      [tenant.organizationId, tenant.workspaceId],
    );
    await operation(client);
  } finally {
    await client.query("rollback").catch(() => undefined);
    client.release();
  }
}

function factContextA(): FactReviewCommandContext {
  return {
    tenant: {
      organizationId: fixture.organizationA,
      workspaceId: fixture.workspaceA,
    },
    actor: {
      id: fixture.actorA,
      actorType: "human",
      role: "owner",
      accessKind: "membership",
    },
    sessionExpiresAt: "2099-07-19T17:00:00.000Z",
    requestId: randomUUID(),
  };
}

function factContextB(): FactReviewCommandContext {
  return {
    tenant: {
      organizationId: fixture.organizationB,
      workspaceId: fixture.workspaceB,
    },
    actor: {
      id: fixture.actorB,
      actorType: "human",
      role: "owner",
      accessKind: "membership",
    },
    sessionExpiresAt: "2099-07-19T17:00:00.000Z",
    requestId: randomUUID(),
  };
}

function repositoryContextA() {
  return {
    tenant: factContextA().tenant,
    actorId: fixture.actorA,
  };
}

function sourceContextA(): SourceProposalPersistenceContext {
  return {
    tenant: {
      organizationId: fixture.organizationA,
      workspaceId: fixture.workspaceA,
    },
    actor: { id: fixture.actorA, actorType: "human", role: "owner" },
    correlationId: randomUUID(),
    session: { expiresAt: "2099-07-19T17:00:00.000Z" },
  };
}
