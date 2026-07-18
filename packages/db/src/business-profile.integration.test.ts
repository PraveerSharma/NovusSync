import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AuthenticatedActorContext } from "@novussync/application";
import {
  BUSINESS_PROFILE_SECTIONS,
  createBusinessProfileDraft,
  reviseBusinessProfileDraft,
  type BusinessProfilePlaybook,
} from "@novussync/domain";

import {
  createBusinessProfileDraftRepository,
  type BusinessProfileDraftRepository,
} from "./business-profile-repository.js";
import { createDatabase, type DatabaseHandle } from "./client.js";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "TEST_DATABASE_URL is required. Business profile integration tests must use an isolated synthetic database.",
  );
}

const fixture = Object.freeze({
  organizationA: randomUUID(),
  workspaceA: randomUUID(),
  actorA: randomUUID(),
  organizationB: randomUUID(),
  workspaceB: randomUUID(),
  actorB: randomUUID(),
});

const playbook: BusinessProfilePlaybook = {
  id: "integration-profile-v1",
  version: 1,
  businessType: "Integration business",
  locale: "en",
  fields: BUSINESS_PROFILE_SECTIONS.map((section) => ({
    key: `${section}_field`,
    section,
    label: `${section} field`,
    description: `${section} information.`,
    kind: "short_text",
    required: true,
    maxLength: 500,
  })),
};

let database: DatabaseHandle;
let repository: BusinessProfileDraftRepository;

describe("tenant-scoped business profile draft persistence", () => {
  beforeAll(async () => {
    database = createDatabase({
      connectionString,
      applicationName: "novussync-business-profile-integration",
      maxConnections: 4,
    });
    repository = createBusinessProfileDraftRepository(database.db);
    await seedTenants();
  });

  afterAll(async () => database.close());

  it("persists idempotent optimistic revisions with append-only versions and audit", async () => {
    const profileId = `profile-${randomUUID()}`;
    const createdAt = new Date().toISOString();
    const createdDraft = createBusinessProfileDraft({
      profileId,
      tenant: tenantA(),
      playbook,
      values: { business_field: "Synthetic studio" },
      now: createdAt,
    });
    const createKey = `profile:create:${randomUUID()}`;

    const created = await repository.create(contextA(), createdDraft, playbook, createKey);
    const replayedCreate = await repository.create(contextA(), createdDraft, playbook, createKey);
    expect(created).toMatchObject({ profileId, version: 1 });
    expect(replayedCreate).toMatchObject({ profileId, version: 1 });

    const revisedDraft = reviseBusinessProfileDraft(createdDraft, {
      expectedVersion: 1,
      playbook,
      changes: { offer_field: "Synthetic trial" },
      now: new Date(Date.parse(createdAt) + 1_000).toISOString(),
    });
    const reviseKey = `profile:revise:${randomUUID()}`;
    const revised = await repository.revise(contextA(), revisedDraft, playbook, 1, reviseKey);
    const replayedRevision = await repository.revise(
      contextA(),
      revisedDraft,
      playbook,
      1,
      reviseKey,
    );
    expect(revised).toMatchObject({ profileId, version: 2 });
    expect(replayedRevision).toMatchObject({ profileId, version: 2 });

    const versions = await repository.listVersions(contextA(), tenantA(), profileId, playbook);
    expect(versions.map(({ version }) => version)).toEqual([1, 2]);

    await withAppRole(tenantA(), async (client) => {
      const audit = await client.query<{ action: string; target_version: number }>(
        `select action, target_version from audit_event
         where target_type = 'business_profile_draft' and target_id = $1
         order by target_version`,
        [profileId],
      );
      expect(audit.rows).toEqual([
        { action: "business_profile.draft_created", target_version: 1 },
        { action: "business_profile.draft_revised", target_version: 2 },
      ]);
    });
  });

  it("fails closed across tenants and on stale revisions", async () => {
    const profileId = `profile-${randomUUID()}`;
    const createdAt = new Date().toISOString();
    const draft = createBusinessProfileDraft({
      profileId,
      tenant: tenantA(),
      playbook,
      now: createdAt,
    });
    await repository.create(contextA(), draft, playbook, `profile:create:${randomUUID()}`);

    await expect(
      repository.findById(contextB(), tenantB(), profileId, playbook),
    ).resolves.toBeNull();
    await expect(
      repository.revise(
        contextA(),
        reviseBusinessProfileDraft(draft, {
          expectedVersion: 1,
          playbook,
          changes: { business_field: "First revision" },
          now: new Date(Date.parse(createdAt) + 2_000).toISOString(),
        }),
        playbook,
        2,
        `profile:revise:${randomUUID()}`,
      ),
    ).rejects.toMatchObject({ code: "version_conflict" });
  });

  it("prevents mutation of recorded profile versions", async () => {
    const profileId = `profile-${randomUUID()}`;
    const draft = createBusinessProfileDraft({
      profileId,
      tenant: tenantA(),
      playbook,
      now: new Date().toISOString(),
    });
    await repository.create(contextA(), draft, playbook, `profile:create:${randomUUID()}`);

    await withAppRole(tenantA(), async (client) => {
      await expect(
        client.query(
          "update business_profile_draft_version set idempotency_key = 'changed' where profile_id = $1",
          [profileId],
        ),
      ).rejects.toMatchObject({ code: "55000" });
    });
  });
});

async function seedTenants(): Promise<void> {
  await database.pool.query(
    `insert into organization (id, slug, name)
     values ($1, $2, 'Profile Tenant A'), ($3, $4, 'Profile Tenant B')`,
    [
      fixture.organizationA,
      `profile-${fixture.organizationA}`,
      fixture.organizationB,
      `profile-${fixture.organizationB}`,
    ],
  );
  await database.pool.query(
    `insert into workspace (id, organization_id, slug, name)
     values ($1, $2, 'profile-a', 'Profile Workspace A'),
            ($3, $4, 'profile-b', 'Profile Workspace B')`,
    [fixture.workspaceA, fixture.organizationA, fixture.workspaceB, fixture.organizationB],
  );
  await database.pool.query(
    `insert into app_actor (id, actor_type, identity_provider, provider_subject)
     values ($1, 'human', 'synthetic', $2), ($3, 'human', 'synthetic', $4)`,
    [fixture.actorA, `profile-a-${fixture.actorA}`, fixture.actorB, `profile-b-${fixture.actorB}`],
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

function contextA() {
  return contextFor(tenantA(), fixture.actorA);
}

function contextB() {
  return contextFor(tenantB(), fixture.actorB);
}

function contextFor(
  tenant: { organizationId: string; workspaceId: string },
  actorId: string,
): AuthenticatedActorContext {
  return {
    tenant,
    actor: { id: actorId, actorType: "human", role: "owner", accessKind: "membership" },
    correlationId: randomUUID(),
    origin: { type: "request", requestId: randomUUID() },
    session: {
      sessionId: randomUUID(),
      assurance: "aal1",
      issuedAt: "2026-07-18T17:00:00.000Z",
      expiresAt: "2026-07-19T17:00:00.000Z",
    },
  };
}
