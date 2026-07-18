import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDatabase, type DatabaseHandle } from "./client.js";
import {
  createLeadLifecycleRepository,
  type LeadLifecycleRepository,
} from "./lead-lifecycle-repository.js";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "TEST_DATABASE_URL is required. Lifecycle integration tests must execute against an isolated synthetic test database and may not be skipped.",
  );
}

const fixture = Object.freeze({
  organizationA: randomUUID(),
  workspaceA: randomUUID(),
  organizationB: randomUUID(),
  workspaceB: randomUUID(),
});

let database: DatabaseHandle;
let repository: LeadLifecycleRepository;

describe("tenant-scoped lead lifecycle persistence", () => {
  beforeAll(async () => {
    database = createDatabase({
      connectionString,
      applicationName: "novussync-lifecycle-integration",
      maxConnections: 4,
    });
    repository = createLeadLifecycleRepository(database.db);
    await seedTenants();
  });

  afterAll(async () => {
    await database.close();
  });

  it("creates and advances one lifecycle with immutable ordered history", async () => {
    const leadId = randomUUID();
    const openedAt = new Date().toISOString();
    const created = await repository.create(tenantA(), {
      leadId,
      actor: { type: "system" },
      correlationId: randomUUID(),
      idempotencyKey: `lead:create:${leadId}`,
      occurredAt: openedAt,
    });

    expect(created).toMatchObject({ leadId, stage: "new", version: 1 });

    const contacted = await repository.transition(tenantA(), {
      leadId,
      expectedVersion: 1,
      nextStage: "contacted",
      actor: { type: "system" },
      correlationId: randomUUID(),
      occurredAt: new Date(Date.parse(openedAt) + 1_000).toISOString(),
    });

    expect(contacted).toMatchObject({ leadId, stage: "contacted", version: 2 });
    await expect(
      repository.transition(tenantA(), {
        leadId,
        expectedVersion: 1,
        nextStage: "qualified",
        actor: { type: "system" },
        correlationId: randomUUID(),
        occurredAt: new Date(Date.parse(openedAt) + 2_000).toISOString(),
      }),
    ).rejects.toMatchObject({ code: "version_conflict" });

    const history = await repository.listTransitions(tenantA(), leadId);
    expect(
      history.map(({ version, previousStage, nextStage }) => ({
        version,
        previousStage,
        nextStage,
      })),
    ).toEqual([
      { version: 1, previousStage: null, nextStage: "new" },
      { version: 2, previousStage: "new", nextStage: "contacted" },
    ]);
  });

  it("fails closed for cross-tenant reads and writes", async () => {
    const leadId = randomUUID();
    await repository.create(tenantA(), {
      leadId,
      actor: { type: "system" },
      correlationId: randomUUID(),
      occurredAt: new Date().toISOString(),
    });

    await expect(repository.findById(tenantB(), leadId)).resolves.toBeNull();
    await expect(
      repository.transition(tenantB(), {
        leadId,
        expectedVersion: 1,
        nextStage: "contacted",
        actor: { type: "system" },
        correlationId: randomUUID(),
        occurredAt: new Date().toISOString(),
      }),
    ).rejects.toMatchObject({ code: "not_found" });

    await withAppRole(tenantA(), async (client) => {
      await expect(
        client.query(
          `insert into lead_lifecycle (
             organization_id, workspace_id, lead_id, stage, version, opened_at, updated_at
           ) values ($1, $2, $3, 'new', 1, now(), now())`,
          [fixture.organizationB, fixture.workspaceB, randomUUID()],
        ),
      ).rejects.toMatchObject({ code: expect.stringMatching(/23503|42501/) });
    });
  });

  it("rejects invalid stage skips, missing reason codes, and time regression", async () => {
    const leadId = randomUUID();
    const openedAt = new Date().toISOString();
    await repository.create(tenantA(), {
      leadId,
      actor: { type: "system" },
      correlationId: randomUUID(),
      occurredAt: openedAt,
    });

    await expect(
      repository.transition(tenantA(), {
        leadId,
        expectedVersion: 1,
        nextStage: "booked",
        actor: { type: "system" },
        correlationId: randomUUID(),
        occurredAt: new Date(Date.parse(openedAt) + 1_000).toISOString(),
      }),
    ).rejects.toMatchObject({ code: "invalid_transition" });

    await expect(
      repository.transition(tenantA(), {
        leadId,
        expectedVersion: 1,
        nextStage: "closed_not_converted",
        actor: { type: "system" },
        correlationId: randomUUID(),
        occurredAt: new Date(Date.parse(openedAt) + 1_000).toISOString(),
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });

    await expect(
      repository.transition(tenantA(), {
        leadId,
        expectedVersion: 1,
        nextStage: "contacted",
        actor: { type: "system" },
        correlationId: randomUUID(),
        occurredAt: new Date(Date.parse(openedAt) - 1_000).toISOString(),
      }),
    ).rejects.toMatchObject({ code: "time_regression" });
  });

  it("prevents mutation of recorded lifecycle history", async () => {
    const leadId = randomUUID();
    await repository.create(tenantA(), {
      leadId,
      actor: { type: "system" },
      correlationId: randomUUID(),
      occurredAt: new Date().toISOString(),
    });

    await withAppRole(tenantA(), async (client) => {
      const transition = await client.query<{ id: string }>(
        "select id from lead_lifecycle_transition where lead_id = $1",
        [leadId],
      );
      await expect(
        client.query("update lead_lifecycle_transition set reason_code = 'CHANGED' where id = $1", [
          transition.rows[0]?.id,
        ]),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });
});

async function seedTenants(): Promise<void> {
  await database.pool.query(
    `insert into organization (id, slug, name)
     values ($1, $2, 'Lifecycle Tenant A'), ($3, $4, 'Lifecycle Tenant B')`,
    [
      fixture.organizationA,
      `lifecycle-${fixture.organizationA}`,
      fixture.organizationB,
      `lifecycle-${fixture.organizationB}`,
    ],
  );
  await database.pool.query(
    `insert into workspace (id, organization_id, slug, name)
     values ($1, $2, 'lifecycle-a', 'Lifecycle Workspace A'),
            ($3, $4, 'lifecycle-b', 'Lifecycle Workspace B')`,
    [fixture.workspaceA, fixture.organizationA, fixture.workspaceB, fixture.organizationB],
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
