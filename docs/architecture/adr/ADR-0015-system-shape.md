# ADR-0015: TypeScript modular monolith with web and worker execution units

## Status

Accepted under founder-delegated technical direction — 14 July 2026

## Context

The MVP is a managed SaaS pilot for 10 initially admitted Workspaces, with evidence-gated growth toward 20 and later 50. It is intended for a solo founder or small engineering team and must support transactional campaign/approval/lead/booking state plus scheduled work, AI generation, approved-provider webhook reconciliation, retries, and audit. [ADR-0019](ADR-0019-defer-meta-api-integrations.md) subsequently narrowed initial channel execution to human Instagram/WhatsApp work and evidence; the durable-worker shape remains useful for AI, due-work reminders, booking, and reporting.

Safety and tenant isolation matter more than independent component scaling. The domain has meaningful business rules, but the expected load does not justify separately owned services. The generic core must remain independent of the yoga pilot pack and provider SDKs.

## Options considered

| Option | Advantages | Costs and risks | Valid when |
|---|---|---|---|
| One Next.js application/process | Fewest initial files and deployments | Long-running/retryable work competes with requests; weak worker isolation; scheduled work becomes provider-specific | Prototype with no durable external workflows |
| TypeScript monorepo, modular monolith, separate web and worker execution units | One language/release train/system of record; explicit modules; durable work isolated without distributed ownership | Requires import-boundary discipline and two runtime shapes | Current MVP and expected 10–50-Workspace stage |
| Separate frontend and backend services | Backend lifecycle can differ from web | Extra API/deployment/auth boundary without a demonstrated need | Multiple clients or independently operated backend team |
| Microservices | Independent deployment/scaling/failure domains | Distributed transactions, contracts, observability, deployments, and incidents exceed current team/scale needs | Clear service ownership, materially different scaling, and a larger engineering team |

## Decision

Use a TypeScript monorepo containing one modular monolith. Build two execution units from the same versioned repository:

1. A web application for customer/operator UI, authenticated API, public forms, OAuth callbacks, and verified webhook ingress.
2. A durable job runtime for scheduled/slow work, retries, reconciliation, and asynchronous workflows.

Both execution units use the same application/domain modules and relational system of record. The worker is not a separately owned microservice and may not duplicate business rules.

Enforce these boundaries:

- Domain/application packages do not depend on Next.js, job-runner APIs, provider SDKs, UI code, prompts, or the yoga pack implementation.
- External providers are reached through narrow ports/adapters and normalized receipts/events.
- Modules own their state transitions; cross-module mutation uses application commands rather than direct table access.
- AI returns typed proposals. Deterministic application services authorize and execute external effects.
- Use synchronous application calls where immediate consistency is needed and a transactional outbox/durable jobs for asynchronous work.
- Do not add microservices, CQRS, event sourcing, or a general repository abstraction by default. An append-only audit/event ledger does not make the system event-sourced.

The exact runtime/package manager/framework versions, job provider, database tool, and hosting provider remain governed by OD-017, OD-024, OD-025, and OD-037.

## Rationale

1. The architecture matches the small engineering team and 10–50-Workspace planning range.
2. Shared transactions and one source of truth simplify the safety-critical approval, consent, quota, booking, and audit invariants.
3. A distinct worker execution unit handles long-running and retryable work without prematurely creating independently owned services.
4. Explicit module and adapter boundaries protect the generic core and leave provider replacement possible where uncertainty is real.
5. Complexity can be added later if measured scaling or team ownership demands it; removing premature distributed boundaries would be harder.

## Trade-offs and consequences

- Deployment units share a release train and database, so one module cannot scale or release fully independently.
- Poor module discipline could turn the monolith into tightly coupled code; automated import rules, ownership tests, and application-command boundaries mitigate this.
- The web and worker may scale independently at the process level, but they remain one logical application.
- Cross-module reporting may use read models, but no second operational source of truth is introduced.
- Provider-specific capabilities may be unavailable through canonical ports until an explicit product decision adopts them.

## Revisit triggers

Reconsider a service extraction only when at least one of these is evidenced:

- a module needs materially different scaling or availability and process-level scaling is insufficient;
- more than one engineering team needs independent ownership and release cadence;
- a provider/security boundary requires independent isolation;
- measured deployments or failures repeatedly couple otherwise independent functions;
- the single relational transaction boundary becomes a demonstrated bottleneck.

Any extraction requires a new ADR naming ownership, data authority, consistency, migration, observability, and rollback consequences.
