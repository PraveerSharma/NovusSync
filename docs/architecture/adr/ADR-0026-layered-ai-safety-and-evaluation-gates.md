# ADR-0026: Layered AI safety and evaluation gates

- **Status:** Accepted under founder-delegated technical direction
- **Date:** 14 July 2026
- **Decision:** OD-026

## Context

The product uses models to propose campaign plans, copy, grounded reply drafts, and learning memos. Those outputs can be wrong even when they are schema-valid. Retrieved business text and manually entered lead text are untrusted data and may contain prompt injection. A human review step is necessary for the manual Instagram and WhatsApp pilot, but human review alone is inconsistent and does not detect regressions before release. A model reviewing its own output can reproduce the generator's failure mode.

The product therefore needs a release gate that evaluates the exact production task policy: model snapshot/configuration, prompt, schema, allowed tools, retrieval rules, validators, and vertical pack.

## Decision

Adopt layered, task-specific safety and evaluation controls.

### Runtime controls

1. Supply models only the minimum approved Workspace/use-case facts and immutable context-snapshot identifiers. Treat website, lead, and imported text as quoted data that cannot define instructions, tools, policy, model routing, or authority.
2. Require strict typed output. Reject unknown fields, invalid citations, stale/restricted fact IDs, disallowed claims, prices or policies not present in the approved snapshot, and any tool name or argument outside the task allow-list.
3. Keep provider built-in web, file, computer, shell, and MCP tools disabled. AI produces proposals only; deterministic application policy authorizes any product-controlled action.
4. On validation failure, permit at most one bounded repair using the same evaluated task policy. A second failure, low confidence, unsupported/sensitive request, policy conflict, or ambiguity must abstain or escalate. Do not silently change model or configuration.
5. Every customer-facing campaign asset and private WhatsApp draft is reviewed by a named human in the initial pilot. Human approval does not waive a mandatory deterministic failure.

### Offline evaluation gate

Maintain versioned, de-identified suites per task and vertical pack containing normal, boundary, conflicting-fact, stale-fact, missing-fact, prohibited-claim, price/policy, sensitive, prompt-injection, cross-tenant/secret-exfiltration, malformed-output, unauthorized-tool, and multilingual-noise cases. Keep a held-out regression set and append every material production failure as a counterexample after privacy review.

Before a task policy, model, prompt, schema, validator, retrieval rule, or vertical pack reaches staging or production, run the exact candidate path and require:

- at least **95% correct and supported** results on the approved task suite;
- **100% abstention or escalation** for unsupported sensitive, price, policy, and claims cases;
- **100% schema-valid terminal results** after the single bounded repair;
- **0 cross-tenant disclosures, secret disclosures, unauthorized tool calls, built-in-tool use, policy bypasses, or external side effects**;
- all deterministic citation, claim, consent/suppression, approval, and exact-version invariants to pass; and
- latency and cost to remain inside the accepted OD-032 task budget.

Any zero-tolerance failure blocks release regardless of the aggregate score. Deterministic graders and explicit human labels are authoritative. A separate model grader may assist semantic review, but cannot be the sole judge for grounding, safety, claims, authorization, or release.

### Production monitoring

Record safe metadata linking task-policy, provider/model/config, prompt/schema/validator/eval-set versions, context snapshot, result, usage, latency, cost, validation outcome, escalation, and reviewer decision. Raw prompts, source text, lead messages, or model traces are not copied into telemetry unless OD-027 and OD-028 explicitly permit that data class.

Risk-based sampling reviews all safety/claim/price/policy escalations and corrections, plus an initial random sample of at least 20% of otherwise accepted outputs per task during the first two live campaign cycles. After two passing cycles and at least 50 sampled outputs for a task, the random sample may reduce to 10%; it never drops below 5% without a new decision. Any severe failure pauses the affected task policy, preserves evidence, triggers the incident runbook, adds a regression case, and requires the full gate again.

## Consequences

- The accepted thresholds are release conditions, not aspirational dashboard metrics.
- Every model/config fallback must pass independently for its task; there is no dynamic or unevaluated fallback.
- Human review remains in the MVP even after a policy passes offline tests.
- Evaluation maintenance and false-positive handling add work, but failures become reproducible and auditable.
- Production customer data cannot quietly become an evaluation/training dataset; cases must be minimized, de-identified, and governed by OD-027.

## Rejected alternatives

- **Manual review only:** inconsistent and unable to gate regressions before exposure.
- **Heuristics only:** strong for invariants but insufficient for semantic correctness and tone.
- **Model self-review only:** shares correlated failure modes and cannot own authorization.
- **One global score:** can hide catastrophic safety failures inside a good average.
- **Provider-hosted eval state as the only record:** useful as a runner, but the product repository must version fixtures, labels, policy, and release evidence.

## Verification

- CI/offline runs are deterministic where possible and never contact real leads or execute external actions.
- A release manifest identifies the exact task policy and passing evaluation result.
- Red-team fixtures prove source text cannot change instructions, call tools, reveal tenant/secret data, or bypass policy.
- Production sampling and incident evidence are reviewed at the weekly pilot review.

## Official references checked

- [OpenAI Evals API](https://platform.openai.com/docs/api-reference/evals)
- [OpenAI graders](https://platform.openai.com/docs/api-reference/graders)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling)

