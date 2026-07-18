# ADR-0025: Supabase PostgreSQL, Drizzle, Storage, Events, and Audit

## Status

Accepted under founder-delegated technical direction — 14 July 2026

## Context

The product needs one transactional source of truth for tenants, verified facts, campaigns, exact approvals, content versions, Leads, consent/suppression, booking evidence, outcomes, workflow state, usage, events, and audit evidence. Tenant isolation, exact-version authorization, idempotency, and append-only corrections must survive application bugs and concurrent work.

OD-016 already selects Supabase Auth and application-owned authorization. OD-017 selects Mumbai Vercel compute and proposes colocation with a Mumbai Supabase project. OD-021 excludes vector retrieval initially. OD-024 requires a transactional outbox and product-owned authoritative workflow state.

The initial team is small and the 10–50-Workspace stage does not justify separate document, vector, event, or audit databases. The persistence tool must keep SQL and migrations reviewable, support real PostgreSQL constraints/transactions, and avoid a generic repository abstraction over a single known database.

## Options considered

### Managed database and storage

| Option | Benefits | Costs and risks | Appropriate when |
|---|---|---|---|
| Supabase PostgreSQL + Storage | Aligns Auth/data/objects; Mumbai region; full Postgres; pooler; private RLS storage | Concentrated vendor dependency; storage objects need separate backup; service-role blast radius | Current regional managed MVP |
| Another managed PostgreSQL + S3/R2 | Best-of-breed choice and reduced Supabase concentration | More providers, credentials, region/DPA reviews, and auth integration | Supabase fails privacy/cost/reliability gates |
| Separate vector/document/event stores | Independent specialization and scaling | Cross-store consistency, operations, retention/deletion complexity | Measured corpus/volume requires it |

### Persistence and migrations

| Option | Benefits | Costs and risks | Appropriate when |
|---|---|---|---|
| Drizzle ORM/Kit + `node-postgres` | TypeScript schema, SQL-like API, constraints, transactions/isolation, raw SQL, generated reviewable migrations | Framework/version semantics; generated SQL still needs expert review | Small TypeScript team on PostgreSQL |
| Kysely | Thin SQL-oriented typed builder and explicit migrations | Separate schema type/codegen discipline; more hand-written DDL | Maximum SQL control is preferred |
| Prisma | Mature generated client and migration history | Heavier schema/client abstraction and escape-hatch complexity | CRUD productivity outweighs SQL proximity |
| Direct SQL + runner | Maximum visibility/control | More hand-written types, query mapping, and migration discipline | Team is strongly SQL-first |

### Event and audit shape

| Option | Benefits | Costs and risks | Appropriate when |
|---|---|---|---|
| Append-only relational event/audit tables + outbox | Atomic with domain state, queryable, simple | Table growth, permissions and retention work; not cryptographically tamper-proof | Current MVP |
| Event sourcing/CQRS | Full state history and replay | Large modeling, migration, projection, and operational burden | Events are the accepted source of truth |
| Analytics/SaaS events only | Fast dashboards | Not transactional or authoritative; vendor loss/privacy risk | Secondary telemetry only |

## Decision

### 1. Managed PostgreSQL and environments

Use one Supabase Pro project per shared environment. Production uses the specific Mumbai region `ap-south-1`, colocated with accepted Vercel `bom1` compute as closely as the providers permit. Staging and production never share a project, Auth tenant, Storage bucket, credentials, callbacks, or real customer data.

Supabase PostgreSQL is the only application system of record. Do not add pgvector, a standalone vector/document database, Kafka, an event warehouse, or a separate audit store initially.

Use:

- a pooled runtime URL appropriate for short-lived Vercel/Workflow functions;
- a direct database connection for migrations, `pg_dump`/restore, and approved administration;
- TLS verification and separately scoped credentials per environment;
- a dedicated least-privileged runtime database role rather than the migration owner or Supabase service role.

The exact pooler mode/limits are proven in the OD-025/OD-037 spike. Transaction-pooler operation must not rely on named prepared statements or session state.

### 2. Schemas, roles, and tenant integrity

Keep application business tables in non-exposed PostgreSQL schemas owned by the migration role. Supabase-managed `auth` and `storage` schemas are treated as provider-owned; application migrations do not alter their tables.

The browser never performs broad direct CRUD against business tables. Server application services verify session, Workspace membership/grant, actor authority, current state, and command preconditions. PostgreSQL privileges and RLS are defense in depth, not a replacement for server authorization.

Every Workspace-owned table has a non-null `workspace_id`. Use compound unique keys and compound foreign keys such as `(workspace_id, id)` so a child cannot reference another Workspace even if application filtering fails. Add database `NOT NULL`, `CHECK`, `UNIQUE`, exclusion/partial indexes, and foreign keys for invariants PostgreSQL can express. Use row locks, advisory locks, or serializable transactions only where the specific concurrent transition needs them.

Use distinct roles at minimum for migration ownership, application runtime, and approved read-only operations. The runtime role cannot change schema, manage roles, bypass storage APIs, or update/delete append-only evidence tables.

### 3. Drizzle and driver

Use pinned stable versions of:

- `drizzle-orm`;
- `drizzle-kit` as a development/CI migration tool; and
- `node-postgres` (`pg`) as the PostgreSQL driver.

Domain and application packages do not import Drizzle. Module-owned persistence adapters use Drizzle directly; do not add one generic repository interface or unit-of-work abstraction over all modules. Use Drizzle's typed query API for ordinary work and parameterized `sql`/`node-postgres` operations for PostgreSQL-specific locks, CTEs, `FOR UPDATE SKIP LOCKED`, bulk operations, explain plans, or unsupported DDL.

Tests use real PostgreSQL at the pinned major version. SQLite, in-memory maps, or ORM mocks cannot pass persistence, migration, concurrency, tenant-isolation, or workflow acceptance tests.

### 4. Migration policy

Use codebase-first Drizzle schemas plus generated SQL migrations:

1. change the version-controlled TypeScript schema;
2. run `drizzle-kit generate` with deterministic timestamp/Supabase-compatible names;
3. review and edit generated SQL where necessary, including locks, backfills, constraint validation, indexes, and transaction boundaries;
4. commit schema, SQL, snapshots/metadata, and migration test together;
5. in CI, apply the full chain to an empty PostgreSQL database and apply the new migration to a representative previous schema/data fixture;
6. use `drizzle-kit migrate` or the approved migration runner once per environment through the direct migration connection before compatible application promotion.

Do not use `drizzle-kit push`, dashboard table editing, application-startup migrations, or manually unrecorded SQL in staging/production. Local disposable exploration cannot become a shared schema without a reviewed migration.

Production migrations are forward-oriented. Every material change documents expand/backfill/validate/contract sequencing and its rollback, restore, or forward-fix procedure. Destructive change requires backup evidence and explicit production approval. Application releases remain compatible with the migration order.

### 5. Transactions and concurrency

Use one database transaction for each authoritative command and its:

- domain row/state transition;
- version/precondition check;
- domain event and audit event;
- outbox intent where asynchronous work follows;
- idempotency/effect record where relevant.

Use default `READ COMMITTED` only when constraints and version predicates make it safe. Select stronger isolation or explicit locks for campaign activation, exact approval/occurrence replacement, booking reconciliation, effect claiming, and other proven races. Retry serialization/deadlock failures through a bounded application policy with the same idempotency key.

### 6. Event, inbox, outbox, and effect records

Use relational append-oriented records, not event sourcing:

- `domain_event`: canonical state-change fact with Workspace, aggregate/version, event type/version, occurred/recorded times, correlation/causation, and allow-listed payload;
- `audit_event`: actor/system purpose, action, target/version, result/reason, request/correlation, occurred/recorded times, and allow-listed evidence metadata;
- `outbox_message`: versioned delivery intent written atomically with state and claimed safely by dispatcher workers;
- `webhook_inbox`: verified raw-envelope reference/hash, provider/event identity, receipt/verification, processing state, normalized result, and dedupe constraint;
- `effect_record`: product-owned operation/idempotency key, input fingerprint/version, state, attempt, ambiguous/terminal result, and normalized provider receipt.

The runtime role may insert but not update/delete `domain_event` or `audit_event`; corrections append a superseding record. Outbox/inbox/effect status rows may update through constrained commands while preserving attempt/history records.

This is application-level append-only evidence, not a claim of cryptographic immutability or protection from the database owner. Periodic export/checksum/restore evidence is governed by OD-036.

Payloads contain stable identifiers and allow-listed operational metadata, not secrets, arbitrary request bodies, raw model prompts/responses, or unnecessary Lead PII.

### 7. Supabase Storage

Use private Supabase Storage buckets per environment for approved website snapshots and media/render outputs. The application owns a relational `media_asset`/`source_object` record containing Workspace, object key, content type/size, checksum, provenance/licence/generation metadata, purpose, source/render/content versions, retention status, and created/superseded/deleted evidence.

All object create/copy/move/delete operations use the Storage API; do not mutate the provider-owned `storage` schema. Server authorization precedes a short-lived signed URL. RLS policies and bucket restrictions provide defense in depth. Object paths are opaque and never treated as authorization.

Signed URLs are bearer credentials that may remain valid/cached until their lifetime; keep lifetimes short and delete/replace the object when access must be revoked. Public buckets are outside the MVP. Do not log signed URLs or send them to models/analytics.

Database backups do not include Storage objects. OD-036 must define object inventory, export, version/reconciliation, restore, and deletion evidence before paid operation.

### 8. Required pre-foundation spike

With pinned OD-037 versions and disposable synthetic data, prove:

- Drizzle compound primary/unique/foreign/check constraints and cross-tenant rejection;
- transactions, version predicates, locks, serialization retry, and concurrent effect claims;
- `FOR UPDATE SKIP LOCKED` outbox dispatch and duplicate workflow-start reconciliation;
- generated/reviewed migrations on an empty DB and representative previous schema/data;
- direct migration plus Supabase runtime pooler connections with no prepared/session-state dependency;
- least-privileged runtime role and RLS/privilege denial paths;
- insert-only audit/domain-event behavior and append-only correction;
- webhook inbox/effect idempotency and ambiguous-result reconciliation;
- private Storage upload/download/signed URL/RLS/wrong-tenant/delete behavior;
- real-PostgreSQL isolated test creation/reset and migration drift detection.

A critical failure reopens the relevant tool/provider decision. Kysely plus explicit SQL migrations is the first persistence-tool fallback; another Mumbai-capable managed PostgreSQL/S3-compatible provider is the infrastructure fallback.

## Invariants

- PostgreSQL is the sole authoritative application data store.
- Every tenant-owned row and relationship is database-constrained to one Workspace.
- Browser/provider metadata never grants business-table authority.
- Domain state, audit/domain event, and outbox intent commit atomically.
- Retries/duplicates reconcile through database idempotency and unique constraints.
- Audit/domain corrections append; existing evidence is not overwritten.
- No production/shared schema change bypasses reviewed committed migrations.
- No pgvector or separate specialized store enters the MVP without an accepted successor decision.
- Storage objects remain private, source-linked, checksummed, lifecycle-governed, and separately backed up.
- Supabase provider schemas are changed only through supported provider APIs/configuration.

## Consequences

### Positive

- One regional relational source supports transactional product invariants.
- Supabase aligns Auth, PostgreSQL, and Storage for a small team.
- Drizzle gives TypeScript ergonomics while keeping generated SQL reviewable.
- Database constraints defend tenant/state integrity beneath application code.
- Outbox/inbox/effect records bridge durable workflows and unreliable providers honestly.
- Append-only evidence remains queryable without event-sourcing complexity.

### Negative

- Auth, database, and objects concentrate dependency on Supabase.
- Drizzle and generated migrations require version discipline and SQL expertise.
- Runtime pooler and serverless concurrency need explicit testing/tuning.
- Application-level append-only logs are not cryptographically tamper-proof.
- Storage backup/restore is separate from database backup.
- Composite tenant keys increase schema/query verbosity.

### Mitigations

- Preserve PostgreSQL-standard schema, SQL migrations, `pg_dump`, object manifests, and narrow provider adapters.
- Pin versions and require migration/concurrency/tenant tests in CI.
- Use least-privileged roles, RLS defense in depth, and private schemas/buckets.
- Measure query plans/pool saturation and add indexes from evidence.
- Exercise database and object restore/export under OD-036.

## Revisit triggers

Revisit this ADR when:

- Supabase fails OD-027/OD-033 privacy, residency, DPA, support, or subprocessor gates;
- workload exceeds connection, compute, storage, or cost assumptions under OD-032;
- Drizzle cannot safely express or migrate required PostgreSQL behavior;
- query/migration defects materially increase operator or incident load;
- retrieval evaluations justify pgvector under ADR-0021;
- event volume/analytics needs justify a separate warehouse under OD-028;
- backup/restore evidence under OD-036 cannot meet the accepted paid-pilot target.

## Official sources reviewed

- [Supabase available regions](https://supabase.com/docs/guides/platform/regions)
- [Supabase PostgreSQL overview and backup boundary](https://supabase.com/docs/guides/database/overview)
- [Supabase PostgreSQL connection and pooler modes](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase private Storage buckets and signed URLs](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Storage schema/API boundary](https://supabase.com/docs/guides/storage/schema/design)
- [Drizzle migration fundamentals](https://orm.drizzle.team/docs/migrations)
- [Drizzle PostgreSQL connections/drivers](https://orm.drizzle.team/docs/get-started-postgresql)
- [Drizzle transactions and isolation](https://orm.drizzle.team/docs/transactions)
- [Drizzle PostgreSQL indexes and constraints](https://orm.drizzle.team/docs/indexes-constraints)
- [Drizzle RLS support](https://orm.drizzle.team/docs/rls)

## Related decisions

- OD-015 / ADR-0015: modular monolith and one relational system of record
- OD-016 / ADR-0016: Supabase Auth with application-owned authorization
- OD-017 / ADR-0017: Mumbai Vercel compute and isolated environments
- OD-021 / ADR-0021: relational/full-text retrieval, no pgvector initially
- OD-022 / ADR-0022: governed media assets and checksums
- OD-024 / ADR-0024: transactional outbox and product-authoritative workflow state
- OD-027: privacy, retention, deletion, and residency
- OD-028: canonical metrics and telemetry sinks
- OD-030: database/storage credentials and encryption
- OD-036: backup, export, object restore, and disaster recovery
- OD-037: pinned Node/pnpm/Drizzle/PostgreSQL/test toolchain
