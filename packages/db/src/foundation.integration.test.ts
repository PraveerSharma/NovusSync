import { randomUUID } from "node:crypto";

import pg, { type PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { syntheticTenantA, syntheticTenantB } from "./testing/fixtures.js";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "TEST_DATABASE_URL is required. Database integration tests must execute against an isolated synthetic test database and may not be skipped.",
  );
}

let pool: pg.Pool;

describe("Phase 0 PostgreSQL foundation", () => {
  beforeAll(async () => {
    pool = new pg.Pool({ connectionString, application_name: "novussync-db-integration" });
    await seedSyntheticTenants();
  });

  afterAll(async () => {
    try {
      await pool.query(
        `delete from workspace
         where (organization_id, id) in (($1::uuid, $2::uuid), ($3::uuid, $4::uuid))`,
        [
          syntheticTenantA.organizationId,
          syntheticTenantA.workspaceId,
          syntheticTenantB.organizationId,
          syntheticTenantB.workspaceId,
        ],
      );
      await pool.query("delete from organization where id = any($1::uuid[])", [
        [syntheticTenantA.organizationId, syntheticTenantB.organizationId],
      ]);
    } finally {
      await pool.end();
    }
  });

  it("isolates workspace reads by organization and workspace context", async () => {
    await withTenantClient(syntheticTenantA, async (client) => {
      const result = await client.query<{ id: string }>("select id from workspace");
      expect(result.rows).toEqual([{ id: syntheticTenantA.workspaceId }]);
    });
  });

  it("rejects a compound reference to another tenant", async () => {
    await withTenantClient(syntheticTenantA, async (client) => {
      await expect(
        client.query(
          `insert into outbox_message (
            organization_id, workspace_id, aggregate_type, aggregate_id,
            aggregate_version, effect_kind, effect_key
          ) values ($1, $2, 'test', 'wrong-tenant', 1, 'test', $3)`,
          [syntheticTenantA.organizationId, syntheticTenantB.workspaceId, randomUUID()],
        ),
      ).rejects.toMatchObject({ code: expect.stringMatching(/23503|42501/) });
    });
  });

  it("prevents a repeated logical command from creating duplicate effect intent", async () => {
    await withTenantClient(syntheticTenantA, async (client) => {
      const effectKey = randomUUID();
      const values = [syntheticTenantA.organizationId, syntheticTenantA.workspaceId, effectKey];
      const statement = `insert into outbox_message (
        organization_id, workspace_id, aggregate_type, aggregate_id,
        aggregate_version, effect_kind, effect_key
      ) values ($1, $2, 'test', 'aggregate', 1, 'test', $3)`;

      await client.query(statement, values);
      await expect(client.query(statement, values)).rejects.toMatchObject({ code: "23505" });
    });
  });

  it("deduplicates provider events within a tenant", async () => {
    await withTenantClient(syntheticTenantA, async (client) => {
      const eventKey = randomUUID();
      const values = [syntheticTenantA.organizationId, syntheticTenantA.workspaceId, eventKey];
      const statement = `insert into webhook_inbox (
        organization_id, workspace_id, provider, event_key, payload_hash
      ) values ($1, $2, 'synthetic', $3, 'sha256:synthetic')`;

      await client.query(statement, values);
      await expect(client.query(statement, values)).rejects.toMatchObject({ code: "23505" });
    });
  });

  it("keeps audit evidence append-only", async () => {
    const id = randomUUID();
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(
        `insert into audit_event (
          id, organization_id, workspace_id, actor_type, action, target_type,
          target_id, target_version, correlation_id, policy_result, evidence_state, occurred_at
        ) values ($1::uuid, $2::uuid, $3::uuid, 'system', 'test.recorded', 'test', $1::text, 1, $4::uuid, 'not_applicable', 'not_applicable', now())`,
        [id, syntheticTenantA.organizationId, syntheticTenantA.workspaceId, randomUUID()],
      );

      await client.query("savepoint audit_update_attempt");
      await expect(
        client.query("update audit_event set action = 'test.changed' where id = $1", [id]),
      ).rejects.toMatchObject({ code: "55000" });
      await client.query("rollback to savepoint audit_update_attempt");

      await client.query("savepoint audit_delete_attempt");
      await expect(
        client.query("delete from audit_event where id = $1", [id]),
      ).rejects.toMatchObject({ code: "55000" });
      await client.query("rollback to savepoint audit_delete_attempt");
    } finally {
      await client.query("rollback").catch(() => undefined);
      client.release();
    }
  });

  it("uses skip-locked claims so concurrent dispatchers cannot claim one row", async () => {
    const outboxId = randomUUID();
    let first: PoolClient | undefined;
    let second: PoolClient | undefined;
    try {
      await pool.query(
        `insert into outbox_message (
          id, organization_id, workspace_id, aggregate_type, aggregate_id,
          aggregate_version, effect_kind, effect_key
        ) values ($1::uuid, $2::uuid, $3::uuid, 'test', $1::text, 1, 'test', $1::text)`,
        [outboxId, syntheticTenantA.organizationId, syntheticTenantA.workspaceId],
      );

      first = await openTenantClient(syntheticTenantA);
      second = await openTenantClient(syntheticTenantA);
      const claimed = await first.query<{ id: string }>(
        "select id from outbox_message where id = $1 for update skip locked",
        [outboxId],
      );
      const skipped = await second.query<{ id: string }>(
        "select id from outbox_message where id = $1 for update skip locked",
        [outboxId],
      );
      expect(claimed.rows).toEqual([{ id: outboxId }]);
      expect(skipped.rows).toEqual([]);
    } finally {
      if (second) {
        await second.query("rollback");
        second.release();
      }
      if (first) {
        await first.query("rollback");
        first.release();
      }
      await pool.query("delete from outbox_message where id = $1", [outboxId]);
    }
  });
});

async function seedSyntheticTenants(): Promise<void> {
  await pool.query(
    `with seeded_organizations as (
      insert into organization (id, slug, name)
      values
        ($1::uuid, 'synthetic-tenant-a', 'Synthetic Tenant A'),
        ($3::uuid, 'synthetic-tenant-b', 'Synthetic Tenant B')
      on conflict (id) do update
      set slug = excluded.slug, name = excluded.name
    )
    insert into workspace (id, organization_id, slug, name, status)
    values
      ($2::uuid, $1::uuid, 'synthetic-workspace-a', 'Synthetic Workspace A', 'active'),
      ($4::uuid, $3::uuid, 'synthetic-workspace-b', 'Synthetic Workspace B', 'active')
    on conflict (id) do update
    set organization_id = excluded.organization_id,
        slug = excluded.slug,
        name = excluded.name,
        status = excluded.status`,
    [
      syntheticTenantA.organizationId,
      syntheticTenantA.workspaceId,
      syntheticTenantB.organizationId,
      syntheticTenantB.workspaceId,
    ],
  );
}

async function withTenantClient(
  tenant: { organizationId: string; workspaceId: string },
  operation: (client: PoolClient) => Promise<void>,
): Promise<void> {
  const client = await openTenantClient(tenant);
  try {
    await operation(client);
  } finally {
    await client.query("rollback");
    client.release();
  }
}

async function openTenantClient(tenant: {
  organizationId: string;
  workspaceId: string;
}): Promise<PoolClient> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("set local role novussync_app");
    await client.query(
      "select set_config('app.organization_id', $1, true), set_config('app.workspace_id', $2, true)",
      [tenant.organizationId, tenant.workspaceId],
    );
    return client;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    client.release();
    throw error;
  }
}
