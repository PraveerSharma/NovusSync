import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { assertSyntheticLocalDatabase, requiredDatabaseUrl } from "./safety.mjs";

const connectionString = requiredDatabaseUrl();
assertSyntheticLocalDatabase(connectionString);

const seedPath = fileURLToPath(new URL("../seed/synthetic.sql", import.meta.url));
const seedSql = await readFile(seedPath, "utf8");
const client = new pg.Client({ connectionString, application_name: "novussync-db-seed" });
await client.connect();
try {
  await client.query("begin");
  await client.query(seedSql);
  await client.query("commit");
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
