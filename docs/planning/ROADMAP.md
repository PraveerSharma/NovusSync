# Delivery Roadmap

**Status:** Decision baseline accepted; evidence-gated execution; no implementation dates are committed  
**Execution status:** R0 evidence pending; application implementation is blocked until a signed Gate G0 `GO`  
**Source:** [Product brief](../product/PRODUCT_BRIEF.md)  
**Scope authority:** [MVP scope](../product/MVP_SCOPE.md)  
**Decision register:** [Open decisions](../decisions/OPEN_DECISIONS.md)  
**Architecture:** [System architecture](../architecture/SYSTEM_ARCHITECTURE.md)

## Delivery objective

Deliver one safe, measurable loop through the independent-yoga-studio pilot pack on a generic campaign-to-outcome product core, subject to the recorded evidence gates and later founder go/no-go approvals:

> verified business context -> goal-based campaign -> version-specific approval -> evidenced manual Instagram publication -> hosted-form/manual WhatsApp lead capture -> human-assisted qualification -> booking -> attended outcome -> evidence-based next experiment

The roadmap deliberately does not assign dates. All product decisions are classified; the product/pilot boundary, privacy posture, foundation technical architecture, pilot pricing, operating budget, and OD-033 readiness policy are accepted. Estimates remain false precision until [Gate G0 discovery evidence](../discovery/GATE_G0_EXECUTION.md) exists. OD-033 evidence remains a separate hard gate before real Lead data or live operation.

## Working rules

- Gate hierarchy is cumulative: accepted/deferred decisions fix the plan; a signed Gate G0 `GO` is still required before application scaffolding; that `GO` opens only R1 synthetic/local foundation work; the applicable OD-033 evidence plus a separate founder live-readiness `GO` is required before real Lead data, paid/live operation, production providers, or production AI/telemetry. Later roadmap gates retain their own effects.
- A `YES — dependent work` decision or evidence item must be satisfied before its named module/gate, but need not block unrelated earlier synthetic work. An accepted decision, ADR, sandbox, fake, template, or unchecked checklist item is never evidence that a later gate passed.
- Each phase must produce its own testable evidence; “code complete” is not an exit criterion.
- Product-controlled external actions use deterministic policy, authorization, idempotency, and audit controls. Instagram publication and WhatsApp messaging are performed only by named humans outside the product and then evidenced; agents may propose private drafts but never publish, message, book, or spend directly.
- P0 work optimizes for one reliable channel-to-outcome loop. Additional channels, verticals, CRM breadth, ad-budget automation, and rich creative tooling remain outside the MVP.
- The billing domain stays global-ready—country, currency, localized price/tax/payment method, invoice/refund policy, and supported-jurisdiction activation—but the initial Bengaluru managed pilot remains invite-only and manually invoiced under accepted OD-031. Global checkout is activated only after OD-033 provider, tax, legal, support, and offer-readiness evidence plus a separately approved implementation task.
- OD-009 fixes delivery as a paid, product-assisted managed pilot. Named operators use individual tenant-scoped roles; manual support is allowed only when visible, timed, reasoned, product-gap-classified, and audited. Impersonation, shared credentials, hidden work, and routine direct-database repair are prohibited.
- OD-014 staffs the measured pilot with two trained/named friends of the founder who volunteer without salary, plus founder escalation, a daily 10:00–20:00 IST service window, no 24/7 human promise, and an initial cap of 10 live Workspaces. Actual minutes and market-rate shadow cost remain mandatory; unpaid coverage cannot support permanent pricing or scale claims. Expansion to 20 and then toward 50 must pass the accepted four-week quality, labor, and 30%-reserve gates.
- A failed safety or tenant-isolation gate stops promotion even if the user journey appears to work.

## Decision references

These are the authoritative IDs in `OPEN_DECISIONS.md`. They are dependencies, not silently accepted assumptions.

| Reference | Decision required |
|---|---|
| `OD-001`, `OD-002`, `OD-004` | Exact vertical, geography/language, and eligible customer/qualification boundary |
| `OD-003`, `OD-012` | **Accepted:** qualified attended-trial definition plus deterministic first-known attribution, verified outcomes, uncertainty, and append-only corrections |
| `OD-007`, `OD-008`, `OD-011` | Initial routes, human-only paid-traffic handoff/no software spend, and exact `CU-01` campaign unit |
| `OD-013`, `OD-034` | **OD-013 accepted / OD-034 deferred:** campaign-native lightweight pipeline; no CRM adapter, with governed CSV handoff only for evidenced partner need |
| `OD-018`, `OD-019` | **Deferred under ADR-0019:** manual Instagram publishing and human-operated WhatsApp Business; no Facebook or Meta API |
| `OD-027` | **Accepted:** Mumbai primary authority, controlled cross-border processors, minimized Lead data, versioned consent/suppression, rights/deletion, and 30/90/365/35-day retention |
| `OD-020` | **Accepted:** external booking system of record; multi-location/instructor eligibility; one deep adapter at most plus hosted/manual tiers |
| `OD-023`, `OD-026` | **Accepted:** direct OpenAI Responses behind an application port plus layered grounding, safety, and evaluation gates |
| `OD-017`, `OD-025`, `OD-036` | **Accepted:** Vercel Pro Mumbai web/API, Mumbai Supabase PostgreSQL/private Storage, reviewed Drizzle migrations/events/audit, and single-region PITR plus independent tested recovery |
| `OD-016` | **Accepted:** Supabase Auth identity/session plus application-owned Organization/Workspace/Membership/roles/support grants and tenant-safe authorization |
| `OD-024` | **Accepted:** stable Vercel Workflow with database/outbox/idempotency authority and current-state checks |
| `OD-028` | **Accepted:** product-owned metrics plus allow-listed PostHog EU and scrubbed Sentry EU/DE/Vercel/OpenTelemetry sinks, gated by privacy/legal approval |
| `OD-005`, `OD-006`, `OD-009`, `OD-014`, `OD-031` | **Accepted:** pilot partners, evidence, managed operating model, unpaid pilot staffing/shadow-cost rule, support targets, and first-five commercial terms |
| `OD-032` | **Accepted:** 10-Workspace/10-activation/200-Leads-per-Workspace/60-publication envelope; INR 10,000 development/staging monthly, INR 15,000 one-time readiness, and INR 30,000 live-pilot monthly ceilings; INR 750/1,250 cycle AI allowances, INR 200/hour shadow cost, 50/75/90 alerts, and fail-closed behavior at 100% |
| `OD-033` | **Accepted policy; evidence not passed:** actual platform access, provider/subprocessor terms, privacy/consent/commercial documents, counsel review, rehearsals, and operational readiness remain mandatory before real Lead data or live operation; see the [live-readiness checklist](../readiness/OD-033_LIVE_READINESS.md) |
| `OD-037` | **Accepted:** pinned Node/pnpm/Next/React/TypeScript/UI/render/test/lint/format toolchain and compatibility spike |

## Phase and gate map

```text
R0 Product proof + decisions (pre-implementation gate)
             |
             v
R1 / Phase 0 Repository + secure foundation
             |
             v
R2 / Phase 1 Verified Business Brain
             |
             v
R3 / Phase 2 CU-01 campaign + content + exact approval
             |
             v
R4 / Phase 3 Evidenced manual publication + source-aware capture
             |
             v
R5 / Phase 4 Qualification + booking + takeover
             |
             v
R6 / Phase 5 Attendance + learning + complete MVP pilot loop
             |
             v
R7 / Phase 6 Pilot hardening + paid launch (post-MVP release work)
```

Read-only booking-provider eligibility and data-processing research may start in R0. Provider projects, test accounts, credentials, or sandbox work begin only after Gate G0 and separate authorization for the applicable provider task; production accounts and enablement remain blocked by OD-033. Meta App Review, templates, tokens, and test accounts are not initial R4/R5 prerequisites; ADR-0019 defines separate re-entry evidence.

## R0 — Product proof and development-readiness gate

**Outcome:** Prove that the selected customer, problem, and attended outcome merit a build, and remove decisions that would cause rework.

**Dependencies:** None.

**Work:**

- Select one exact vertical and geography; document the owner persona, business shape, terminology, restrictions, qualification questions, buying objections, and booking flow.
- Complete the accepted OD-006 gate: at least 10 eligible-owner interviews (continuing toward 20 until findings stabilize), 70% behavioral evidence of both pains, two documented manual end-to-end workflows, and five eligible-owner prototype tests. Fulfill OD-005: five named Bengaluru yoga-studio commitments to two `CU-01` cycles, at least three with demonstrated baseline/access readiness, and at least two paid or deposit-backed before G0.
- Establish a per-partner baseline for leads, response time, qualification, bookings, attendance, sales, spend, and owner hours. Before OD-033 live-data approval, the studio retains any customer-level records and the product team records only coded, de-identified, or aggregate observations.
- Define the primary outcome, qualification rule, attendance evidence, attribution window, exclusions, and dispute process.
- Walk through the proposed campaign-to-attendance flow manually with representative data and a clickable prototype/service blueprint.
- Approve P0 channel boundaries, non-goals, architecture boundaries, external provider evaluation criteria, and the managed-service operating model.
- Accept or amend every `YES — main build` decision; assign an owner and target gate to every `YES — dependent work` item; create ADRs for approved material technical choices.
- Obtain written pilot commitments that include a future governed route to downstream outcome evidence and permission to use synthetic or expressly approved de-identified test data. A commitment does not authorize transferring Lead-level data into the product before OD-033.

**Definition of done / Gate G0 — Ready to build:**

- `MVP_SCOPE.md` names one exact user, problem, journey, capability boundary, non-goals, and measurable targets.
- Interview notes meet the accepted sample/saturation and 70% dual-pain rule; manual workflow and five-owner prototype evidence are complete; explicit willingness-to-pay signals and contrary evidence are included.
- Five design partners satisfy the signed participation requirements; at least three demonstrate the approved baseline/access readiness and at least two have paid or deposit-backed commitments.
- The primary outcome can be verified from an approved source rather than inferred from clicks or messages.
- `OPEN_DECISIONS.md` has no unresolved `YES — main build` item; every `YES — dependent work` item has an owner, evidence plan, and a gate before which it must be accepted.
- The architecture, data-flow, agent/deterministic boundary, security boundary, hosting/data-residency approach, and initial integration path are approved.
- A founder signs the G0 checklist. Until then, only research, documentation, and throwaway risk-reduction prototypes are permitted.

## R1 / Phase 0 — Repository and secure platform foundation

**Outcome:** A repeatable, observable, tenant-safe development base on which a vertical slice can be built.

**Dependencies:** Signed Gate G0 `GO`; foundation ADRs for OD-015 through OD-017, OD-023 through OD-030, and OD-035 through OD-037 are accepted. Execute their required compatibility/security/privacy/recovery spikes as scheduled in [Phase 0 Foundation](PHASE_0_FOUNDATION.md). G0 authorizes synthetic/local foundation work only: no real Lead data, production provider, paid/live operation, or production AI/telemetry enters R1 before OD-033 passes for the actual configuration.

**Work:**

- Execute the approved tasks in [Phase 0 Foundation](PHASE_0_FOUNDATION.md).
- Establish the modular-monolith repository boundaries, typed configuration, database migration flow, local/test environments, CI, branch protection, and preview/staging path.
- Implement identity, organization/workspace membership, initial roles, tenant-scoped data access, append-only audit events, and a domain-event envelope.
- Establish integration adapter contracts without implementing unapproved providers.
- Establish test fixtures, deterministic clocks/IDs, synthetic tenant data, and security regression suites.

**Definition of done / Gate G1 — Engineering ready:**

- A clean checkout can be configured and verified using documented commands and fake/local dependencies only.
- Formatting, lint, type checking, unit, integration, tenant-isolation, build, and one smoke end-to-end test pass in CI.
- Cross-tenant reads and writes fail in automated tests at the data-access and application layers.
- Secrets are validated at startup, absent from source/log fixtures, and stored only in approved environment stores.
- Every state-changing request carries tenant, actor, request/correlation, and audit context.
- The migration set applies cleanly to an empty database, and the documented rollback, restore, or forward-fix procedure appropriate to the accepted migration policy is exercised.
- No real publish, message, booking, payment, or AI external action is reachable from the foundation smoke test.

## R2 — Verified Business Brain

**Outcome:** A pilot owner can create and approve the facts that later campaigns and conversations may use.

**Dependencies:** G1; accepted vertical/qualification/ingestion rules from OD-001, OD-002, OD-004, and OD-021/ADR-0021; approved data, privacy, and claim rules from OD-025, OD-027, and OD-029.

**Work:**

- Create guided entry, bounded provisional ingestion from one owner-approved business domain, and normalized descriptive metadata from an approved booking route for business profile, offer, audience, brand voice, FAQ, price/policy, claims, restrictions, and source metadata. Do not implement files, broad/live-web truth, conversation learning, or vectors.
- Make extracted information provisional by default; show conflicts, missing required facts, source, confidence, and freshness.
- Let an authorized owner approve, reject, or correct a fact version and record the decision in the audit log.
- Expose a Workspace/use-case-scoped relational/full-text retrieval contract that returns only approved, in-scope facts with citations and explicit `unknown`; retain the verified-context snapshot used by every generated artifact.
- Add expiry/reverification rules for time-sensitive prices, offers, and policies.

**Definition of done / Gate G2 — Context trusted:**

- A pilot owner can complete the vertical-specific minimum profile without database access.
- Every approved fact records tenant, source, version, approver, timestamp, and status.
- Conflicting or unsupported facts remain visibly unresolved and cannot be returned as approved truth.
- Expired time-sensitive facts are visibly flagged, excluded from external-use retrieval, and require an audited owner reverification before reuse.
- Golden tests prove that restricted claims and facts belonging to another tenant are not retrieved.
- The owner can export and correct their business context, and deletion/retention behavior follows the approved policy.

## R3 — Campaign, coordinated content, and exact approval

**Outcome:** An owner can request, review, revise, and approve one measurable campaign bundle tied to approved business truth.

**Dependencies:** G2; OD-003, OD-007, OD-008, OD-011, OD-022/ADR-0022, and OD-023/ADR-0023 accepted; OD-026, OD-029, and OD-032 accepted.

**Work:**

- Capture goal, time window, audience, offer, capacity, budget policy, channel set, success metric, and assumptions.
- Produce the typed `CU-01` plan with funnel, message hierarchy, lead questions, KPI, capacity, and explicit evidence/assumptions.
- Generate typed copy/layout proposals and render the exact six-item Instagram/form/manual-WhatsApp-playbook envelope with approved facts and deterministic templates for every factual/text/logo/CTA element. Use only governed customer/licensed media or reviewed non-factual generated decoration.
- Run fact, brand, claim, spelling, accessibility, duplication, and channel-format checks.
- Support versioned change requests and approval of exact campaign/content versions; material edits invalidate approval.
- Record model, prompt/template/renderer version, source facts, media provenance/licence or generation metadata, canonical render manifest, output checksum, review results, cost/usage, and actor in trace/audit records.

**Definition of done / Gate G3 — Approved campaign:**

- One representative campaign request produces a coherent `CU-01` plan; all six Instagram items, landing/form, and manual WhatsApp playbook/private drafts pass mandatory QA and exact-version approval before activation.
- Unsupported claims are blocked or escalated; the owner can see evidence, assumptions, risks, and unresolved QA results.
- The approved payload is cryptographically or immutably identified; changing price, offer, claim, audience, budget, media, or material schedule attributes creates a new version requiring the configured reapproval. A timestamp-only owner edit inside the active window follows the narrower OD-010 occurrence rule below.
- Owner scheduling authorizes an exact version/Instagram-account/timestamp manual occurrence. Timestamp-only owner edits are audited without content reapproval; account/version/out-of-window edits invalidate the occurrence.
- A deterministic test proves that an unapproved, superseded, or rejected version cannot enter the scheduling queue.
- Generated output and cost stay within the approved evaluation quality threshold and per-campaign budget.

## R4 — Evidenced manual publication and source-aware lead capture

**Outcome:** A named human publishes an exact approved Instagram version with honest evidence, and resulting interest is captured with explicit source and consent state.

**Dependencies for synthetic/non-customer implementation:** G3; OD-007, OD-010, OD-011, OD-024/ADR-0024, OD-027/ADR-0027, and OD-030/ADR-0030 accepted; OD-018/OD-019 deferred through ADR-0019; R1 policy/audit controls operational. Account-specific, non-customer channel rehearsals must follow the applicable OD-033 evidence-handling and access rules. No real Lead or live campaign may enter R4 until every applicable OD-033 item passes and the founder records the separate live-readiness `GO`.

**Work:**

- Record exactly one Instagram account and one official WhatsApp Business number, named actors, delegated-access/no-password-sharing confirmation, service rota, consent playbook, rehearsal, and evidence method. Store no Meta credentials.
- Schedule exact approved Instagram versions by workspace timezone and create human due work with close/cancel/pause controls.
- Let the named human record actual publication actor/time/content hash/public URL or screenshot/evidence and verified/unverified status. Never imply provider confirmation.
- Provide the hosted landing/form as primary and tracked click-to-WhatsApp as secondary. The form creates source/consent-complete Leads; a click alone does not.
- Let named operators manually reconcile an observed WhatsApp conversation/Lead with source, consent, actor, time, evidence, and explicit uncertainty.
- Enforce `CU-01` close/tails across forms, due work, private drafts, and booking work; emergency stop suppresses product-controlled guidance while the runbook addresses off-platform human action.

**Definition of done / Gate G4 — Manual channel execution honest and safe:**

- Rehearsal proves named humans can use delegated Instagram/WhatsApp access without shared passwords and can capture required evidence.
- Every completed manual occurrence references the approved hash and records actor, actual time, URL or screenshot/evidence, and verification state; due work is never labelled published.
- Wrong account/version, missing access/evidence, lateness, contradiction, cancellation, and emergency pause follow tested distinct paths.
- Form Leads retain source/consent; click-to-WhatsApp remains a click until an actual conversation is manually reconciled.
- Missing consent, unapproved content, wrong tenant, and closed/cancelled state fail closed inside the product and create actionable work.
- Tests prove there is no Meta SDK, OAuth, token, API credential, webhook, provider status, automated send, or Facebook path.

## R5 — Lead Concierge, qualification, booking, and takeover

**Outcome:** A source-aware lead receives timely human help supported by private grounded drafts, is qualified progressively, and books real availability safely.

**Dependencies for synthetic/non-customer implementation:** G4; OD-004, OD-010, OD-013, OD-020, OD-026, OD-027, OD-030, OD-032, and OD-033 policy accepted; OD-019 deferred; G2 facts and a rehearsable manual rota/access plan available. Provider-specific sandbox work requires separate authorization and the applicable provider evidence. Real Lead data, live booking/provider effects, and a live campaign require the complete applicable OD-033 evidence set and founder live-readiness `GO`.

**Work:**

- Build a campaign-native worklist/light pipeline for hosted-form Leads and manually reconciled WhatsApp conversations; do not call it a live WhatsApp inbox.
- Generate private grounded acknowledgments/answers/questions one or two at a time; a human reviews/edits/sends in WhatsApp Business and records actual action/evidence.
- Maintain transparent fit, intent, urgency, and engagement evidence; do not introduce learned scoring in the MVP.
- Inventory all five partners and configure one provider-managed `BookingRoute` per campaign offer using a deep, tracked-hosted, or operator-assisted tier. The route may span multiple locations/instructors/classes/resources. Build at most one evidence-selected deep adapter and validate its access/webhook/timezone/sandbox/health; do not force migration or build multiple speculative adapters.
- For deep routes, use fresh provider options and idempotent creation/reconciliation. For hosted/manual routes, retain tracked parameters or actor/provider-reference evidence and explicit confidence. Never calculate routing/capacity or represent hosted/manual evidence as API-confirmed. Create human notification due work rather than sending WhatsApp.
- Enforce recorded opt-out/takeover/pause immediately across product drafts/reminders and audit contradictory human action separately.
- Outside hours, hosted forms record Leads; WhatsApp inbound remains unobserved until operators reconcile at the next service window. The product sends no receipt.

**Definition of done / Gate G5 — Conversion safe:**

- Synthetic and designated pilot Leads can travel from honest source/consent evidence through human FAQ/qualification to tier-labelled non-duplicated bookings, including a multi-location/instructor provider-managed route; all manual and reconciliation work is visible.
- Unknown facts result in clarification or handoff, not invented answers.
- Product drafts/reminders stop after recorded opt-out/takeover/pause and resume cannot override opt-out; off-platform contradictions are trust incidents, not hidden.
- Deterministic-clock tests enforce due-work timing for the accepted follow-up steps and tails without asserting an automated send.
- Concurrent product-controlled booking attempts cannot duplicate a provider booking; repeated provider events remain idempotent, and hosted/manual discrepancies remain explicit.
- Human takeover suppresses product drafts/reminders, retains context/audit, and requires authorized resume.
- The approved real model path passes the versioned quality, safety, trace, latency, and cost evaluation; deterministic fakes remain valid only for automated tests and cannot qualify a designated pilot lead.
- Natural close stops new activity but lets eligible pre-close unbooked human work finish its original seven-day window (never past close+7) and booked work finish through close+14. Normal cancel stops unbooked product guidance; emergency stop suppresses all product drafts/reminders.

## R6 — Attendance, funnel intelligence, and complete MVP pilot loop

**Outcome:** The owner can verify what happened after booking, see the campaign-to-attendance funnel, and approve a defensible next experiment.

**Dependencies for synthetic acceptance:** G5; OD-003, OD-006, OD-012, OD-023, OD-026, and OD-028 accepted; representative synthetic/non-customer fixtures available. Before the designated real-partner acceptance run required by G6, OPS-009/OPS-010 and the complete applicable OD-033 evidence/founder live-readiness `GO` must pass; test fixtures or partial readiness cannot substitute.

**Work:**

- Record attended, no-show, cancelled, won, lost, and approved lost-reason states from the designated system of record or an audited owner action.
- Link outcome events back to booking, lead, campaign, creative, offer, and source without overwriting raw evidence.
- Show counts and conversion rates for captured, engaged, qualified, booked, attended, and won; expose missing/late/ambiguous data.
- Generate the bounded weekly and close-out memos that separate observation, evidence, sample size, confidence, hypothesis, and proposed experiment.
- Run the complete journey with pilot controls, measure owner workload and trust failures, and document all manual interventions.

**Definition of done / Gate G6 — MVP candidate ready for measured pilot:**

- At least one designated pilot record completes the real campaign-to-verified-attendance loop; test fixtures alone do not satisfy the gate.
- Funnel totals reconcile with the underlying event ledger, and repeated/late events do not inflate counts.
- The owner can inspect the source chain, correct an outcome with an audit reason, and distinguish unknown attribution from attributed outcomes.
- The weekly memo never asserts causality from insufficient evidence and cannot change a campaign or budget without owner approval.
- The owner can accept, reject, or defer the proposed experiment; acceptance creates only a draft campaign request that must pass the normal planning and approval gates.
- All functional and safety P0 acceptance criteria needed to begin the measured cohort run, and all P0 backlog items on the critical path, pass with zero unresolved severity-1 security, privacy, consent, duplication, or unauthorized-action defects.
- The founder accepts the pilot candidate and authorizes the measured five-partner cohort. This gate does not claim that the MVP success metrics have passed; those require the R7 cohort evidence.

## R7 — Pilot hardening and paid launch

**Outcome:** Operate the proven loop reliably for paying design partners with support, cost, and recovery controls.

**Dependencies:** G6; OD-005, OD-006, OD-009, OD-014, OD-027, OD-031, OD-032, OD-033, OD-035, and OD-036 are accepted; the OD-033 live-readiness checklist and accepted budget/privacy/recovery/release evidence must pass for paid production. This phase is release hardening, not permission to expand MVP breadth.

**Work:**

- Harden alert routing, manual-channel access/evidence/workload dashboards, booking-integration health, support runbooks, response targets, incident response, backup/restore drills, and cost reporting.
- Staff and drill the accepted two-unpaid-operator pilot rota and founder escalation path. Prove median ≤15-minute and p95 ≤30-minute in-window lead response plus the accepted critical/operational/routine support targets; record actual minutes and market-rate shadow cost; preserve at least 30% rostered reserve before any admission-cap increase; maintain an exit/replacement path.
- Complete privacy, consent, retention, deletion/export, vendor/DPA, and platform-policy readiness for the approved geography.
- Operate accepted OD-031: INR 4,999 plus applicable tax through 100 new Leads or INR 6,999 preselected for 101–200 per 28-day cycle; INR 1,000 deposit credited to cycle one; no setup fee; customer-paid ad/provider charges; pay-before-activation, cancellation-before-next-cycle, refund/credit, and no-surprise-overage handling. Dodo remains a later software-billing candidate only after written offer eligibility; billing automation remains outside the MVP.
- Onboard the approved design partners in controlled cohorts; compare outcome and owner-workload metrics against baseline.
- Create case studies only where claims and attribution are defensible and customers approve use.

**Definition of done / Gate G7 — MVP success validated and paid launch ready:**

- Five distinct partners each complete two `CU-01` cycles (10 campaigns total); extra cycles from one partner do not replace another partner's evidence.
- Manual Instagram timeliness/evidence, human WhatsApp response/reconciliation, booking, and outcome-data targets meet approved thresholds; restore, pause, access-revocation, and incident drills pass.
- Per-tenant unit economics and founder support hours are visible and within approved pilot limits.
- The cohort never exceeds the last proven admission cap: 10 initially, then 20 or toward 50 only after the accepted four-consecutive-week gate passes at the proposed cap.
- Zero severe trust incidents occur, using the definition in `MVP_SCOPE.md`; unresolved lower-severity consent, privacy, duplication, or unauthorized-action patterns also block release.
- At least three partners have comparable baseline volume/data, the approved cohort-level outcome-comparison gate passes, and at least three partners renew or sign a post-pilot paid agreement. The comparable-data and renewal sets are reported separately and need not be the same businesses unless OD-006 explicitly requires it.
- Pilot invoicing/entitlement handling (manual unless separately approved), cancellation, data export/deletion, support, rollback, and incident runbooks are tested end to end.
- Founder approves go/no-go using measured pilot evidence, not feature count.

## Cross-phase dependencies and parallel work

| Dependency | Earliest start | Blocks | Parallel action |
|---|---|---|---|
| Vertical vocabulary, restrictions, and qualification playbook | R0 | R2, R3, R5 | Continue interviews and manually test scripts |
| Outcome definition and verification access | R0 | R3 KPI schema, R6 | Negotiate data access with pilot partners |
| Manual Instagram/WhatsApp access, rota, and evidence method | R0 | G4, G5 | Rehearse delegated access, source/consent reconciliation, response coverage, and evidence capture without Meta credentials |
| Meta API re-entry evidence | After two complete manual cycles and repetition across three partners | Future only | Apply ADR-0019 cost/benefit/privacy/platform criteria; publishing and WhatsApp return separately through new ADRs |
| Five-partner booking inventory and selected-provider sandbox/account access | OD-020 accepted; inventory starts R0 | G5 | Rehearse deep/hosted/manual tiers; select at most one deep adapter only after coverage/capability evidence |
| Hosting/data-region and provider evidence | R0 read-only research; configured accounts only after G0 and separate authorization | G1 production path and OD-033 | Perform threat model and current vendor/data-flow/terms review; do not sign, purchase, create a production account, or enable a provider merely because an ADR names it |
| Pilot baseline and downstream evidence route | R0 | G6 evidence | Run a studio-controlled manual workflow; before OD-033, the studio retains customer records and the product team records only coded, de-identified, or aggregate observations |
| AI quality/cost evaluation set | R2 facts/schema approved | G3, G5, G6 | Curate golden cases from approved, de-identified scenarios |

## Critical path

1. Accept or amend every decision classified `YES — main build` in the authoritative register, including the exact user/outcome/routes/`CU-01` boundary, operating capacity, pilot partners, acceptance metrics, architecture, providers, legal/privacy posture, and engineering toolchain; assign an owner and gate to every dependent decision.
2. Record the architecture/security boundary plus auth, data/persistence, jobs, AI, manual-channel evidence/Meta deferral, calendar, deployment, and verification approaches in focused ADRs.
3. Establish repository verification, tenancy, audit, policy, event, configuration, and integration-adapter foundations.
4. Make Business Brain facts source-backed and owner-approved.
5. Create a typed campaign and bind exact content versions to approval.
6. Execute exact-approved Instagram work manually with evidence and capture a source/consent-complete form or reconciled WhatsApp Lead.
7. Support human qualification with private drafts, book safely, suppress guidance on opt-out/takeover, and verify attendance.
8. Reconcile the funnel, produce the evidence-based memo, and pass the real pilot gate.

The highest schedule risks are design-partner outcome access, manual Instagram/WhatsApp access and evidence quality, human response workload, booking-provider readiness, privacy/consent, and safely staffing accepted human-run paid traffic. OD-008 excludes software ad execution. These risks require rehearsals and evidence, not merely more application code.

## Scope-change rule

Any request that adds a vertical, channel, paid-ad spend, CRM breadth, autonomous budget/action authority, voice, ecommerce, proprietary model, complex design editor, or multi-touch attribution must:

1. reference the [explicit non-goals](../product/MVP_SCOPE.md#7-explicit-non-goals),
2. state the measured problem it solves,
3. identify impact on the critical path and safety model,
4. receive founder approval, and
5. update the MVP scope, decision record/ADR, roadmap, backlog, tests, and operating runbook together.
