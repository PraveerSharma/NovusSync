import { sql } from "drizzle-orm";

import type { Database } from "./client.js";

export interface TenantContext {
  readonly organizationId: string;
  readonly workspaceId: string;
}

type DatabaseTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function withTenantTransaction<T>(
  database: Database,
  context: TenantContext,
  operation: (transaction: DatabaseTransaction) => Promise<T>,
): Promise<T> {
  assertTenantContext(context);

  return database.transaction(async (transaction) => {
    await transaction.execute(sql`
      select
        set_config('app.organization_id', ${context.organizationId}, true),
        set_config('app.workspace_id', ${context.workspaceId}, true)
    `);

    return operation(transaction);
  });
}

function assertTenantContext(context: TenantContext): void {
  if (!UUID_PATTERN.test(context.organizationId) || !UUID_PATTERN.test(context.workspaceId)) {
    throw new Error("Tenant context requires valid organization and workspace UUIDs");
  }
}
