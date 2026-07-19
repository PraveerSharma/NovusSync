import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDatabase, type DatabaseHandle } from "./client.ts";
import { createWorkspaceDirectoryRepository } from "./workspace-directory-repository.ts";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "TEST_DATABASE_URL is required. Workspace-directory integration tests must use an isolated synthetic database.",
  );
}

const fixture = Object.freeze({
  organizationA: randomUUID(),
  workspaceA: randomUUID(),
  ownerActorA: randomUUID(),
  ownerSubjectA: randomUUID(),
  operatorActorA: randomUUID(),
  operatorSubjectA: randomUUID(),
  revokedActorA: randomUUID(),
  revokedSubjectA: randomUUID(),
  organizationB: randomUUID(),
  workspaceB: randomUUID(),
  ownerActorB: randomUUID(),
  ownerSubjectB: randomUUID(),
  profileA: "northstar-" + randomUUID(),
});

let database: DatabaseHandle;

describe("identity-scoped workspace directory", () => {
  beforeAll(async () => {
    database = createDatabase({
      connectionString,
      applicationName: "novussync-workspace-directory-integration",
      maxConnections: 4,
    });
    await seedFixtures();
  });

  afterAll(async () => {
    try {
      await database.pool.query(
        "delete from business_profile_draft where organization_id = any($1::uuid[])",
        [[fixture.organizationA, fixture.organizationB]],
      );
      await database.pool.query(
        "delete from workspace_membership where organization_id = any($1::uuid[])",
        [[fixture.organizationA, fixture.organizationB]],
      );
      await database.pool.query("delete from workspace where id = any($1::uuid[])", [
        [fixture.workspaceA, fixture.workspaceB],
      ]);
      await database.pool.query("delete from organization where id = any($1::uuid[])", [
        [fixture.organizationA, fixture.organizationB],
      ]);
      await database.pool.query("delete from app_actor where id = any($1::uuid[])", [
        [fixture.ownerActorA, fixture.operatorActorA, fixture.revokedActorA, fixture.ownerActorB],
      ]);
    } finally {
      await database.close();
    }
  });

  it("returns only the active owner's workspace and profile", async () => {
    const repository = createWorkspaceDirectoryRepository(database.db);
    const records = await repository.listAccessibleWorkspaces({
      identityProvider: "supabase",
      providerSubject: fixture.ownerSubjectA,
      assurance: "aal1",
    });

    expect(records).toEqual([
      {
        organizationId: fixture.organizationA,
        organizationName: "Northstar Collective",
        workspaceId: fixture.workspaceA,
        workspaceName: "Bengaluru pilot",
        role: "owner",
        profiles: [
          {
            profileId: fixture.profileA,
            displayName: "Northstar Yoga Studio",
            playbookId: "independent-yoga-studio",
            playbookVersion: 1,
            draftVersion: 2,
            updatedAt: expect.any(String),
            approvedFactCount: 0,
            lastVerifiedAt: null,
          },
        ],
      },
    ]);
  });

  it("does not expose another tenant, revoked membership, or internal operators", async () => {
    const repository = createWorkspaceDirectoryRepository(database.db);

    await expect(
      repository.listAccessibleWorkspaces({
        identityProvider: "supabase",
        providerSubject: fixture.ownerSubjectB,
        assurance: "aal1",
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        organizationId: fixture.organizationB,
        workspaceId: fixture.workspaceB,
        profiles: [],
      }),
    ]);

    await expect(
      repository.listAccessibleWorkspaces({
        identityProvider: "supabase",
        providerSubject: fixture.revokedSubjectA,
        assurance: "aal1",
      }),
    ).resolves.toEqual([]);

    await expect(
      repository.listAccessibleWorkspaces({
        identityProvider: "supabase",
        providerSubject: fixture.operatorSubjectA,
        assurance: "aal2",
      }),
    ).resolves.toEqual([]);
  });

  it("is executable by the least-privileged application role", async () => {
    const client = await database.pool.connect();
    try {
      await client.query("begin");
      await client.query("set local role novussync_app");
      const result = await client.query<{ workspace_id: string }>(
        `select workspace_id
         from app_private.list_workspace_directory('supabase', $1, 'aal1')`,
        [fixture.ownerSubjectA],
      );
      expect(result.rows).toEqual([{ workspace_id: fixture.workspaceA }]);
    } finally {
      await client.query("rollback").catch(() => undefined);
      client.release();
    }
  });
});

async function seedFixtures(): Promise<void> {
  const client = await database.pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into organization (id, slug, name)
       values ($1, $2, 'Northstar Collective'),
              ($3, $4, 'Other Collective')`,
      [
        fixture.organizationA,
        "workspace-directory-a-" + fixture.organizationA,
        fixture.organizationB,
        "workspace-directory-b-" + fixture.organizationB,
      ],
    );
    await client.query(
      `insert into workspace (id, organization_id, slug, name, status)
       values ($1, $2, $3, 'Bengaluru pilot', 'active'),
              ($4, $5, $6, 'Other workspace', 'active')`,
      [
        fixture.workspaceA,
        fixture.organizationA,
        "workspace-directory-a-" + fixture.workspaceA,
        fixture.workspaceB,
        fixture.organizationB,
        "workspace-directory-b-" + fixture.workspaceB,
      ],
    );
    await client.query(
      `insert into app_actor (id, actor_type, identity_provider, provider_subject, status)
       values
         ($1, 'human', 'supabase', $2, 'active'),
         ($3, 'human', 'supabase', $4, 'active'),
         ($5, 'human', 'supabase', $6, 'active'),
         ($7, 'human', 'supabase', $8, 'active')`,
      [
        fixture.ownerActorA,
        fixture.ownerSubjectA,
        fixture.operatorActorA,
        fixture.operatorSubjectA,
        fixture.revokedActorA,
        fixture.revokedSubjectA,
        fixture.ownerActorB,
        fixture.ownerSubjectB,
      ],
    );
    await client.query(
      `insert into workspace_membership (
         organization_id, workspace_id, actor_id, role, status, revoked_at
       ) values
         ($1, $2, $3, 'owner', 'active', null),
         ($1, $2, $4, 'internal_operator', 'active', null),
         ($1, $2, $5, 'staff', 'revoked', now()),
         ($6, $7, $8, 'owner', 'active', null)`,
      [
        fixture.organizationA,
        fixture.workspaceA,
        fixture.ownerActorA,
        fixture.operatorActorA,
        fixture.revokedActorA,
        fixture.organizationB,
        fixture.workspaceB,
        fixture.ownerActorB,
      ],
    );
    await client.query(
      `insert into business_profile_draft (
         organization_id, workspace_id, profile_id, playbook_id, playbook_version,
         values, version, created_at, updated_at
       ) values ($1, $2, $3, 'independent-yoga-studio', 1, $4::jsonb, 2, now(), now())`,
      [
        fixture.organizationA,
        fixture.workspaceA,
        fixture.profileA,
        JSON.stringify({ businessName: "Northstar Yoga Studio" }),
      ],
    );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
