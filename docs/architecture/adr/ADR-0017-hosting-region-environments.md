# ADR-0017: Vercel Pro web/API in Mumbai with isolated environments

## Status

Accepted under founder-delegated technical direction — 14 July 2026

## Context

OD-015 establishes one modular application with web/API and durable-worker execution units. OD-016 selects Supabase Auth and prefers a compatible Mumbai data project. The Bengaluru-first pilot begins with 10 live Workspaces, has a small engineering/operations team, and benefits more from managed deployment and fast rollback than from operating virtual machines or Kubernetes.

The web surface must serve authenticated owner/operator pages, public campaign landing/forms, approved-provider OAuth callbacks, and verified webhook ingress. Slow generation, due-work reminders, booking reconciliation, and reports require durable work and cannot depend on a request staying open. [ADR-0019](ADR-0019-defer-meta-api-integrations.md) subsequently deferred all Meta API publishing/messaging, so this hosting decision does not authorize Meta callbacks or dispatch.

Official documentation reviewed on 14 July 2026:

- [Vercel global network and regions](https://vercel.com/docs/regions)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Fluid Compute](https://vercel.com/docs/fluid-compute)
- [Vercel environments](https://vercel.com/docs/deployments/environments)
- [Vercel pricing](https://vercel.com/pricing)
- [Vercel Data Processing Addendum](https://vercel.com/legal/dpa)
- [Supabase project regions](https://supabase.com/docs/guides/platform/regions)

## Options considered

| Option | Advantages | Costs and risks | Decision |
|---|---|---|---|
| Vercel Pro plus managed data/jobs | Best fit for the proposed Next.js web surface, previews, custom staging, managed scaling, rollback, and Mumbai function region | Usage pricing and vendor constraints; primary/global processing means no strict India-only residency promise; not a durable-worker host | Selected for web/API |
| Another PaaS/container platform | More control over process shape and potentially clearer regional boundaries | More deployment, scaling, patching, networking, and preview work before product evidence | Keep as exit option |
| Single VM | Simple cost model and full process control | Key-person operations, patching, scaling, backups, weak previews, larger blast radius | Rejected for MVP |
| Kubernetes/cloud-native services | Maximum topology/control | Far beyond current team, scale, and operational need | Rejected |
| Global/multi-region dynamic compute | Lower latency and regional resilience | Cross-region data consistency, failover, cost, and residency ambiguity | Rejected initially |

## Decision

Use a Vercel Pro project for the web/API deployment if OD-037 confirms the Next.js/Node baseline. Enable Fluid Compute and pin dynamic Node functions to Mumbai (`bom1`, mapped by Vercel to AWS `ap-south-1`), colocated with the selected Mumbai Supabase production project.

Vercel owns:

- the web UI and server-rendered application;
- authenticated application API endpoints;
- public campaign landing pages and short-lived form-submit handlers;
- OAuth callbacks;
- webhook ingress that verifies, writes an idempotent inbox record, enqueues durable processing, and returns promptly;
- static assets and non-personal public-page delivery.

Vercel does not own:

- long-running/scheduled campaign generation, publishing, messaging, booking reconciliation, or retention workflows;
- the authoritative job state;
- the relational system of record or private object store;
- retries that depend on a request remaining alive;
- secrets or tenant access tokens in browser bundles.

Use these environments:

1. `local`: local services/fakes and synthetic data; no production credentials.
2. `test`: ephemeral/CI services and deterministic fakes.
3. `preview`: Vercel Preview deployments with isolated test data/fake or explicitly safe sandbox adapters; no real lead contact.
4. `staging`: the one Vercel Pro custom environment, dedicated Mumbai non-production Supabase project, sandbox provider accounts, and production-like job/telemetry configuration.
5. `production`: dedicated Mumbai Supabase project, production providers/secrets, manual promotion, and rollback/forward-fix runbook.

Environment secrets, OAuth callbacks, webhooks, databases, buckets, job projects, and provider accounts must be isolated. Configuration validates `APP_ENV` and resource identity at startup; production workers reject non-production resources and non-production code rejects production resources.

Operational constraints:

- Authenticated, lead, and operator responses use private/no-store caching. No personal data is placed in CDN cache keys, static generation payloads, build output, or public asset URLs.
- Logs, error messages, and traces are allow-listed/redacted and cannot contain message bodies, credentials, raw webhooks, auth tokens, or unnecessary lead fields.
- Function handlers have short application deadlines and enqueue durable work. Longer Vercel function limits are not a replacement for OD-024.
- Single-region dynamic compute is the default. Do not enable multi-region execution/failover without a new privacy, consistency, and cost decision.
- Health checks expose dependency status without secrets; upstream failure causes safe degradation/fail-closed action behavior.
- Production use requires Vercel Pro because Hobby is not for the commercial pilot and staging/environment controls are required.

## Data-region statement

This decision places dynamic application compute and the proposed primary database in Mumbai. It does **not** claim strict India-only data residency. Vercel's current DPA states that primary processing facilities are in the United States and backups may be globally replicated. OD-027 and OD-033 accept the controlled-cross-border policy, but production remains blocked until the dated OD-033 evidence validates Vercel's actual contract, subprocessor, retention, deletion, and disclosure posture.

If strict India-only processing becomes required, reopen the hosting-provider portion of this ADR and evaluate an India-region container/PaaS or cloud deployment. Keep the application topology and environment-isolation contract.

## Rationale

1. Vercel minimizes web deployment, preview, scaling, and rollback operations for a small team.
2. Mumbai dynamic compute keeps database/auth round trips local for the Bengaluru pilot.
3. A separate durable-work boundary avoids abusing serverless request lifetimes and preserves OD-015 module ownership.
4. Isolated preview/staging/production resources prevent a preview or test from contacting real leads.
5. Single-region production is simpler and makes data-flow analysis more honest at the pilot stage.

## Trade-offs and consequences

- The system uses multiple managed providers and must correlate deployments, jobs, and domain events.
- Vercel usage is metered and must be included in OD-032 budgets/alerts.
- Regional Vercel function outage can reduce dynamic availability; the product fails closed rather than silently executing in an unapproved region.
- Custom staging requires Pro, and production cannot run on the Hobby plan.
- Cross-border/service-generated data remains a legal/privacy consideration despite Mumbai compute.
- Migrating the web/API to another Node-capable platform remains possible but requires deployment, callback, secret, and observability work.

## Revisit triggers

- OD-027/OD-033 reject Vercel's cross-border processing or subprocessor posture.
- OD-037 does not select a Vercel-compatible web/runtime baseline.
- Measured Vercel cost, cold-start/latency, limits, or outage behavior fails the accepted budget/SLO.
- Static/serverless architecture prevents a required connection or workload even after the durable-job boundary is used.
- Strict regional failover or India-only processing becomes a customer/legal requirement.
