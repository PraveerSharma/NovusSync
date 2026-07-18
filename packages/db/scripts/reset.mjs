import pg from "pg";

import { assertSyntheticLocalDatabase, requiredDatabaseUrl } from "./safety.mjs";

const connectionString = requiredDatabaseUrl();
assertSyntheticLocalDatabase(connectionString);

const client = new pg.Client({ connectionString, application_name: "novussync-db-reset" });
await client.connect();
try {
  await client.query(`
    drop table if exists
      outbox_message,
      webhook_inbox,
      idempotency_record,
      audit_event,
      support_grant,
      workspace_membership,
      app_actor,
      workspace,
      organization
    cascade;
    drop schema if exists drizzle cascade;
    drop schema if exists app_private cascade;
    drop role if exists novussync_app;
  `);
} finally {
  await client.end();
}
