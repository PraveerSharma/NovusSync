# Phase 0 — Engineering Foundation

**Status:** Foundation implementation started under signed Gate G0 `GO` (17 July 2026)  
**Execution status:** **In progress. FND-001 repository/toolchain implementation is active; synthetic/local constraints remain.**  
**Entry gate:** [Open Decisions](../decisions/OPEN_DECISIONS.md) and Roadmap Gate G0  
**Architecture:** [System Architecture](../architecture/SYSTEM_ARCHITECTURE.md)  
**Backlog:** `FND-*` and cross-cutting `OPS-*` stories in [BACKLOG.md](BACKLOG.md)  
**Last updated:** 17 July 2026

## 1. Objective

Phase 0 creates a repeatable, tenant-safe repository and delivery pipeline for the approved MVP. It establishes tooling, module boundaries, configuration, persistence, identity seams, audit/idempotency primitives, deterministic provider fakes, tests, CI, and environment separation.

Phase 0 does **not** implement the Business Brain, campaign generation, content production, social/WhatsApp API integration, manual channel workflow features, booking, outcome analytics, billing, or any live external action.

## 2. Entry conditions

Application scaffolding begins because the founder has recorded Gate G0 approval on 17 July 2026. Foundation work remains bound by synthetic/local constraints and deferred-provider rules.

Decision closure alone does not satisfy this entry condition. A signed Gate G0 `GO` opens synthetic/local Phase 0 work. It does not authorize real Lead data, a paid/live campaign, production-provider purchase or enablement, production AI/telemetry, or global checkout; those remain blocked until the applicable OD-033 evidence and founder live-readiness go/no-go pass.

The following choices must be accepted before their corresponding foundation task is completed:

| Decision | Required before | Why |
|---|---|---|
| OD-015 system shape — **accepted; ADR-0015** | Repository initialization | Fixes the TypeScript monorepo, modular-monolith, shared-domain, and web/worker topology |
| OD-016 auth/tenancy/roles — **accepted; ADR-0016** | Identity and tenant schema | Fixes Supabase Auth identity/session and application-owned actor, Workspace membership, role, support-grant, tenant-key, and MFA boundaries |
| OD-017 hosting/regions/environments — **accepted; ADR-0017** | Deployment configuration | Fixes Vercel Pro/Fluid Compute, Mumbai web/API compute, and local/test/Preview/custom-staging/production isolation; OD-037 supplies the accepted Node/framework versions |
| OD-023 AI runtime/models — **accepted; ADR-0023** | Repository initialization | Fixes application-owned `ModelPort`/task-policy boundaries and direct OpenAI Responses adapter placement; the provider SDK remains outside domain/application packages and can wait for its adapter task |
| OD-024 durable jobs — **accepted; ADR-0024** | Repository initialization | Fixes stable Vercel Workflow, `DurableWorkPort`, product DB/outbox/idempotency authority, minimal workflow payloads, and the required compatibility/region/privacy/cost spike |
| OD-025 database/storage/audit/events — **accepted; ADR-0025** | Persistence package initialization and first migration | Fixes Mumbai Supabase PostgreSQL/private Storage, Drizzle ORM/Kit plus `node-postgres`, reviewed SQL migrations, tenant constraints, and product-owned event/audit/outbox/inbox records |
| OD-027 privacy/retention/residency — **accepted; ADR-0027** | Any real Lead data | Fixes Mumbai primary authority plus controlled cross-border processing, minimum adult/non-medical fields, versioned consent/suppression, rights/deletion, and 30/90/365/35-day retention; OD-033 validates contracts/providers |
| OD-028 analytics/observability — **accepted; ADR-0028** | Production telemetry contracts and sinks | Fixes product-owned truth plus allow-listed PostHog EU and scrubbed Sentry EU/DE/Vercel/OpenTelemetry boundaries; live enablement waits for OD-033 and OD-027 verification evidence |
| OD-030 secrets — **accepted; ADR-0030** | Any real credential | Fixes Vercel sensitive environment variables, OIDC workload roles, Mumbai KMS tenant-credential envelopes, rotation/revocation, and redaction boundaries |
| OD-032 scale/budget — **accepted by founder** | Capacity, workload, load-test, usage-attribution, and alert envelope | Fixes the 10-Workspace capacity assumptions; INR 10,000/month development/staging, INR 15,000 one-time readiness, and INR 30,000/month live-pilot ceilings; per-tier AI allowances, operator shadow cost, 50/75/90 alerts, and fail-closed behavior at 100% |
| OD-033 platform/legal/subprocessors — **accepted by founder; evidence not passed** | Any real Lead data, paid/live activation, production provider enablement, or global checkout | Fixes the mandatory dated [live-readiness checklist](../readiness/OD-033_LIVE_READINESS.md); acceptance does not substitute for counsel, account, processor, rehearsal, or founder go/no-go evidence |
| OD-035 CI/release policy — **accepted; ADR-0035** | Phase 0 exit | Fixes protected PR trunk, GitHub Actions gates/security, isolated preview/staging, release manifest, manual production, and rollback/forward-fix rules |
| OD-036 backup/restore/portability — **accepted; ADR-0036** | Paid-production readiness | Fixes single-region fail-closed recovery, PITR, independent immutable database/object copies, internal RPO/RTO targets, and restore/export evidence; cost and privacy/legal disclosure remain gated |
| OD-037 engineering toolchain/UI/tests — **accepted; ADR-0037** | Repository initialization | Fixes Node 24, pnpm 11, Next 16.2/React 19.2/TS6, Tailwind/source-owned Radix UI, Satori/Sharp, Vitest, Playwright, ESLint, Prettier, pins, and compatibility spike |

Provider-specific dependencies remain blocked until their required feasibility/readiness evidence passes. OD-018/OD-019 are deliberately deferred by ADR-0019: Phase 0 must add no Meta SDK, credential, webhook, adapter, or fake that implies current publish/message execution. Phase 0 uses deterministic fakes and synthetic data for approved seams by default.

## 3. Accepted baseline, execution pending Gate G0

| Area | Recommended baseline | Status / trade-off |
|---|---|---|
| Runtime | Node.js 24 LTS; 24.18.0 local/CI and Vercel `24.x` | **Accepted by OD-037 / ADR-0037;** release evidence records Vercel's actual auto-patched runtime |
| Package manager | pnpm 11.4.0 with exact `packageManager`, one frozen lockfile, and workspaces | **Accepted by OD-037 / ADR-0037;** no initial Turborepo/Nx |
| Repository | TypeScript monorepo, modular monolith, web and job execution units | **Accepted by OD-015 / ADR-0015;** no microservices |
| Web | Next.js 16.2.10 App Router, React 19.2.7, TypeScript 6.0.3, Tailwind 4, source-owned native/Radix components | **Accepted by OD-037 / ADR-0037;** exact lockfile and compatibility spike required |
| Database | Supabase Pro PostgreSQL in Mumbai for shared environments; local isolated PostgreSQL for development/tests; Drizzle ORM/Kit plus `node-postgres` | **Accepted by OD-025 / ADR-0025;** direct connection for migrations, pooled runtime connection, reviewed committed SQL |
| Unit/integration tests | Vitest 4.1.7 plus real PostgreSQL integration tests | **Accepted by OD-037 / ADR-0037** |
| Browser tests | Playwright 1.61.1 | **Accepted by OD-037 / ADR-0037;** Chromium PR smoke, three-browser release/scheduled set |
| Deployment | Vercel Pro web/API in Mumbai plus stable Vercel Workflow durable execution | Accepted under OD-017/OD-024; workflow-state region/retention and pinned-toolchain compatibility remain release-gate evidence |
| Source control | Protected GitHub PR trunk, required Actions checks, isolated preview/staging, release manifest, manual serialized production | **Accepted by OD-035 / ADR-0035** |

Do not use floating application dependency versions in committed manifests. At execution time, verify current official documentation, select exact supported versions, commit the lockfile, and record material choices in ADRs.

## 4. Accepted logical repository and tool shape

```text
/
├── apps/
│   ├── web/                 # Next.js UI, product API, forms, OAuth/webhook ingress
│   └── jobs/                # Durable-job entry points; no duplicate domain rules
├── packages/
│   ├── domain/              # Pure entities, value objects, policies, state machines
│   ├── application/         # Tenant-scoped commands, queries, use cases
│   ├── db/                  # Schema, migrations, tenant-scoped repositories, outbox/inbox
│   ├── agents/              # Prompt/schema versions and typed AI proposal boundary
│   ├── integrations/        # Ports, deterministic fakes, later provider adapters
│   ├── config/              # Typed environment and shared build/test configuration
│   ├── ui/                  # Accessible shared UI primitives
│   └── testing/             # Synthetic fixtures, clocks, IDs, adapter harnesses
├── tests/
│   ├── contract/
│   ├── integration/
│   ├── ai-evals/
│   └── e2e/
├── infra/
│   └── local/               # Local-only service definitions; no production secrets
├── docs/
├── .github/workflows/
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json
├── .env.example
└── README.md
```

`apps/jobs` is a second execution shape from the same modular monolith, not a separate product service. It imports application commands and adapters; it must not reimplement domain state transitions.

## 5. Exact setup task sequence

### F0-01 — Record approved decisions and ADRs

- Mark the applicable OD records accepted or amended with owner, date, evidence, and consequences.
- Create ADRs for system shape, engineering toolchain, tenancy, persistence (including the selected ORM/query/migration tool), durable work, AI boundary, deployment/region, and CI policy.
- Record the supported Node and pnpm versions and provider-research dates.
- Confirm that the proposed `CU-01` campaign unit is approved or replace it before campaign schema work begins.

**Exit evidence:** Gate G0 approval and accepted ADRs are linked from the repository.

### F0-02 — Establish repository metadata and guardrails

- Add the root workspace manifest, pinned package manager, Node version files, strict shared TypeScript configuration, editor settings, `.gitignore`, `.env.example`, ownership/contribution notes, and root scripts.
- Configure workspace dependency boundaries so domain code cannot import UI, provider SDKs, web framework code, or job-runner APIs.
- Adopt one formatter and one lint configuration; make generated files and migrations explicit.
- Add a secret-scanning rule and prohibit committed local environment files, credentials, customer exports, and production fixtures.
- Record the [optional contributor-tool inventory](CONTRIBUTOR_TOOLING.md) for database, Vercel, source/CI, design, browser, documentation, and observability work. Prefer official/provider-maintained MCPs or reviewed skills/plugins, begin read-only and project-scoped, and keep private MCP configuration outside the repository and outside `pnpm verify`. An installed connector is never a provider-selection decision, account-readiness signal, or production authorization; the accepted Supabase/PostgreSQL database cannot be substituted with Neon or another tool merely because its connector is available.

**Exit evidence:** a clean checkout identifies the required runtime/toolchain and rejects an intentional forbidden import and secret fixture; contributors without private MCP/plugin configuration can run the same repository verification contract.

### F0-03 — Create execution units and shared packages

- Initialize `apps/web` with the App Router and a minimal authenticated/public route split.
- Initialize the distinct `apps/jobs` source boundary against stable Vercel Workflow and expose it through `DurableWorkPort`; if the Workflow compiler requires a web-app entry, keep the entry thin and retain workflow/step source plus provider directives outside domain/application packages. Do not add WorkflowAgent, AI SDK, direct Queues, or beta-only features.
- Create the packages shown in the repository shape with explicit public exports.
- Add a release/build identifier shared by web, jobs, migrations, prompts, and telemetry.
- Do not add feature screens, real adapters, production prompts, or campaign/lead behavior.

**Exit evidence:** both execution units build against the same application/domain contracts and contain no real side-effect path.

### F0-04 — Implement typed configuration and secret boundaries

- Validate environment variables at process startup with separate server-only and client-safe schemas.
- Make invalid, missing, or mutually incompatible settings fail before work is accepted.
- Ensure only explicitly allow-listed `NEXT_PUBLIC_*` values can enter browser bundles.
- Redact secrets and lead PII from logs, errors, traces, test snapshots, and job payloads.
- Define a credential-encryption interface for approved future/booking integrations; do not store tenant OAuth/calendar tokens as ordinary environment variables. No WhatsApp/Meta token exists in the initial MVP.

**Exit evidence:** configuration tests cover valid local/test values, missing secrets, accidental client exposure, and redaction.

**Implementation record — 17 July 2026:** Typed client/server configuration, Phase 0 fail-closed settings, secret/Lead-PII redaction, startup wiring, configuration tests, and the future credential-envelope port are implemented. Tests are authored but not yet executed; no provider, credential, database connection, or live effect is enabled by this record.

### F0-05 — Establish PostgreSQL and migration discipline

- Configure isolated local and test databases with synthetic seed data only, using the ORM/query/migration tool selected in the accepted OD-025 ADR.
- Create the first migration for identity/tenancy primitives, append-only audit events, idempotency records, webhook inbox, and transactional outbox only after OD-016/OD-025 and that tooling choice are accepted.
- Require Organization/Workspace scope on all customer-owned rows and compound tenant-aware references where feasible.
- Provide migration create/apply/status/reset commands and a production forward-fix/expand-contract policy.
- Add automated two-tenant isolation, transaction, unique-constraint, outbox/inbox, and concurrent-transition tests.

**Exit evidence:** an empty database migrates cleanly; two-tenant attacks fail; a repeated logical command cannot create a duplicate effect intent.

**Implementation record — 17 July 2026:** The code-first Drizzle package, identity/tenancy foundation schema, compound tenant references, project-owned RLS role/policies, append-only audit guard, idempotency/inbox/outbox records, guarded synthetic reset/seed commands, migration status command, and real-PostgreSQL isolation/concurrency tests are authored. Generated migrations are committed separately from schema source. No migration or test has been run against the new Supabase development project by this record; its MCP remains read-only and no real Lead data is authorized.

### F0-06 — Establish identity, actor, and support-access seams

- Integrate the accepted managed identity provider in local/test mode.
- Define User, Organization, Workspace, Membership, owner/staff/internal-operator roles, and explicit system principals.
- Require `TenantContext`, actor, correlation ID, and request/job origin on every state-changing application command.
- Make internal support access purpose-bound, time-bound, least-privilege, and auditable.

**Exit evidence:** allow/deny tests cover unauthenticated, wrong-workspace, revoked membership, support-access expiry, and background-job context loss.

### F0-07 — Create governance and external-action primitives

- Define append-only audit-event, domain-event, outbox, inbox, policy-decision, approval-reference, pause, and idempotency contracts.
- Define stable error/reason codes and compare-and-set transition behavior.
- Provide deterministic clocks, IDs, hashes, and tenant fixtures for tests.
- Create a shared external-action command pipeline stub that always denies real actions in Phase 0.

**Exit evidence:** tests demonstrate audit immutability, outbox atomicity, duplicate-request replay, conflicting key rejection, and emergency-pause precedence.

### F0-08 — Define approved ports, future seams, and deterministic fakes

- Create narrow typed ports for model, booking/calendar, object storage, durable jobs, product analytics, and observability. Social publishing/messaging may exist only as documented future interface seams under ADR-0019 and are not wired into composition.
- Define normalized success, retryable, permanent, ambiguous, rate-limit, authentication, and policy failure semantics for approved adapters; define actor/evidence/verification states for manual channel records.
- Build deterministic in-memory/local fakes with recorded receipts, controlled time, failure injection, and duplicate delivery for approved adapters. Do not build a Meta fake that can be mistaken for current behavior.
- Write contract tests that approved future adapters must pass and boundary tests proving Meta channel adapters/configuration are absent.

**Exit evidence:** the foundation smoke test completes only through fakes, and no real network credential is present or required.

### F0-09 — Establish observability and usage contracts

- Define correlation propagation from request to command, job, model, approved adapter/webhook, manual evidence record, audit, and booking-provider receipt.
- Define privacy-filtered structured log, metric, trace, product-event, AI-usage, capacity, and manual-work/evidence envelopes.
- Add test assertions preventing secrets and disallowed PII from telemetry.
- Wire local/test sinks; real Sentry/PostHog/OTel configuration follows accepted OD-027/OD-028 but waits for the OD-033 provider/legal evidence gate and passing privacy canaries.

**Exit evidence:** one synthetic command can be traced across fake boundaries with a single correlation ID and no sensitive payload leakage.

### F0-10 — Establish test harnesses and CI

- Add the test layers and CI workflows in Sections 7 and 8.
- Make `pnpm verify` the required local aggregate command. In CI, allow its subcommands to run as the required split job set in Section 8; that complete green job set is the canonical CI equivalent and must cover every `pnpm verify` stage exactly once or by an explicitly documented overlap.
- Add deterministic database/service startup and teardown; no test may depend on execution order.
- Store only synthetic fixtures. Live provider tests require an explicit flag, sandbox credentials, and a non-customer test tenant.

**Exit evidence:** a clean CI run passes; seeded safety failures fail the correct job; rerunning CI produces the same result.

### F0-11 — Establish environments and release path

- Configure local/test boundaries and document the preview, staging, and production contracts approved by OD-017/OD-035. Creating a provider project/account or paid shared environment requires separate authorization; production creation/enablement remains blocked by OD-033.
- Preview uses isolated data and fake/sandbox adapters; it receives no production credentials and cannot contact real leads.
- Staging, if separately authorized, uses synthetic data only, dedicated sandbox accounts, and test sinks; it cannot contact real Leads or emit production telemetry before OD-033.
- Production deployment remains manually approved and disabled until the later release gate.
- Add typed `vercel.ts` configuration, use Fluid Compute/Node.js in `bom1` rather than an Edge-specific design, and manage values with `vercel env`; the exact Node version follows OD-037.

**Exit evidence:** environment matrices are documented, preview cannot reach production resources, and rollback/forward-fix responsibilities are named.

### F0-12 — Document operation and handoff

- Write contributor setup, architecture map, migration policy, environment runbook, secret-rotation procedure, test-data policy, CI troubleshooting, and release/rollback outline.
- Link each approved ADR and record owners for CI, data, security, incidents, and vendor accounts.
- Document the accepted two-operator/founder escalation model, daily 10:00–20:00 IST window, median ≤15/p95 ≤30-minute in-window lead response, critical/operational/routine support targets, outside-hours no-WhatsApp-observation/receipt boundary, and initial 10-Workspace cap. The live rota itself is a pre-activation operational artifact, not a foundation prerequisite.
- Record remaining dependent blockers in `OPEN_DECISIONS.md` and prevent their stories from entering implementation.

**Exit evidence:** a second contributor can bootstrap and run verification from the documentation without oral steps or production access.

## 6. Development command contract

These are the exact **proposed root command names** Phase 0 must provide. They are not currently available and must not be run until the founder signs Gate G0 and Phase 0 setup begins.

| Command | Required behavior |
|---|---|
| `pnpm install` | Initial approved dependency resolution; commit the resulting lockfile |
| `pnpm install --frozen-lockfile` | Reproducible install for clean checkouts and CI |
| `pnpm dev` | Run web, approved job dev runtime, and local dependency checks without real external effects |
| `pnpm dev:web` | Run only the web unit |
| `pnpm dev:jobs` | Run only the fake/local or approved durable-job unit |
| `pnpm db:up` / `pnpm db:down` | Start/stop isolated local PostgreSQL |
| `pnpm db:generate` | Generate migration/schema artifacts without applying production changes |
| `pnpm db:migrate` | Apply local/test migrations |
| `pnpm db:status` | Report migration state without secrets |
| `pnpm db:reset:test` | Recreate test DB and load synthetic fixtures; refuse production URLs |
| `pnpm env:check` | Validate names, types, environment compatibility, and client/server exposure without printing values |
| `pnpm format` / `pnpm format:check` | Write/check formatting |
| `pnpm lint` | Enforce lint and module-boundary rules |
| `pnpm typecheck` | Type-check every workspace with strict settings |
| `pnpm test:unit` | Run pure domain/config/policy tests |
| `pnpm test:integration` | Run PostgreSQL, tenancy, outbox/inbox, concurrency, and application tests |
| `pnpm test:contract` | Run all provider-neutral adapter contracts against fakes |
| `pnpm test:ai` | Run offline structured-output and safety fixtures; no paid model call by default |
| `pnpm test:e2e` | Run browser/API smoke tests using synthetic tenants and fake adapters |
| `pnpm build` | Build every deployable unit and package |
| `pnpm verify` | Run env check, format check, lint, typecheck, unit, integration, contract, offline AI, build, and smoke E2E in the documented order |

### Proposed first-time preflight, after signed Gate G0

```sh
node --version
pnpm --version
git --version
docker --version
```

OD-017 accepts Vercel. At implementation time, verify the current CLI release from official documentation and install/upgrade it before project setup; **do not run this during the current planning task**:

```sh
pnpm add -g vercel@latest
vercel --version
```

`npm i -g vercel@latest` is the equivalent npm command. Pin application dependencies in the repository even though the operator CLI is upgraded separately.

## 7. Testing setup

| Layer | Scope | Phase 0 minimum | External calls |
|---|---|---|---|
| Unit | Domain state machines, policy, approval/idempotency primitives, config/redaction | Fast and deterministic; clocks/IDs injected | None |
| Integration | PostgreSQL constraints, transactions, tenant isolation, outbox/inbox, concurrent transitions | Real isolated PostgreSQL; two-tenant adversarial fixtures | None |
| Contract | AI/calendar/storage/jobs/telemetry ports; Meta seams remain unwired | Common suite against deterministic fakes plus boundary test that no Meta adapter/config exists | Fake by default; approved sandboxes in separate workflow |
| AI evaluation | Schema validity, citation/fact allow-list, injection, abstention/escalation | Offline fixtures and recorded synthetic outputs | None in PR CI |
| Security | Tenant escape, auth denial, webhook replay, SSRF/upload seams, secret/PII leakage | Release-blocking tests for every implemented boundary | None |
| End to end | Sign-in/test actor → workspace → denied fake external action → audit trace | One smoke journey using synthetic data | Fake only |
| Live sandbox | Provider auth/contract drift | Not a PR requirement; manual or scheduled after provider approval | Approved sandbox only |

Testing rules:

- Production data, phone numbers, tokens, messages, documents, and exports are prohibited in fixtures and snapshots.
- Every external-action test covers success, retryable failure, permanent failure, ambiguous result, duplicate delivery, cancellation/pause, and wrong tenant where applicable.
- PR AI tests use fixed outputs. Paid live-model evaluations run manually or on a controlled schedule with an explicit budget and no PII.
- Flaky tests are defects; they cannot be silently retried to green. A quarantined test must have an owner, issue, and expiry date.
- Coverage percentage alone is not a release gate. The listed security and business invariants are.

## 8. CI setup

Create these workflows only after signed Gate G0; OD-035 is accepted but does not by itself authorize scaffolding. Pull-request CI may split `pnpm verify` for isolation and parallelism; branch protection is green only when the complete required job set below passes, and a policy test must prove every stage named by `pnpm verify` is assigned to that set. A scheduled/manual provider-sandbox job requires separate provider-task authorization, is additional evidence, and is not part of the offline `pnpm verify` contract.

| Workflow/job | Trigger | Required work |
|---|---|---|
| `ci-policy` | Every pull request | Secret scan, forbidden-file check, lockfile/package policy, dependency boundary check, docs/link check |
| `ci-verify` | Every pull request and protected-branch push | Pinned Node/pnpm, frozen install, env validation, format, lint, types, unit, offline AI, build |
| `ci-integration` | Every pull request | Isolated PostgreSQL, migrations from empty, integration/tenant/concurrency/outbox tests |
| `ci-contract` | Every pull request | Run the provider-neutral adapter contract suite against deterministic fakes; no credentials or network access |
| `ci-e2e` | Pull request after build | Synthetic app plus fake jobs/adapters; critical browser/API smoke |
| `provider-contracts` | Manual/scheduled after provider approval | Staging/sandbox credentials only; contract drift without customer actions |
| `release` | Protected tag/manual approval | Re-run gates, migration rehearsal, artifact provenance, staging smoke, explicit production approval; initially disabled |

CI requirements:

- Use least-privilege GitHub permissions; untrusted pull requests receive no secrets.
- Cache dependencies by lockfile, not build outputs containing environment data.
- Give each run a unique test database/schema and synthetic tenant namespace.
- Upload failure artifacts only after redaction; set a retention period.
- Do not run production migrations from ordinary PR CI.
- Require `ci-policy`, `ci-verify`, `ci-integration`, `ci-contract`, and `ci-e2e` in branch protection.
- Require review for workflow, migration, auth, tenancy, policy, approval, integration, and secret-handling changes.
- Add preview deployment only after checks pass; previews use fake/sandbox adapters and isolated storage.

## 9. Environment-variable plan

### 9.1 Rules

- `.env.example` contains names, descriptions, and non-secret placeholders only.
- `.env.local` and provider-generated local files are ignored. CI supplies test values from its isolated secret store.
- Only an explicit client schema may expose `NEXT_PUBLIC_*`; everything else is server-only.
- Application/provider credentials are separated by local, preview, staging, and production. No production key is copied into preview or local.
- Approved tenant OAuth/calendar access tokens are stored as encrypted tenant credentials with key references; they are not shared environment variables. No Meta/WhatsApp token exists in the initial inventory.
- Rotation, owner, source of truth, environments, and last verification date are documented for each secret.
- Tests must prove environment validation never prints values.

### 9.2 Canonical variable inventory

Names are the proposed application contract. Remove variables for rejected providers and add provider-specific names only with the corresponding ADR.

| Group | Proposed variables | Secret? | Notes |
|---|---|---|---|
| Runtime | `APP_ENV`, `APP_BASE_URL`, `RELEASE_ID`, `LOG_LEVEL` | No | Validate allowed environment and HTTPS outside local |
| Public web | `NEXT_PUBLIC_APP_BASE_URL`, approved auth publishable key, approved product-analytics public key/host | Mixed; public-only | No server secret may use `NEXT_PUBLIC_` |
| Database | `DATABASE_URL`, `DATABASE_DIRECT_URL`, `DATABASE_SHADOW_URL` | Yes | Separate values per environment; reset scripts reject non-test hosts |
| Auth | `AUTH_PROVIDER=supabase`, Supabase project URL, publishable key, server secret/admin key, JWT issuer/audience where required, and auth webhook secret if used | Mixed | Use current provider-supported variable names at implementation; only the publishable key/project URL may be client-visible; server/admin keys never enter browser, preview, logs, or prompts. Essential invite/passwordless email is authentication transport only, never marketing/Lead automation; production SMTP/provider configuration remains absent until selected and passed under OD-033. |
| Credential encryption | `CREDENTIAL_KMS_KEY_ID` or `CREDENTIAL_ENCRYPTION_KEY` | Yes | Prefer managed KMS/key reference in production |
| Durable jobs | `JOBS_PROVIDER=vercel_workflow`, release/workflow environment identifiers required by the stable pinned SDK, and no speculative API URL/project/signing secret | Mixed | Prefer Vercel OIDC/platform identity; add only variables proven necessary by the OD-024 spike, never workflow secrets in browser/prompts |
| AI | `AI_PROVIDER=openai`, `OPENAI_API_KEY`, approved OpenAI project/organization identifiers if required, versioned task-policy/model identifiers, and `AI_MAX_COST_PER_CAMPAIGN` | Mixed | Direct Responses under ADR-0023; no Gateway key; all secrets server-only and production task bindings must be evaluated |
| Object storage | `OBJECT_STORAGE_PROVIDER`, `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_REGION`, `OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_ACCESS_KEY_ID`, `OBJECT_STORAGE_SECRET_ACCESS_KEY` | Mixed | Private bucket; separate per environment |
| Social/Meta/WhatsApp API | **None in initial MVP** | N/A | ADR-0019 prohibits provider/app IDs, secrets, OAuth, webhook tokens, and send/publish configuration until a new accepted re-entry ADR |
| Calendar app | `CALENDAR_PROVIDER`, `CALENDAR_CLIENT_ID`, `CALENDAR_CLIENT_SECRET`, `CALENDAR_WEBHOOK_SECRET` | Mixed | Tenant grants/tokens stored encrypted |
| Observability | `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `POSTHOG_KEY`, `POSTHOG_HOST`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS` | Mixed | Enable only privacy-approved fields/sampling |
| Inbound protection | `WEBHOOK_INGRESS_SECRET`, `CRON_SIGNING_SECRET`, `INTERNAL_JOB_SIGNING_SECRET` | Yes | Prefer provider-specific signatures; rotate separately |
| Testing | `TEST_DATABASE_URL`, `USE_FAKE_ADAPTERS`, `LIVE_PROVIDER_TESTS` | Mixed | `USE_FAKE_ADAPTERS=true` and live tests false by default |

### 9.3 Environment matrix

| Environment | Data | Adapters | Secrets | Outbound effect |
|---|---|---|---|---|
| Local | Synthetic | Fake | Developer-local, non-production | Denied by default |
| Test/CI | Per-run synthetic | Fake | CI test-only | Denied |
| Preview | Isolated synthetic | Fake; separately authorized sandbox only | Preview-only | Denied except explicit sandbox tests |
| Staging | Synthetic only | Separately authorized provider sandbox/test accounts | Staging-only | Test accounts only; no real Lead contact |
| Production | OD-033-approved customer/Lead data only | OD-033-approved real adapters | Production-only managed store | Disabled until founder live-readiness `GO`; then allowed only through policy/approval/idempotency pipeline |

Manage environment-scoped values with `vercel env`; do not commit `.vercel` environment files or pull production secrets to a developer laptop. Use `vercel.ts` with `@vercel/config` rather than `vercel.json`.

## 10. Phase 0 completion checklist

### Decisions and documentation

- [ ] Gate G0 is signed and every **YES — main build** decision is accepted or amended.
- [ ] Accepted ADRs for OD-015 through OD-017, OD-023 through OD-030, and OD-035 through OD-037 are linked; their required spikes have owners and gate dates.
- [ ] Runtime/package versions and official-document verification dates are recorded.
- [ ] Setup, architecture, migration, environment, test-data, CI, release, rollback, and secret-rotation documentation exists.

### Repository and commands

- [ ] Proposed repository modules exist with enforced import boundaries.
- [ ] Exact Node and pnpm versions plus the lockfile are committed.
- [ ] A clean checkout succeeds with documented bootstrap instructions.
- [ ] Every command in Section 6 exists and behaves as documented.
- [ ] `pnpm verify` passes locally, and the complete required split CI job set covers the same stages with an equivalent pass/fail result.

### Security and data

- [ ] Managed authentication and the approved role model work in local/test mode.
- [ ] Every customer-owned record and command requires tenant context.
- [ ] Two-tenant adversarial tests fail closed at service and data layers.
- [ ] Audit, outbox, inbox, idempotency, pause, and correlation primitives pass concurrency/replay tests.
- [ ] Secrets/client variables are separated, redacted, and scanned.
- [ ] No production data or credential is present in local, test, preview, fixtures, logs, or snapshots.

### Testing and CI

- [ ] Unit, integration, contract, offline AI, security, build, and smoke E2E suites pass.
- [ ] All external ports have deterministic fakes and shared contract tests.
- [ ] Required CI checks and branch protection are enabled.
- [ ] PR/preview workflows cannot access production secrets or make real customer-facing actions.
- [ ] Empty-database migration and documented forward-fix/rollback rehearsal pass.

### Operations and handoff

- [ ] Correlation and privacy-safe telemetry work through the fake end-to-end path.
- [ ] Environment owners and secret/provider account owners are named.
- [ ] Preview, staging, and production boundaries are documented and tested in proportion to what exists.
- [ ] Service-window, alert-severity, response-target, rota/escalation, and admission-cap contracts from OD-014 are represented in configuration/runbook seams without claiming the live team is staffed during foundation work.
- [ ] A second contributor can run the clean-checkout verification without oral steps.
- [ ] No Business Brain, campaign, publish, message, booking, billing, or other real feature has leaked into Phase 0.

## 11. Definition of done

Phase 0 is complete only when every applicable checklist item is evidenced in a pull request, the required CI checks pass, the founder accepts Gate G1 in `ROADMAP.md`, and the foundation cannot perform a real external action.

The recommended first implementation task after approval is **FND-001: establish the pinned repository/toolchain and one reproducible `pnpm verify` quality gate using fake/local dependencies only**. Do not begin `BRN-*` or any provider adapter until FND-001 and its decision dependencies are complete.
