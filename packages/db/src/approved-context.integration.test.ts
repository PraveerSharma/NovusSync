import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  executeFactReview,
  queryApprovedContext,
  type ApprovedContextQueryContext,
  type FactReviewCommandContext,
  type SourceProposalPersistenceContext,
} from "@novussync/application";
import {
  approveBusinessWebsiteSource,
  createFactCandidate,
  createSourceCapture,
  createSourceProposalBatch,
  type ApprovedContextUseCase,
  type ApprovedFactVersion,
} from "@novussync/domain";

import { createApprovedContextRepository } from "./approved-context-repository.js";
import { createDatabase, type DatabaseHandle } from "./client.js";
import { createFactReviewRepository, type FactReviewRepository } from "./fact-review-repository.js";
import { approvedFactVersions } from "./schema.js";
import {
  createSourceProposalRepository,
  type SourceProposalRepository,
} from "./source-proposal-repository.js";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "TEST_DATABASE_URL is required. Approved-context integration tests must use an isolated synthetic database.",
  );
}

const AS_OF = new Date("2099-07-19T10:00:00.000Z");
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
let factRepository: FactReviewRepository;
let sourceRepository: SourceProposalRepository;

describe("tenant-scoped approved-context persistence", () => {
  beforeAll(async () => {
    database = createDatabase({
      connectionString,
      applicationName: "novussync-approved-context-integration",
      maxConnections: 6,
    });
    factRepository = createFactReviewRepository(database.db);
    sourceRepository = createSourceProposalRepository(database.db);
    await seedTenantsAndProfiles();
  });

  afterAll(async () => database.close());

  it("retrieves current governed facts and persists one immutable snapshot idempotently", async () => {
    const businessName = await persistApprovedFact("business.name", "Northstar Yoga Studio");
    const trial = await persistApprovedFact("offer.trialPolicy", "One complimentary trial");
    const booking = await persistApprovedFact(
      "booking.routeLabel",
      "Share the approved external booking link",
    );
    const therapy = await persistApprovedFact("claims.therapy", "Supports injury recovery");

    await insertGovernedVersion(trial, {
      expiresAt: new Date("2098-12-31T23:59:59.000Z"),
    });
    await insertGovernedVersion(booking, {
      allowedUseCases: ["concierge_response"],
      expiresAt: new Date("2099-12-31T23:59:59.000Z"),
    });
    await insertGovernedVersion(therapy, {
      governanceStatus: "disputed",
      governanceReasonCode: "QUALIFIED_REVIEW_REQUIRED",
    });

    const repository = createApprovedContextRepository(database.db);
    const query = {
      tenant: tenantA(),
      profileId: fixture.profileA,
      useCase: "campaign_planning" as const,
      fieldKeys: [
        "business.name",
        "offer.trialPolicy",
        "booking.routeLabel",
        "claims.therapy",
        "audience.primary",
      ],
    };
    const context = approvedContextA("approved-context-request-a");
    const first = await queryApprovedContext(context, query, {
      repository,
      now: () => AS_OF,
    });
    const replayed = await queryApprovedContext(context, query, {
      repository,
      now: () => AS_OF,
    });

    expect(replayed.snapshotId).toBe(first.snapshotId);
    expect(first.items.map((item) => item.status)).toEqual([
      "usable",
      "unavailable",
      "unavailable",
      "unavailable",
      "unavailable",
    ]);
    expect(first.items[0]).toMatchObject({
      status: "usable",
      citation: { factVersionId: businessName.factVersionId, version: 1 },
    });
    expect(unavailableCode(first.items[1])).toBe("APPROVED_CONTEXT_EXPIRED");
    expect(unavailableCode(first.items[2])).toBe("APPROVED_CONTEXT_RESTRICTED");
    expect(unavailableCode(first.items[3])).toBe("APPROVED_CONTEXT_DISPUTED");
    expect(unavailableCode(first.items[4])).toBe("APPROVED_CONTEXT_MISSING");

    const stored = await database.pool.query(
      `select snapshot_id, schema_version, use_case, items
       from verified_context_snapshot
       where organization_id = $1 and workspace_id = $2 and snapshot_id = $3`,
      [fixture.organizationA, fixture.workspaceA, first.snapshotId],
    );
    expect(stored.rows).toHaveLength(1);
    expect(stored.rows[0]).toMatchObject({
      snapshot_id: first.snapshotId,
      schema_version: 1,
      use_case: "campaign_planning",
      items: first.items,
    });

    const audit = await database.pool.query(
      `select safe_metadata
       from audit_event
       where organization_id = $1 and workspace_id = $2
         and action = 'business_brain.approved_context_snapshot_created'
         and target_id = $3`,
      [fixture.organizationA, fixture.workspaceA, first.snapshotId],
    );
    expect(audit.rows).toEqual([
      {
        safe_metadata: {
          useCase: "campaign_planning",
          usableCount: 1,
          unavailableCount: 4,
        },
      },
    ]);
    expect(JSON.stringify(audit.rows)).not.toContain("Northstar Yoga Studio");
  });

  it("changes the packet by use case without exposing another tenant", async () => {
    const repository = createApprovedContextRepository(database.db);
    const concierge = await queryApprovedContext(
      approvedContextA("approved-context-request-concierge"),
      {
        tenant: tenantA(),
        profileId: fixture.profileA,
        useCase: "concierge_response",
        fieldKeys: ["booking.routeLabel"],
      },
      { repository, now: () => AS_OF },
    );
    expect(concierge.items[0]).toMatchObject({
      status: "usable",
      value: "Share the approved external booking link",
      citation: { version: 2 },
    });

    const crossTenant = await queryApprovedContext(
      approvedContextB("approved-context-request-b"),
      {
        tenant: tenantB(),
        profileId: fixture.profileA,
        useCase: "concierge_response",
        fieldKeys: ["booking.routeLabel"],
      },
      { repository, now: () => AS_OF },
    );
    expect(unavailableCode(crossTenant.items[0])).toBe("APPROVED_CONTEXT_MISSING");

    await withAppRole(tenantB(), async (client) => {
      const hidden = await client.query(
        "select snapshot_id from verified_context_snapshot where snapshot_id = $1",
        [concierge.snapshotId],
      );
      expect(hidden.rows).toHaveLength(0);
    });
  });

  it("forces RLS, least privilege, and append-only snapshot history", async () => {
    const repository = createApprovedContextRepository(database.db);
    const snapshot = await queryApprovedContext(
      approvedContextA("approved-context-controls"),
      {
        tenant: tenantA(),
        profileId: fixture.profileA,
        useCase: "campaign_planning",
        fieldKeys: ["business.name"],
      },
      { repository, now: () => AS_OF },
    );

    await withAppRole(tenantA(), async (client) => {
      await expect(
        client.query(
          "update verified_context_snapshot set request_id = 'altered' where snapshot_id = $1",
          [snapshot.snapshotId],
        ),
      ).rejects.toMatchObject({ code: "42501" });
    });
    await expect(
      database.pool.query("delete from verified_context_snapshot where snapshot_id = $1", [
        snapshot.snapshotId,
      ]),
    ).rejects.toMatchObject({ code: "55000" });

    const controls = await database.pool.query(
      `select c.relforcerowsecurity,
              has_table_privilege('novussync_app', c.oid, 'SELECT') as can_select,
              has_table_privilege('novussync_app', c.oid, 'INSERT') as can_insert,
              has_table_privilege('novussync_app', c.oid, 'UPDATE') as can_update,
              has_table_privilege('novussync_app', c.oid, 'DELETE') as can_delete
       from pg_class c
       where c.relname = 'verified_context_snapshot'`,
    );
    expect(controls.rows).toEqual([
      {
        relforcerowsecurity: true,
        can_select: true,
        can_insert: true,
        can_update: false,
        can_delete: false,
      },
    ]);
  });
});

async function persistApprovedFact(fieldKey: string, value: string): Promise<ApprovedFactVersion> {
  const approvedAt = new Date(Date.now() - 120_000).toISOString();
  const capturedAt = new Date(Date.now() - 60_000).toISOString();
  const source = approveBusinessWebsiteSource({
    sourceId: `source-${randomUUID()}`,
    tenantId: fixture.workspaceA,
    entryUrl: `https://studio.example.com/${randomUUID()}`,
    approval: { actorId: fixture.actorA, actorRole: "owner", approvedAt },
  });
  const capture = createSourceCapture({
    source,
    captureId: `capture-${randomUUID()}`,
    sourceLocation: source.entryUrl,
    sourceReference: "owner-approved-context-source",
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
    fieldKey,
    factTemplateVersion: "approved-context@1",
    playbookVersion: "integration-profile@1",
    value,
    allowedUseCases: ["profile_review"],
    confidence: 0.95,
    conflict: { kind: "none", detail: null },
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
  await sourceRepository.persistBatch(sourceContextA(), batch, `proposal:${randomUUID()}`);
  const result = await executeFactReview(
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
    { repository: factRepository },
  );
  if (result.kind !== "approved") throw new Error("Synthetic fact approval failed.");
  return result.factVersion;
}

async function insertGovernedVersion(
  current: ApprovedFactVersion,
  governance: {
    governanceStatus?: "available" | "restricted" | "disputed";
    allowedUseCases?: ApprovedContextUseCase[];
    expiresAt?: Date | null;
    governanceReasonCode?: string | null;
  },
): Promise<void> {
  await database.db.insert(approvedFactVersions).values({
    organizationId: fixture.organizationA,
    workspaceId: fixture.workspaceA,
    factVersionId: `fact-version-${randomUUID()}`,
    profileId: current.profileId,
    fieldKey: current.fieldKey,
    version: current.version + 1,
    value: current.value,
    state: "approved",
    sourceCandidateId: current.sourceCandidateId,
    sourceId: current.source.sourceId,
    captureId: current.source.captureId,
    sourceLocation: current.source.sourceLocation,
    sourceReference: current.source.sourceReference,
    sourceCapturedAt: new Date(current.source.capturedAt),
    extractorId: current.source.extractorId,
    extractorVersion: current.source.extractorVersion,
    reviewAction: "correct_and_verify",
    reasonCode: "OWNER_RECONFIRMED_CONTEXT",
    supersedesFactVersionId: current.factVersionId,
    conflictKind: null,
    conflictReasonCode: null,
    verifiedByActorId: fixture.actorA,
    verifiedByRole: "owner",
    verifiedAt: new Date(current.verifiedAt),
    governanceStatus: governance.governanceStatus ?? "available",
    allowedUseCases: governance.allowedUseCases ?? ["campaign_planning", "concierge_response"],
    expiresAt: governance.expiresAt ?? null,
    governanceReasonCode: governance.governanceReasonCode ?? null,
  });
}

function unavailableCode(item: { readonly status: string }): string | null {
  return item.status === "unavailable" && "reason" in item
    ? String((item as { reason: { code: string } }).reason.code)
    : null;
}

async function seedTenantsAndProfiles(): Promise<void> {
  await database.pool.query(
    `insert into organization (id, slug, name)
     values ($1, $2, 'Context Tenant A'), ($3, $4, 'Context Tenant B')`,
    [
      fixture.organizationA,
      `context-${fixture.organizationA}`,
      fixture.organizationB,
      `context-${fixture.organizationB}`,
    ],
  );
  await database.pool.query(
    `insert into workspace (id, organization_id, slug, name)
     values ($1, $2, 'context-a', 'Context Workspace A'),
            ($3, $4, 'context-b', 'Context Workspace B')`,
    [fixture.workspaceA, fixture.organizationA, fixture.workspaceB, fixture.organizationB],
  );
  await database.pool.query(
    `insert into app_actor (id, actor_type, identity_provider, provider_subject)
     values ($1, 'human', 'synthetic', $2), ($3, 'human', 'synthetic', $4)`,
    [fixture.actorA, `context-a-${fixture.actorA}`, fixture.actorB, `context-b-${fixture.actorB}`],
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

function tenantA() {
  return { organizationId: fixture.organizationA, workspaceId: fixture.workspaceA };
}

function tenantB() {
  return { organizationId: fixture.organizationB, workspaceId: fixture.workspaceB };
}

function factContextA(): FactReviewCommandContext {
  return {
    tenant: tenantA(),
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

function approvedContextA(requestId: string): ApprovedContextQueryContext {
  return { ...factContextA(), requestId };
}

function approvedContextB(requestId: string): ApprovedContextQueryContext {
  return {
    tenant: tenantB(),
    actor: {
      id: fixture.actorB,
      actorType: "human",
      role: "owner",
      accessKind: "membership",
    },
    sessionExpiresAt: "2099-07-19T17:00:00.000Z",
    requestId,
  };
}

function sourceContextA(): SourceProposalPersistenceContext {
  return {
    tenant: tenantA(),
    actor: { id: fixture.actorA, actorType: "human", role: "owner" },
    correlationId: randomUUID(),
    session: { expiresAt: "2099-07-19T17:00:00.000Z" },
  };
}
