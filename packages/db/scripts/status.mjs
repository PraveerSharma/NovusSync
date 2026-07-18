import pg from "pg";

import { requiredDatabaseUrl } from "./safety.mjs";

const client = new pg.Client({
  connectionString: requiredDatabaseUrl(),
  application_name: "novussync-db-status",
});
await client.connect();
try {
  const result = await client.query(`
    select id, hash, created_at
    from drizzle.__drizzle_migrations
    order by id asc
  `);
  console.table(result.rows);
} catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code === "42P01") {
    console.log("No Drizzle migrations have been applied.");
  } else {
    throw error;
  }
} finally {
  await client.end();
}
