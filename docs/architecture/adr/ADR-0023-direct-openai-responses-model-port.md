# ADR-0023: Direct OpenAI Responses Behind a Typed Model Port

## Status

Accepted under founder-delegated technical direction — 14 July 2026

## Context

The MVP needs model-assisted extraction, planning, copy/layout proposals, private lead-response drafts, classification, and learning memos. Accepted decisions require source-grounded typed proposals, deterministic authorization, exact human approval, no live-web business truth, no automatic Meta actions, and durable product-owned state.

The initial team is small and expects 10–50 Workspaces. A multi-provider gateway or general agent framework can improve portability and built-in orchestration, but it also adds provider normalization, data routing, fallback, tracing, and subprocessor behavior before those benefits are evidenced. The application already has a durable workflow boundary under OD-024 and must not use model sessions as its business system of record.

Official documentation reviewed on 14 July 2026 confirms that current OpenAI models are available through the Responses API and support function calling/structured outputs by model, while the OpenAI Agents SDK provides higher-level loops, handoffs, guardrails, sessions, and tracing. Vercel AI Gateway provides unified multi-model access, fallbacks, budgets, and observability. Those capabilities make all three paths viable; they do not make all three necessary for the MVP.

## Options considered

| Option | Benefits | Costs and risks | Appropriate when |
|---|---|---|---|
| Direct OpenAI Responses + official SDK | Small dependency surface; current provider features; explicit request semantics | Initial provider coupling; product must own routing/telemetry contracts | One primary evaluated provider is sufficient |
| OpenAI Agents SDK as the default runtime | Built-in agent loop, tools, handoffs, guardrails, sessions, tracing | Framework state/loop semantics overlap product workflow; default tracing needs privacy review | Several evaluated multi-step agent workflows need those primitives |
| Vercel AI SDK through AI Gateway | Unified providers, budgets, routing, fallbacks, common generation API | Extra data path/subprocessor; normalization gaps; silent routing can violate evaluation | Multi-provider reliability/cost evidence outweighs added governance |
| Direct SDK per provider | Full provider features and explicit behavior | Multiple adapters, inconsistent traces/errors, larger evaluation matrix | Two or more providers are approved and materially necessary |
| One hard-coded model everywhere | Very simple | Poor cost/quality fit, difficult upgrades, weak task-level evaluation | Short-lived prototype only |
| Model-selected/dynamic routing | Potential automatic cost/quality optimization | Nondeterministic model choice and unevaluated fallback | A governed router has its own reliable evaluation evidence |

## Decision

### 1. Initial provider and API

Use OpenAI as the initial text/reasoning provider through the Responses API and official JavaScript SDK. Provider code lives in the integration layer behind an application-owned `ModelPort`; domain and application modules do not import the provider SDK.

The OpenAI API account and billing are separate from any ChatGPT subscription. OD-032 now accepts the aggregate and per-cycle budgets; no production request is permitted until OD-027/OD-030 implementation evidence and OD-033 subprocessor/legal readiness pass.

This decision does not select an image-generation provider. Optional non-factual generated decoration allowed by OD-022 must sit behind a separate image-generation adapter with its own provenance, task evaluation, minimization/retention, cost, and OD-033 provider evidence. Customer-approved or rights-recorded media remains sufficient for the MVP, so the absence of that adapter does not block the accepted campaign loop.

### 2. Application-owned contract

The port accepts a versioned `ModelTaskRequest` containing:

- Workspace, actor/system purpose, correlation, and task-policy identifiers;
- prompt/instruction and structured-output schema versions;
- immutable verified Business Brain/campaign/content input references;
- approved tool allowlist and bounded step/timeout/token budgets;
- required model capabilities and data classification.

It returns a `ModelTaskResult` containing:

- typed candidate output or an explicit refusal/validation/failure result;
- provider/model/config identifiers and provider request identifier;
- prompt/schema/tool-policy/source-snapshot versions;
- token/media usage, latency, retry count, and cost estimate where available;
- validation/evaluation outcomes and trace/correlation identifiers;
- raw-provider metadata only where allow-listed and retention-safe.

Provider responses are candidates. Deterministic application services validate them and authorize any product state transition.

### 3. Structured output and tools

Use strict structured outputs and strict function-tool schemas where supported, followed by application validation. A schema-valid response is not automatically factually correct or policy-safe.

Only narrowly scoped product tools approved for the task may be exposed. MVP model calls cannot use provider built-in web search, file search, computer use, shell, code execution, arbitrary MCP, or external side-effect tools. A model tool may read allowed verified context or return a proposal; it cannot approve content, publish/send, spend, mutate provider scheduling, or bypass a domain command.

### 4. Task-based model policy

Use an application-owned static task-policy registry. As of the decision date, start evaluation with the current GPT-5.6 family:

- GPT-5.6 Terra is the balanced default candidate for ordinary planning, drafting, and extraction;
- GPT-5.6 Sol is a candidate only for complex tasks where the accepted evaluation shows a material quality gain worth its latency/cost;
- GPT-5.6 Luna is a candidate only for low-risk, high-volume classification or transformation tasks that meet the same safety and quality gates.

These are evaluation candidates, not an authorization to use aliases or to route traffic automatically. Production binds each task policy to an evaluated provider model identifier or snapshot where available, reasoning/settings, schema/prompt versions, and budget. A moving alias may be used in development discovery but not silently substituted into a passing production policy.

No model chooses its own model, provider, fallback, or quality tier. A provider failure retries the same idempotent task policy within its budget and then fails closed or queues human work. Fallback to a different model/config requires that exact fallback to have passed the task evaluation and privacy/cost policy.

### 5. State, tracing, and retention

The product database owns domain state, conversation evidence, approvals, workflow progress, and generated material versions. Provider response/session identifiers may help correlate a call but are never authoritative state.

Under the accepted OD-027/OD-028 payload and retention rules, store only the minimal allow-listed application trace metadata needed for debugging and cost/evaluation, and expire it under the approved schedule. Do not enable raw prompt/response export to a provider or third-party trace backend by default. If the Agents SDK is later introduced, its default tracing behavior must be explicitly reviewed, disabled, or replaced with a redacted approved processor as required.

### 6. Deferred runtimes

Do not initially depend on Vercel AI Gateway, Vercel AI SDK, or OpenAI Agents SDK. They remain valid future adapters:

- consider Gateway when approved multi-provider fallback, central budgets, or gateway observability has measured value;
- consider Agents SDK when multiple bounded workflows need its loop/handoff/guardrail/tracing primitives;
- consider AI SDK when a common provider interface provides more value than the application port and direct provider access.

Any adoption must preserve the typed port, task-policy/evaluation binding, product-owned state, tool restrictions, privacy rules, and exact trace metadata.

## Invariants

- Domain/application modules depend on `ModelPort`, not provider packages.
- Every model call has a Workspace, purpose, task policy, source snapshot, budget, and correlation id.
- Every production task/model/config combination is explicitly evaluated and approved.
- No dynamic routing or automatic provider fallback may introduce an unevaluated model/config.
- Structured output is validated again by application code and remains a proposal.
- No model receives a tool capable of approval, Meta execution, spending, unrestricted web/file access, or direct domain-state mutation.
- Provider sessions, traces, and request ids are not business state.
- PII, prompts, responses, and trace payloads follow OD-027 retention/data-classification rules.

## Consequences

### Positive

- Small, explicit initial integration with current Responses capabilities.
- Product-owned contracts keep provider semantics outside the core.
- Static evaluated routing makes quality, cost, and privacy changes reviewable.
- Deferring frameworks avoids duplicate workflow and state ownership.
- Future providers can be added behind a real seam supported by fixtures and recorded behavior.

### Negative

- Initial production depends on OpenAI availability and terms.
- The team must implement task policies, validation, usage normalization, and provider error mapping.
- Direct integration lacks Gateway's immediate multi-provider fallbacks and consolidated budgets.
- Not using Agents SDK means building only the small orchestration pieces actually needed.

### Mitigations

- Keep complete request/response fixtures, conformance tests, and a provider-neutral result/error taxonomy.
- Fail closed to queued human work rather than an unevaluated model.
- Measure model quality, latency, cost, failure, and human correction by task policy.
- Revisit only when evidence shows the direct path is the limiting factor.

## Revisit triggers

Revisit this ADR when:

- OpenAI fails OD-027/OD-033 privacy, residency, contract, or subprocessor requirements;
- reliability evidence shows an evaluated second provider is necessary;
- model spend materially threatens the accepted OD-032 budget;
- provider feature differences cannot fit the current port without losing necessary capability;
- several workflows need multi-step handoffs/guardrails/traces beyond the durable application workflow;
- an accepted evaluation supports a different task/model/provider matrix.

## Official sources reviewed

- [OpenAI model guidance and current model catalog](https://developers.openai.com/api/docs/models)
- [OpenAI Responses API migration guide](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [OpenAI structured outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI function calling guide](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI Agents SDK for TypeScript](https://openai.github.io/openai-agents-js/)
- [OpenAI Agents SDK tracing](https://openai.github.io/openai-agents-js/guides/tracing/)
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
- [Vercel AI Gateway models and providers](https://vercel.com/docs/ai-gateway/models-and-providers)

## Related decisions

- OD-010: model output is a proposal; customer approval is exact
- OD-021 / ADR-0021: verified source context only
- OD-022 / ADR-0022: typed creative proposals and deterministic media
- OD-024: durable workflow ownership
- OD-026: AI safety and evaluation thresholds
- OD-027: data processing, retention, and residency
- OD-028: application observability and metrics
- OD-030: API credentials and secrets
- OD-032: model budget and capacity
- OD-033: provider terms and subprocessor readiness
