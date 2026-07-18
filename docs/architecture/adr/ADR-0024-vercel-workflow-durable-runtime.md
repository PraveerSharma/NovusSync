# ADR-0024: Vercel Workflow as the Durable Runtime

## Status

Accepted under founder-delegated technical direction — 14 July 2026

## Context

The product needs reliable work that outlives a web request: website ingestion, AI generation, media rendering, manual due-work reminders, booking webhook reconciliation, conversion-tail waits, analytics aggregation, weekly memos, retries, and recovery. OD-015 accepts a modular monolith with web/API and durable-work execution units; OD-017 accepts Vercel for web/API and delegates the durable runtime here.

The runtime must survive crashes and deployments, retry bounded steps, sleep without holding compute, expose run state, preserve version behavior, and support cancellation/pause semantics. It must not become the system of record or bypass domain commands. The small team and 10–50-Workspace stage favor a managed system with low operational burden.

Vercel announced Workflow as generally available in April 2026 and documents durable steps, suspension, version preservation, and built-in observability within the existing Vercel deployment. Inngest and Trigger.dev also document durable retries, checkpointed steps, idempotency, scheduling, and concurrency controls. They remain credible alternatives, but each adds another vendor/control plane.

## Options considered

| Option | Benefits | Costs and risks | Appropriate when |
|---|---|---|---|
| Vercel Workflow SDK | Same accepted platform/repo; GA durable steps/sleep/versioning/observability; minimal setup | Vercel coupling; workflow journal governance; some advanced controls must remain product-owned | Current Vercel deployment is compatible and passes privacy/cost spike |
| Inngest | Mature event/step model, retries, waits, concurrency keys, self-host path | Added service, keys, function invocation/data plane, provider review | Vercel Workflow fails requirements or cross-platform execution is needed |
| Trigger.dev | Strong task/queue/idempotency/retry developer experience and dedicated workers | Added service/runtime, deployment and provider review | Heavy/background compute or queue controls exceed Workflow fit |
| Vercel Queues directly | Lower-level durable event delivery and concurrency | More queue plumbing; beta status on decision date; no high-level stateful flow | Event fan-out/routing is the primary problem |
| BullMQ + Redis | Familiar queue and explicit control | Redis operations, worker deployment, scheduling/recovery burden | Team already operates Redis/workers |
| Temporal | Deep workflow semantics and visibility | High conceptual/operational cost for the MVP | Complex long-lived distributed workflows justify it |
| Database polling/cron only | Few vendors and visible state | Custom leasing/retry/scheduling/observability; easy failure gaps | Very small non-critical periodic tasks only |

## Decision

### 1. Runtime

Use the stable generally available Vercel Workflow SDK as the initial durable runtime, deployed with the accepted Vercel application. Workflow and step code remains in the TypeScript monorepo as a distinct durable-work execution unit sharing application/domain packages, not as a separately owned microservice.

Use versioned workflows for:

- bounded multi-step ingestion, model, and media pipelines;
- human due-work scheduling and conversion-tail waits;
- booking event reconciliation and discrepancy handling;
- analytics aggregation and weekly/close-out reports;
- repair/reconciliation operations that require durable progress.

Vercel Cron may trigger a versioned idempotent workflow for recurring work. Cron itself cannot own multi-step state or retry policy.

### 2. Product database is authoritative

The product database owns `WorkflowIntent`, domain/workflow state, due work, pause/cancel/takeover state, idempotency/effect records, attempts, normalized receipts, terminal outcomes, and audit events. Vercel's workflow event journal is execution infrastructure and observability, not customer-visible business truth.

A state-changing transaction writes its domain change and a versioned transactional-outbox intent together. An outbox dispatcher starts the workflow with a deterministic operation key and reconciles the returned run identifier. Duplicate dispatch or callback cannot create another logical operation.

Workflow input contains opaque identifiers, version numbers, purpose, correlation, and minimal non-sensitive control metadata. A step loads current authorized data from the product database. Do not journal raw lead conversations, secrets, full Business Brain snapshots, media, or unnecessary PII.

### 3. Workflow and step boundaries

Workflow bodies orchestrate deterministic control flow. All external I/O, model calls, database commands, rendering, and provider calls occur in explicit stable steps. Each step:

- accepts and returns a small versioned serializable contract;
- has explicit timeout, retry classification, maximum attempts, and backoff;
- uses a product-owned idempotency/effect key before any state change or provider call;
- rechecks Workspace membership/system purpose and current pause/cancel/takeover/tail/consent/policy state;
- records normalized success/failure/receipt evidence in the database;
- can be replayed or redelivered without duplicating the logical effect.

Workflow durability does not mean exactly-once provider effects. Ambiguous external results enter reconciliation; they are not blindly retried.

### 4. Cancellation and stale work

Use accepted stable SDK cancellation features only after the pinned-toolchain spike proves them. Independently of vendor cancellation, every step checks product state before doing work and before committing output. A campaign/workspace pause, cancellation, opt-out, takeover, expired tail, superseded version, or revoked approval makes the step terminate or record suppressed/stale work.

An in-flight external call may complete after cancellation. Its result must pass current-state reconciliation and cannot revive obsolete work. Beta-only in-flight cancellation is not an MVP dependency.

### 5. Concurrency and rate control

Do not depend solely on runtime concurrency. Product-level admission, database leases/unique constraints, and provider/task budgets control:

- per-Workspace campaign generation and reconciliation;
- global/operator/service capacity;
- provider/model rate and cost limits;
- serial handling of conflicting state transitions.

No ordering guarantee from infrastructure substitutes for domain version/precondition checks.

### 6. Excluded initial features

Do not initially use:

- `WorkflowAgent`, Vercel AI SDK, or AI Gateway—the direct OD-023 `ModelPort` is called inside a durable step;
- Vercel Queues directly;
- Workflow SDK beta packages/features;
- Trigger.dev, Inngest, BullMQ/Redis, Temporal, or a custom database-polling engine;
- workflow public hooks as an authorization boundary for provider/customer actions.

Provider webhooks first enter the verified webhook inbox and product transaction boundary; they then create/resume product workflow work by identifier.

### 7. Required pre-foundation spike

With the pinned OD-037 Node/package/framework versions and isolated fake data, prove:

- start from a committed outbox intent and duplicate-start reconciliation;
- step retry/backoff, terminal failure, and operator-visible recovery;
- durable sleep/wake and a service-window/tail example;
- deployment version preservation for an in-progress run;
- pause/cancel/superseded-version behavior at step boundaries;
- local and CI testing without production services or real side effects;
- dashboard/run correlation with application ids and redacted payloads;
- selected region, workflow-state storage/retention, export/deletion, limits, and cost assumptions;
- no direct dependency on AI SDK/WorkflowAgent or beta-only features.

Failure of a critical item reopens this decision. Compare Inngest first because its event/step model, Vercel deployment integration, retries, waits, and tenant-keyed concurrency are the closest alternative fit.

## Invariants

- A web request never relies on an unawaited promise for required work.
- Domain change and workflow intent are committed atomically through the outbox.
- Product database state, not the workflow journal, determines what may happen.
- Every step and provider effect has a product-owned idempotency/reconciliation key.
- Every step checks current tenant/policy/lifecycle state before effect and commit.
- Workflow inputs and journaled outputs contain minimal classified data and no secrets.
- A retry cannot silently change model, prompt, content, booking, or approval version.
- Cron can trigger work but cannot replace durable state/retries.
- Manual Instagram/WhatsApp execution remains human due work; Workflow never publishes or sends it.

## Consequences

### Positive

- One deployment/vendor control plane for the small team.
- Durable retry, sleep, versioning, and observability without Redis/worker operations.
- Clear split between execution mechanics and authoritative domain state.
- Existing application modules and direct OpenAI adapter remain reusable.
- Outbox and idempotency rules preserve a later runtime migration path.

### Negative

- Workflow code and operational tooling are initially Vercel-coupled.
- Product-level leases and budgets are still required for tenant/provider flow control.
- Workflow journal data adds retention, residency, and incident scope.
- A runtime migration would need active-run draining or translation.
- The GA product is newer than Trigger.dev/Inngest and requires a deliberate spike.

### Mitigations

- Keep domain/application commands independent of workflow directives/packages.
- Store minimal run references and authoritative checkpoints in PostgreSQL.
- Wrap start/inspect/cancel behind a narrow `DurableWorkPort` for tests and fallback.
- Pin stable versions and reject beta-only production dependencies.
- Rehearse stuck/failed/run-version recovery before real data.

## Revisit triggers

Revisit this ADR when:

- the pre-foundation spike fails a critical requirement;
- OD-027/OD-033 rejects workflow-state processing, region, retention, terms, or subprocessors;
- cost/limits violate OD-032 or observed campaign workloads;
- required tenant concurrency, scheduling, event wait, or operator repair behavior cannot be implemented safely;
- Vercel runtime coupling blocks the accepted deployment or test strategy;
- repeated heavy compute requires a dedicated worker/task platform.

## Official sources reviewed

- [Vercel: Workflow general availability and programming model](https://vercel.com/blog/a-new-programming-model-for-durable-execution)
- [Vercel Workflows product documentation](https://vercel.com/workflows)
- [Vercel Queues and Workflow comparison](https://vercel.com/docs/queues/concepts)
- [Vercel Queues delivery, region, idempotency, and retry semantics](https://vercel.com/docs/queues)
- [Inngest durable functions](https://www.inngest.com/docs/learn/inngest-functions)
- [Inngest execution model](https://www.inngest.com/docs/learn/how-functions-are-executed)
- [Inngest concurrency controls](https://www.inngest.com/docs/guides/concurrency)
- [Trigger.dev tasks](https://trigger.dev/docs/tasks/overview)
- [Trigger.dev idempotency](https://trigger.dev/docs/idempotency)

## Related decisions

- OD-010: exact approval and stale-work suppression
- OD-014: service hours and operator coverage
- OD-015 / ADR-0015: modular monolith and durable execution unit
- OD-017 / ADR-0017: Vercel deployment
- OD-019 / ADR-0019: manual WhatsApp due work only
- OD-020 / ADR-0020: booking reconciliation
- OD-023 / ADR-0023: direct OpenAI `ModelPort`
- OD-025: outbox, persistence, and audit architecture
- OD-027: workflow data privacy/retention/residency
- OD-032: capacity and budget
- OD-033: provider terms/subprocessors
- OD-037: pinned compatible toolchain
