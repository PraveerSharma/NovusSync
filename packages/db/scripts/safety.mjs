const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function requiredDatabaseUrl(name = "DATABASE_MIGRATION_URL") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function assertSyntheticLocalDatabase(connectionString) {
  const environment = process.env.APP_ENV;
  const parsed = new URL(connectionString);

  if (!LOCAL_HOSTS.has(parsed.hostname)) {
    throw new Error("Synthetic reset and seed commands are restricted to localhost databases");
  }
  if (environment !== "local" && environment !== "test") {
    throw new Error("Synthetic reset and seed commands require APP_ENV=local or APP_ENV=test");
  }
  if (process.env.CONFIRM_SYNTHETIC_DATABASE !== "novussync-synthetic-only") {
    throw new Error(
      "Set CONFIRM_SYNTHETIC_DATABASE=novussync-synthetic-only to confirm this destructive command",
    );
  }
}
