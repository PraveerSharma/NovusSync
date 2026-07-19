import { loadServerConfig } from "@novussync/config/server";
import { createDatabase, type Database, type DatabaseHandle } from "@novussync/db";

let databaseHandle: DatabaseHandle | undefined;

export function getWebDatabase(): Database {
  if (databaseHandle) return databaseHandle.db;
  const config = loadServerConfig(process.env);
  const databaseUrl = config.persistence.databaseUrl;
  if (!databaseUrl) throw new Error("Database persistence is not configured.");
  databaseHandle = createDatabase({
    connectionString: databaseUrl.revealForUse("Open the tenant-scoped web database pool."),
    applicationName: `novussync-web-${config.runtime.releaseId}`.slice(0, 63),
    maxConnections: 2,
    idleTimeoutMs: 10_000,
    connectionTimeoutMs: 5_000,
  });
  return databaseHandle.db;
}
