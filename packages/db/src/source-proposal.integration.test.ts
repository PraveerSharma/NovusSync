import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { SourceProposalPersistenceContext } from "@novussync/application";
import {
  approveBusinessWebsiteSource,
  createFactCandidate,
  createFactCandidateReviewDecision,
  createSourceCapture,
  createSourceProposalBatch,
} from "@novussync/domain";

import { createDatabase, type DatabaseHandle } from "./client.js";
import {
  createSourceProposalRepository,
  type SourceProposalRepository,
} from "./source-proposal-repository.js";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "TEST_DATABASE_URL is required. Source proposal integration tests must use an isolated synthetic database.",
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
let repository: SourceProposalRepository;

describe("tenant-scoped source proposal persistence", () => {
  beforeAll(async () => {
    database = createDatabase({
      connectionString,
      applicationName: "novussync-source-proposal-integration",
      maxConnections: 4,
    });
    repository = createSourceProposalRepository(database.db);
    await seedTenantsAndProfiles();
  });

  afterAll(async () => database.close());

  it("persists and rehydrates an idempotent proposal graph with provenance", async () => {
    const batch = batchFixture();
    const idempotencyKey = `proposal:persist:${randomUUID()}`;

    const persisted = await repository.persistBatch(contextA(), batch, idempotencyKey);
    const replayed = await repository.persistBatch(contextA(), batch, idempotencyKey);
    const loaded = await repository.findBatch(contextA(), batch.batchId);

    expect(persisted).toMatchObject({ batchId: batch.batchId });
    expect(replayed).toMatchObject({ batchId: batch.batchId });
    expect(loaded).toMatchObject({
      batchId: batch.batchId,
      status: "requires_owner_review",
      candidates: [
        {
          authority: "provisional",
          verificationStatus: "unverified",
          provenance: {
            sourceLocation: batch.capture.sourceLocation,
            extractor: batch.capture.extractor,
          },
        },
      ],
    });
    await expect(repository.findBatch(contextB(), batch.batchId)).resolves.toBeNull();
  });

  it("records append-only optimistic owner decision history without applying facts", async () => {
    const batch = batchFixture();
    await repository.persistBatch(contextA(), batch, `proposal:persist:${randomUUID()}`);
    const candidate = batch.candidates[0];
    expect(candidate).toBeDefined();
    if (!candidate) return;

    const first = createFactCandidateReviewDecision({
      decisionId: `decision-${randomUUID()}`,
      candidate,
      decisionVersion: 1,
      outcome: "needs_changes",
      reasonCode: "SOURCE_LABEL_NEEDS_REVIEW",
      decidedByActorId: fixture.actorA,
      decidedByRole: "owner",
      decidedAt: new Date(Date.parse(batch.createdAt) + 1_000).toISOString(),
    });
    const firstKey = `proposal:decision:${randomUUID()}`;
    await repository.recordDecision(contextA(), candidate, first, 0, firstKey);
    const replayed = await repository.recordDecision(contextA(), candidate, first, 0, firstKey);
    expect(replayed).toMatchObject({
      decisionVersion: 1,
      applicationStatus: "not_applied",
    });

    const second = createFactCandidateReviewDecision({
      decisionId: `decision-${randomUUID()}`,
      candidate,
      decisionVersion: 2,
      outcome: "approved_for_profile_draft",
      reasonCode: "OWNER_CONFIRMED_SOURCE",
      decidedByActorId: fixture.actorA,
      decidedByRole: "owner",
      decidedAt: new Date(Date.parse(batch.createdAt) + 2_000).toISOString(),
    });
    await repository.recordDecision(
      contextA(),
      candidate,
      second,
      1,
      `proposal:decision:${randomUUID()}`,
    );

    const history = await repository.listDecisions(contextA(), candidate);
    expect(history.map(({ decisionVersion, outcome }) => ({ decisionVersion, outcome }))).toEqual([
      { decisionVersion: 1, outcome: "needs_changes" },
      { decisionVersion: 2, outcome: "approved_for_profile_draft" },
    ]);
    expect(history.every(({ applicationStatus }) => applicationStatus === "not_applied")).toBe(
      true,
    );
    await expect(
      repository.recordDecision(
        contextA(),
        candidate,
        createFactCandidateReviewDecision({
          decisionId: `decision-${randomUUID()}`,
          candidate,
          decisionVersion: 2,
          outcome: "rejected",
          reasonCode: "OWNER_REJECTED_SOURCE",
          decidedByActorId: fixture.actorA,
          decidedByRole: "owner",
          decidedAt: new Date(Date.parse(batch.createdAt) + 3_000).toISOString(),
        }),
        1,
        `proposal:decision:${randomUUID()}`,
      ),
    ).rejects.toMatchObject({ code: "version_conflict" });
  });

  it("enforces RLS grants and immutable proposal records", async () => {
    const batch = batchFixture();
    await repository.persistBatch(contextA(), batch, `proposal:persist:${randomUUID()}`);
    const candidate = batch.candidates[0];
    expect(candidate).toBeDefined();
    if (!candidate) return;

    await withAppRole(contextA().tenant, async (client) => {
      await expect(
        client.query(
          "update fact_candidate set conflict_detail = 'changed' where candidate_id = $1",
          [candidate.candidateId],
        ),
      ).rejects.toMatchObject({ code: "42501" });
    });
    await expect(
      database.pool.query(
        "update fact_candidate set conflict_detail = 'changed' where candidate_id = $1",
        [candidate.candidateId],
      ),
    ).rejects.toMatchObject({ code: "55000" });
    await expect(
      database.pool.query("delete from source_proposal_batch where batch_id = $1", [batch.batchId]),
    ).rejects.toMatchObject({ code: "55000" });
  });
});

function batchFixture() {
  const approvedAt = new Date().toISOString();
  const capturedAt = new Date(Date.parse(approvedAt) + 1_000).toISOString();
  const source = approveBusinessWebsiteSource({
    sourceId: `source-${randomUUID()}`,
    tenantId: fixture.workspaceA,
    entryUrl: "https://studio.example.com/about",
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
    sourceReference: "owner-approved-primary-domain",
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
    fieldKey: "business.summary",
    factTemplateVersion: "business-summary@1",
    playbookVersion: "integration-profile@1",
    value: "A synthetic source proposal.",
    allowedUseCases: ["profile_review"],
    confidence: 0.91,
    conflict: { kind: "none", detail: null },
    createdAt: capturedAt,
  });
  return createSourceProposalBatch({
    batchId: `batch-${randomUUID()}`,
    profileId: fixture.profileA,
    source,
    capture,
    candidates: [candidate],
    createdAt: capturedAt,
  });
}

async function seedTenantsAndProfiles(): Promise<void> {
  await database.pool.query(
    `insert into organization (id, slug, name)
     values ($1, $2, 'Proposal Tenant A'), ($3, $4, 'Proposal Tenant B')`,
    [
      fixture.organizationA,
      `proposal-${fixture.organizationA}`,
      fixture.organizationB,
      `proposal-${fixture.organizationB}`,
    ],
  );
  await database.pool.query(
    `insert into workspace (id, organization_id, slug, name)
     values ($1, $2, 'proposal-a', 'Proposal Workspace A'),
            ($3, $4, 'proposal-b', 'Proposal Workspace B')`,
    [fixture.workspaceA, fixture.organizationA, fixture.workspaceB, fixture.organizationB],
  );
  await database.pool.query(
    `insert into app_actor (id, actor_type, identity_provider, provider_subject)
     values ($1, 'human', 'synthetic', $2), ($3, 'human', 'synthetic', $4)`,
    [
      fixture.actorA,
      `proposal-a-${fixture.actorA}`,
      fixture.actorB,
      `proposal-b-${fixture.actorB}`,
    ],
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

function contextA(): SourceProposalPersistenceContext {
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

function contextB(): SourceProposalPersistenceContext {
  return {
    tenant: {
      organizationId: fixture.organizationB,
      workspaceId: fixture.workspaceB,
    },
    actor: { id: fixture.actorB, actorType: "human", role: "owner" },
    correlationId: randomUUID(),
    session: { expiresAt: "2099-07-19T17:00:00.000Z" },
  };
}
