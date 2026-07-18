import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "TEST_DATABASE_URL is required. Identity integration tests must execute against an isolated synthetic test database and may not be skipped.",
  );
}

const fixture = Object.freeze({
  organizationA: "10000000-0000-4000-8000-000000000001",
  workspaceA: "10000000-0000-4000-8000-000000000101",
  organizationB: "10000000-0000-4000-8000-000000000002",
  workspaceB: "10000000-0000-4000-8000-000000000102",
  ownerActor: "10000000-0000-4000-8000-000000000201",
  revokedActor: "10000000-0000-4000-8000-000000000202",
  operatorActor: "10000000-0000-4000-8000-000000000203",
  expiredOperatorActor: "10000000-0000-4000-8000-000000000204",
  disabledActor: "10000000-0000-4000-8000-000000000205",
  activeGrant: "10000000-0000-4000-8000-000000000401",
  expiredGrant: "10000000-0000-4000-8000-000000000402",
  ownerSubject: "10000000-0000-4000-8000-000000000301",
  revokedSubject: "10000000-0000-4000-8000-000000000302",
  operatorSubject: "10000000-0000-4000-8000-000000000303",
  expiredOperatorSubject: "10000000-0000-4000-8000-000000000304",
  disabledSubject: "10000000-0000-4000-8000-000000000305",
});

let pool: pg.Pool;

describe("workspace identity authorization", () => {
  beforeAll(async () => {
    pool = new pg.Pool({ connectionString, application_name: "novussync-identity-integration" });
    await seedIdentityFixtures();
  });

  afterAll(async () => {
    try {
      await pool.query("delete from support_grant where id = any($1::uuid[])", [
        [fixture.activeGrant, fixture.expiredGrant],
      ]);
      await pool.query("delete from workspace_membership where organization_id = $1", [
        fixture.organizationA,
      ]);
      await pool.query("delete from workspace where id = any($1::uuid[])", [
        [fixture.workspaceA, fixture.workspaceB],
      ]);
      await pool.query("delete from organization where id = any($1::uuid[])", [
        [fixture.organizationA, fixture.organizationB],
      ]);
      await pool.query("delete from app_actor where id = any($1::uuid[])", [
        [
          fixture.ownerActor,
          fixture.revokedActor,
          fixture.operatorActor,
          fixture.expiredOperatorActor,
          fixture.disabledActor,
        ],
      ]);
    } finally {
      await pool.end();
    }
  });

  it("resolves an active owner membership", async () => {
    const rows = await resolveAccess(
      fixture.ownerSubject,
      fixture.organizationA,
      fixture.workspaceA,
      "aal1",
    );
    expect(rows).toEqual([
      {
        actor_id: fixture.ownerActor,
        role: "owner",
        access_kind: "membership",
        support_grant_id: null,
      },
    ]);
  });

  it("denies a valid owner subject in another workspace", async () => {
    const rows = await resolveAccess(
      fixture.ownerSubject,
      fixture.organizationB,
      fixture.workspaceB,
      "aal1",
    );
    expect(rows).toEqual([]);
  });

  it("denies revoked membership and disabled actor records", async () => {
    expect(
      await resolveAccess(
        fixture.revokedSubject,
        fixture.organizationA,
        fixture.workspaceA,
        "aal1",
      ),
    ).toEqual([]);
    expect(
      await resolveAccess(
        fixture.disabledSubject,
        fixture.organizationA,
        fixture.workspaceA,
        "aal1",
      ),
    ).toEqual([]);
  });

  it("requires aal2 for an internal operator", async () => {
    expect(
      await resolveAccess(
        fixture.operatorSubject,
        fixture.organizationA,
        fixture.workspaceA,
        "aal1",
      ),
    ).toEqual([]);
    expect(
      await resolveAccess(
        fixture.operatorSubject,
        fixture.organizationA,
        fixture.workspaceA,
        "aal2",
      ),
    ).toEqual([
      {
        actor_id: fixture.operatorActor,
        role: "internal_operator",
        access_kind: "support_grant",
        support_grant_id: fixture.activeGrant,
      },
    ]);
  });

  it("denies an operator after the support grant expires", async () => {
    const rows = await resolveAccess(
      fixture.expiredOperatorSubject,
      fixture.organizationA,
      fixture.workspaceA,
      "aal2",
    );
    expect(rows).toEqual([]);
  });
});

async function resolveAccess(
  subject: string,
  organizationId: string,
  workspaceId: string,
  assurance: "aal1" | "aal2",
) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("set local role novussync_app");
    const result = await client.query<{
      actor_id: string;
      role: string;
      access_kind: string;
      support_grant_id: string | null;
    }>(
      `select actor_id, role, access_kind, support_grant_id
       from app_private.resolve_workspace_access($1, $2, $3, $4, $5)`,
      ["supabase", subject, organizationId, workspaceId, assurance],
    );
    return result.rows;
  } finally {
    await client.query("rollback").catch(() => undefined);
    client.release();
  }
}

async function seedIdentityFixtures(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into organization (id, slug, name)
       values ($1, 'identity-tenant-a', 'Identity Tenant A'),
              ($2, 'identity-tenant-b', 'Identity Tenant B')
       on conflict (id) do update set slug = excluded.slug, name = excluded.name`,
      [fixture.organizationA, fixture.organizationB],
    );
    await client.query(
      `insert into workspace (id, organization_id, slug, name, status)
       values ($1, $2, 'identity-workspace-a', 'Identity Workspace A', 'active'),
              ($3, $4, 'identity-workspace-b', 'Identity Workspace B', 'active')
       on conflict (id) do update
       set organization_id = excluded.organization_id, slug = excluded.slug,
           name = excluded.name, status = excluded.status`,
      [fixture.workspaceA, fixture.organizationA, fixture.workspaceB, fixture.organizationB],
    );
    await client.query(
      `insert into app_actor (id, actor_type, identity_provider, provider_subject, status)
       values
         ($1, 'human', 'supabase', $2, 'active'),
         ($3, 'human', 'supabase', $4, 'active'),
         ($5, 'human', 'supabase', $6, 'active'),
         ($7, 'human', 'supabase', $8, 'active'),
         ($9, 'human', 'supabase', $10, 'disabled')
       on conflict (id) do update
       set identity_provider = excluded.identity_provider,
           provider_subject = excluded.provider_subject,
           status = excluded.status`,
      [
        fixture.ownerActor,
        fixture.ownerSubject,
        fixture.revokedActor,
        fixture.revokedSubject,
        fixture.operatorActor,
        fixture.operatorSubject,
        fixture.expiredOperatorActor,
        fixture.expiredOperatorSubject,
        fixture.disabledActor,
        fixture.disabledSubject,
      ],
    );
    await client.query(
      `insert into workspace_membership (
         organization_id, workspace_id, actor_id, role, status, revoked_at
       ) values
         ($1, $2, $3, 'owner', 'active', null),
         ($1, $2, $4, 'owner', 'revoked', now()),
         ($1, $2, $5, 'internal_operator', 'active', null),
         ($1, $2, $6, 'internal_operator', 'active', null),
         ($1, $2, $7, 'owner', 'active', null)
       on conflict (organization_id, workspace_id, actor_id) do update
       set role = excluded.role, status = excluded.status, revoked_at = excluded.revoked_at`,
      [
        fixture.organizationA,
        fixture.workspaceA,
        fixture.ownerActor,
        fixture.revokedActor,
        fixture.operatorActor,
        fixture.expiredOperatorActor,
        fixture.disabledActor,
      ],
    );
    await client.query(
      `insert into support_grant (
         id, organization_id, workspace_id, actor_id, granted_by_actor_id,
         purpose, starts_at, expires_at
       ) values
         ($1, $2, $3, $4, $5, 'synthetic active support', now() - interval '1 hour', now() + interval '1 hour'),
         ($6, $2, $3, $7, $5, 'synthetic expired support', now() - interval '2 hours', now() - interval '1 hour')
       on conflict (id) do update
       set starts_at = excluded.starts_at, expires_at = excluded.expires_at, revoked_at = null`,
      [
        fixture.activeGrant,
        fixture.organizationA,
        fixture.workspaceA,
        fixture.operatorActor,
        fixture.ownerActor,
        fixture.expiredGrant,
        fixture.expiredOperatorActor,
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
