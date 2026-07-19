import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

import * as schema from "./schema.ts";

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseHandle {
  readonly db: Database;
  readonly pool: Pool;
  close(): Promise<void>;
}

export interface DatabaseOptions {
  readonly connectionString: string;
  readonly applicationName: string;
  readonly maxConnections?: number;
  readonly idleTimeoutMs?: number;
  readonly connectionTimeoutMs?: number;
}

export function createDatabase(options: DatabaseOptions): DatabaseHandle {
  if (!options.connectionString) {
    throw new Error("A PostgreSQL connection string is required");
  }

  const poolConfig: PoolConfig = {
    connectionString: options.connectionString,
    application_name: options.applicationName,
    max: options.maxConnections ?? 10,
    idleTimeoutMillis: options.idleTimeoutMs ?? 10_000,
    connectionTimeoutMillis: options.connectionTimeoutMs ?? 5_000,
  };
  const pool = new Pool(poolConfig);

  return {
    db: drizzle(pool, { schema }),
    pool,
    close: () => pool.end(),
  };
}
