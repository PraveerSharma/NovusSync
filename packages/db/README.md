# `@novussync/db`

Code-first Drizzle schema and reviewed PostgreSQL migrations for the generic NovusSync core.

## Boundaries

- PostgreSQL is authoritative; provider dashboards are not a schema-editing path.
- Customer-owned rows carry `organization_id` and `workspace_id`.
- Runtime access uses `novussync_app` plus transaction-local tenant settings.
- `audit_event` is append-only. Corrections are new events.
- Seed files contain synthetic identifiers only.
- `drizzle-kit push` is forbidden for shared environments.

## Commands

Run commands from the repository root with `pnpm --filter @novussync/db <command>`.

- `db:generate`: generate a reviewed migration from the TypeScript schema.
- `db:migrate`: apply committed migrations using `DATABASE_MIGRATION_URL`.
- `db:status`: show applied Drizzle migrations without displaying the connection string.
- `db:reset`: destructive local/test reset, migrate, and synthetic seed.
- `db:seed`: seed a local/test database with two synthetic tenants.

Reset and seed require `APP_ENV=local|test`, a localhost database, and
`CONFIRM_SYNTHETIC_DATABASE=novussync-synthetic-only`.

## Migration policy

Shared changes use expand, backfill, validate, then contract. Production migrations are
forward-fix oriented and run once through the direct migration connection before compatible
application promotion. Destructive changes require backup evidence and explicit approval.
