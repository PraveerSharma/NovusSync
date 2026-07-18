# System Architecture

| Item | Value |
|---|---|
| Status | **Foundation architecture and all decisions accepted/deferred; Gate G0 and OD-033 live-readiness evidence remain pending** |
| Scope | Generic campaign-to-outcome product core, validated first through an independent-yoga-studio campaign-to-qualified-attended-trial pack |
| Architecture style | Modular monolith with durable asynchronous work |
| Intended team | Solo founder or small product team |
| Sources | [Product brief](../product/PRODUCT_BRIEF.md), normative [MVP scope](../product/MVP_SCOPE.md) pending founder/G0 sign-off, accepted [ADR set](adr/), and authoritative [Open Decisions](../decisions/OPEN_DECISIONS.md) |
| Last updated | 15 July 2026 |

## 1. Purpose and decision status

This document defines the target shape of the first production system. It separates AI judgment from deterministic control, makes every external side effect auditable and retry-safe, and keeps the deployment small enough for a solo founder to operate.

The foundation architecture, privacy boundary, pilot commercial terms, operating budget, and readiness policy are accepted through the ADRs and [Open Decisions register](../decisions/OPEN_DECISIONS.md). Neutral scaffolding still depends on [Gate G0](../discovery/GATE_G0_EXECUTION.md) and the recorded compatibility/security spikes; real Lead data and paid production remain blocked until the accepted OD-033 [live-readiness checklist](../readiness/OD-033_LIVE_READINESS.md) and required implementation evidence pass.

### 1.1 Accepted architecture-shape commitments

| Proposal | Why it fits the current stage | Cost accepted |
|---|---|---|
| One modular TypeScript application, not microservices | One team needs fast local iteration and transactional consistency | Module discipline must be enforced in code and tests |
| One relational system of record | Campaign, approval, lead, booking, and outcome data are strongly related | Heavy analytics may later need a separate store |
| Durable jobs for slow or scheduled work | Generation, human due-work reminders, booking integration, ingestion, and reports need retries and observability | A managed job provider adds a vendor dependency |
| AI returns typed proposals; deterministic services authorize actions | This limits hallucination and unauthorized external effects | More explicit schemas, policy checks, and state machines are required |
| Provider adapters at external boundaries | Accepted providers stay outside the core, while deferred or evidence-dependent providers remain unimplemented | Canonical internal models cannot expose every provider-specific feature |
| Managed infrastructure first | Reduces operational load for a solo/small team | Higher unit cost and some vendor dependency |

### 1.2 Explicit assumptions

These are working assumptions, not silent decisions:

- The first release serves a small paid pilot, not internet-scale traffic. User count, lead volume, and peak message rate are not yet evidenced; see **OD-032 Scale, budget, and cost controls**.
- One Organization may own Workspaces in the generic core. The yoga MVP admits one independently governed studio business per Workspace, but that business may have multiple provider-managed locations, instructors, calendars, classes, resources, and capacity pools. Each `CU-01` still selects one introductory offer/outcome and one approved `BookingRoute`. Supabase Auth proves identity; the application owns Organization/Workspace/Membership/roles/support grants under **OD-016**. OD-004/OD-020 and ADR-0020 prohibit the product from reproducing provider scheduling rules.
- **OD-009 and OD-010 are accepted:** the product launches as a paid, product-assisted managed pilot with individual tenant-scoped operator roles, visible/audited manual actions, measured effort, customer-only exact-version/material approval, occurrence-specific manual-publication authorization, private message drafts, deterministic booking, and fail-closed product takeover/pause. Self-service is deferred.
- **OD-001 through OD-014 are accepted, with the founder's manual-channel and staffing amendments:** the pilot uses manually published Instagram organic discovery, a hosted form as primary entry, tracked click-to-WhatsApp as secondary, and human-operated WhatsApp Business conversation. Facebook is excluded. Two trained/named friends of the founder volunteer without salary for the measured pilot and cover daily 10:00–20:00 IST with founder escalation; their actual minutes and market-rate shadow cost are recorded, and unpaid coverage cannot support permanent pricing or scale claims. Admission starts at 10 live Workspaces and grows only through measured capacity gates. The core domain remains channel-, provider-, and vertical-agnostic.
- A versioned vertical-pack contract supplies domain vocabulary, required business facts, qualification rules, conversion goals/outcomes, claims policy, prompts/templates, reason codes, and evaluation fixtures. Core modules may depend on that contract but must not import the yoga implementation.
- “Generic core” is an extensibility constraint, not permission to build a generic UI, arbitrary workflow builder, ecommerce flow, regulated-industry behavior, or a second vertical during the MVP.
- TypeScript, a monorepo modular monolith, shared domain/application packages, and web/API plus durable-worker execution units are accepted by **OD-015** and [ADR-0015](adr/ADR-0015-system-shape.md). **OD-037/[ADR-0037](adr/ADR-0037-node-next-pnpm-ui-test-toolchain.md)** fixes Node 24, pnpm 11, Next 16.2/React 19.2/TypeScript 6, source-owned accessible UI, deterministic rendering, and the test/lint/format stack.
- **OD-025/ADR-0025 accepts Supabase Pro PostgreSQL in Mumbai as the system of record, private Supabase Storage, Drizzle ORM/Kit plus `node-postgres`, tenant-aware constraints, and application-owned append-only events/audit/outbox/inbox.** OD-021/ADR-0021 accepts relational/full-text Business Brain retrieval and excludes pgvector initially. OD-036/ADR-0036 accepts PITR, independent database/object copies, tested restore, and portability targets.
- Social publishing and WhatsApp APIs are deferred by **OD-018/OD-019** and [ADR-0019](adr/ADR-0019-defer-meta-api-integrations.md). The initial MVP implements no Meta SDK, OAuth, credential, webhook, adapter, provider-specific schema, or automated channel action.
- No healthcare, financial, legal, child-directed, or other specially regulated workflow is assumed. Selecting a vertical that introduces such data or claims requires a new privacy and compliance review under **OD-027 Privacy/consent/retention/residency**, **OD-029 Accessibility/language/claims**, and **OD-033 Platform/legal/subprocessors**.
- Software/API paid-media buying, automatic budget/bid/audience changes, voice, full CRM behavior, and exact multi-touch attribution are outside this architecture’s initial execution path. OD-008 permits only a human-run paid-media handoff with exact authorization, hard caps, and manual evidence.

## 2. Architecture goals and quality attributes

Priority order matters when trade-offs conflict:

1. **No unauthorized action.** MVP manual-publication/message evidence, booking, and approval transitions must fail closed inside the product; any future channel/spending/payment action inherits the same invariant but is not MVP scope.
2. **No cross-tenant data access.** Tenant isolation is an invariant, not a best-effort filter.
3. **No duplicate product-controlled external effect.** Retries are expected for booking and jobs; manual post/message duplicates are operational incidents captured through evidence rather than something the software can guarantee against.
4. **Human control remains immediate.** An owner can pause a workspace, campaign, channel, or conversation, and can take over a lead conversation.
5. **Business truth is traceable.** Generated claims and recommendations point to verified facts or are explicitly marked as assumptions.
6. **The complete funnel is attributable.** Campaign, creative, lead source, conversation, booking, attendance, and outcome remain connected.
7. **The system is operable by a small team.** Prefer managed components, one repository, one release train, and a small number of deployment units.
8. **Vendors remain replaceable at strategically uncertain boundaries.** Do not build generic abstractions for internal code that has no credible alternative.

## 3. System context

~~~mermaid
flowchart LR
    Owner["Business owner / operator (yoga pilot)"]
    Lead["Prospective customer (trial attendee in pilot)"]
    Support["Support operator"]

    subgraph Product["AI Growth Agency product"]
        Web["Web UI + product API"]
        Core["Deterministic application core"]
        Agent["AI orchestration boundary"]
        Jobs["Durable jobs + scheduler"]
    Adapters["Booking/model/storage adapters"]
        DB[("Relational system of record")]
        Blob[("Private object storage")]
    end

    Channels["Instagram manual + hosted landing"]
    Messaging["WhatsApp Business app (human-operated)"]
    Calendar["Calendar / booking"]
    Models["Model provider(s)"]
    Telemetry["Error, trace, and product analytics"]

    Owner --> Web
    Support --> Web
    Lead --> Channels
    Lead <--> Messaging
    Owner -. manual publish/evidence .-> Channels
    Owner -. manual read/send/evidence .-> Messaging
    Support -. delegated manual action .-> Channels
    Support -. delegated manual action .-> Messaging
    Web --> Core
    Core <--> DB
    Core <--> Blob
    Core --> Agent
    Agent --> Models
    Core --> Jobs
    Jobs --> Core
    Jobs --> Adapters
    Adapters <--> Calendar
    Channels --> Web
    Calendar --> Adapters
    Web -. telemetry .-> Telemetry
    Core -. telemetry .-> Telemetry
    Agent -. redacted traces .-> Telemetry
    Jobs -. telemetry .-> Telemetry
~~~

The product has no Meta connection. Dashed channel arrows represent human action outside the product followed by actor-attributed evidence entry. AI can only propose private drafts/checklists. Booking and any other product-controlled external action pass through deterministic authorization and adapters.

## 4. Deployment units and major modules

### 4.1 Physical deployment shape

The modular monolith has two execution shapes built from the same versioned repository:

| Deployment unit | Responsibilities | Must not own |
|---|---|---|
| Web application | Owner UI, authenticated product API, public lead forms, booking OAuth/callbacks/webhook ingress, manual channel work/evidence views, read models | Long-running generation, durable reminders, or retry loops inside a request |
| Durable job runtime | Generation workflows, manual due-work reminders, booking webhook processing/reconciliation, analytics aggregation, weekly memos | Independent domain rules, Meta channel dispatch, or a separate copy of business state |

They share the same domain and application modules and the same system of record. Separating execution shape protects request latency and permits independent worker concurrency without creating separately owned microservices.

### 4.2 Logical modules

| Module | Owns | Exposes to other modules |
|---|---|---|
| Identity and Tenancy | Users, organizations, workspaces, memberships, roles, support access grants | Authenticated actor and mandatory tenant context |
| Business Brain | Business profile, sourced facts, FAQs, offers, audiences, brand rules, restrictions, verification state | Immutable verified-context snapshots and citation references |
| Campaigns | Goals, briefs, assumptions, funnel definition, KPIs, offer/audience versions, `CU-01` limits, Active/Closed/cancel/tail lifecycle | Campaign snapshots, activation eligibility, contact-campaign lock, and valid lifecycle commands |
| Content Studio | Typed copy/layout proposals; the six required Instagram `CU-01` items and versions; captions; governed media provenance; brand tokens; templates; canonical render manifests; deterministic outputs/checksums; manual WhatsApp playbook/drafts; QA results | Previewable activation bundle, exact content fingerprints, and immutable approval inputs |
| Approvals | Approval requests, decisions, comments, exact approved envelope, revocation and expiry | Authoritative “may execute version X under policy Y” decision |
| Policy and Consent | Claim rules, channel restrictions, manual contact playbook, service/quiet hours, recorded opt-in/out, draft/due-work suppression, takeover and emergency stop | Deterministic allow/deny/require-human guidance with reason codes |
| Workflow and Scheduling | Workflow instances, exact manual occurrence authorization, due-work intent, schedule occurrences, conversion-tail reminders, retries for internal jobs, cancellation, outbox records | Human due work and authoritative workflow state |
| Integrations | Booking/model/storage connection metadata, encrypted credential references, provider capability/status, webhook inbox, adapter receipts; future provider-neutral channel seams only | Narrow approved-provider commands and normalized events; no Meta adapter |
| Leads and Conversations | Hosted-form enrollment, manually reconciled WhatsApp conversations, contacts, leads, immutable campaign source, private drafts, qualification facts, versioned transparent decisions/evidence, human-review state, reasoned override, takeover and competing-campaign lock | Current manually evidenced conversation snapshot and permitted guidance |
| Booking and Outcomes | External booking connections/routes and integration tier; mapped provider locations/instructors/classes/resources; provider-supplied options; booking intent/reference/evidence/discrepancy; human notification due work; attendance, won/lost, lost reason | Tier-labelled, in-tail booking and funnel outcome events without owning provider scheduling rules |
| Attribution and Learning | Append-only domain events, attribution links, funnel projections, weekly and close-out memos, recommendations, experiment proposals | Evidence-backed aggregates; never causal certainty without evidence |
| Audit and Usage | Append-only audit events, actor/model/action metadata, usage and cost ledger | Queryable compliance history and quota status |

Billing is not required in the first campaign-to-outcome slice. Under accepted OD-031, the first-five human-led pilot uses manual, accountant-approved invoicing: INR 4,999 plus applicable tax per 28-day cycle through 100 new Leads or INR 6,999 preselected for 101–200, with an INR 1,000 deposit credited to cycle one and no setup fee. Entitlement and invoices remain application records even without checkout automation. The future `BillingPort` is global-ready rather than INR-specific: country/currency/tax/payment method, localized price, invoice, refund/cancellation policy, and supported-jurisdiction activation are canonical application concepts; provider-specific checkout and settlement remain adapter records. Dodo is preferred only after the exact software offer and intended country coverage are approved under its policies. Request account details from the founder during that approved development task, not during foundation work. See OD-031 and the [Dodo feasibility review](../decisions/DODO_PAYMENTS_FEASIBILITY.md).

### 4.3 Module-boundary rules

- Each module owns its tables and state transitions, even though all tables live in one database.
- Another module may not mutate those tables directly. It calls an application command or consumes a versioned domain event.
- Cross-module reads use narrow query services or purpose-built read models; dashboards may denormalize without becoming a second source of truth.
- A database transaction may span modules only through one application use case and only when atomicity is required. Asynchronous follow-up uses the transactional outbox.
- Domain code does not import provider SDKs, HTTP clients, model SDKs, UI components, or job-runner APIs.
- Provider-specific fields stay in adapter-owned records or structured metadata and never become required domain concepts without an explicit architecture decision.
- “Agent” is a logical proposal role, not a separately deployed service or a requirement to use an agent framework. Under OD-023/ADR-0023, roles share the application-owned `ModelPort` and static task-policy package; the initial adapter uses direct OpenAI Responses.

### 4.4 `CU-01` deterministic aggregate and policy

The exact campaign unit accepted by OD-011 and recorded in `MVP_SCOPE.md` is owned across modules but enforced as one versioned policy contract. Its implementation remains gated by founder/G0 authorization:

- **Workspace/booking scope:** one independently governed studio business may contain multiple provider-managed locations, instructors, calendars, classes, resources, and pools. Each campaign selects one introductory offer/outcome and one approved `BookingRoute`, which may span those resources.
- **Activation:** only one Active campaign per Workspace. Activation requires one approved brief, exactly four approved Instagram single-image items, exactly two approved Instagram carousels of at most five slides, one approved landing/form, one manual WhatsApp playbook, and proven channel/rota/evidence readiness. The owner may schedule fewer items after activation.
- **Publications:** no more than six exact Instagram occurrences. The owner's schedule action authorizes an approved content version, account, and timestamp and creates human due work. A timestamp-only owner edit is audited without content reapproval; account/version/out-of-window changes invalidate it. Actual actor/time/content hash/public reference or screenshot/verification state is recorded after manual execution; no provider confirmation is inferred.
- **Active and natural close:** Active lasts no more than 28 days. Natural close disables new manual-publication due work, landing/form enrollment, and promotion. A pre-close unbooked lead may finish only its original seven-day manual work window and never beyond close+7. Normal cancellation stops unbooked drafts/due work and revokes unfinished occurrences; a post already published remains evidenced and cannot be recalled by software.
- **Booked transactional tail:** a lead booked before or during the natural-close lead tail may receive human-handled confirmation/reminder/first reschedule-or-cancel/no-show work only through close+14 days. Slots outside close+14 are not offered. Normal cancellation preserves only existing booked work; emergency stop suppresses all product drafts/reminders.
- **Campaign overlap:** a later campaign may activate after close, but a Contact with non-terminal prior campaign work cannot enter a competing product-guided workflow; new interest is retained and handed to a human.
- **Messaging:** the product sends no WhatsApp messages and owns no inbox, token, template, delivery status, or provider quota. It may produce private grounded drafts/checklists from manually entered facts. Humans review/edit/send in the official Business app and record actor/time/purpose/evidence. A click or draft is never a Lead, consent, or send.
- **Manual follow-up timers:** due work may suggest the accepted 24/72-hour no-response steps, appointment reminder, first booking-change notice, and no-show recovery. Each reminder rechecks recorded tail, consent/opt-out, service hours, latest manually entered response, suppression, and takeover. A human decides and sends; the product never claims delivery.
- **Hours and human coverage:** service is daily 10:00–20:00 `Asia/Kolkata`; median first substantive response target is ≤15 minutes and p95 ≤30 minutes in-window. Hosted forms record immediately. Outside the window, the product cannot observe WhatsApp inbound and sends no receipt; operators reconcile at the next window.
- **Learning:** the system produces at most one evidence-labelled memo per Active week and one close-out memo; neither can activate a campaign or change budget.

Campaigns owns lifecycle/activation, Content owns exact assets/playbook, Approvals owns immutable versions, Policy and Consent owns recorded contact/hour/suppression guidance, Workflow owns occurrence/tail due work, Leads owns contact exclusivity/manual reconciliation, and Booking owns connection/route mappings, normalized references/events, evidence tier, discrepancies, and tail enforcement. The provider owns scheduling/routing/capacity. No AI role may reinterpret a `CU-01` limit or mark manual work complete.

The accepted OD-032 capacity envelope is distinct from those hard product rules. Load/cost/operations tests target 10 Workspaces, at most 10 cohort activations per rolling 28 days, 200 hosted-form or manually reconciled Leads per Workspace, and 60 planned/manual Instagram publications across the cohort. Technology spend is capped at INR 10,000 per calendar month during development/staging, INR 15,000 one time for production-readiness tests/model evaluation/recovery drills, and INR 30,000 per calendar month for the live pilot through 10 Workspaces. Live planning allocates INR 16,000 to Vercel/Supabase/PITR, INR 8,000 to OpenAI, INR 2,000 to AWS recovery/KMS plus monitoring/email, and INR 4,000 reserve; the two commercial tiers receive INR 750/1,250 AI allowances. Operator time is shadow-costed initially at INR 200/hour. Customer advertising and OD-033 legal/counsel work are separate.

Usage and cost notifications fire at 50%, 75%, and 90% of each applicable aggregate or per-cycle ceiling. Reaching 100% preserves customer data and continues accepting/reconciling inbound Leads, but blocks new campaign activation and optional expensive generation pending founder review. It never creates a surprise customer charge or silently switches to an unevaluated model/config. Crossing a capacity assumption likewise alerts and blocks new activation, never inbound evidence. Expansion to 20 and toward 50 requires explicit founder approval plus four passing weeks, no severe trust incident or missed critical target, p90 operator work ≤2 hours/Workspace/week, and ≥30% rostered reserve. The runtime hard limits are the accepted one-Active and `CU-01` bounds; there is no automated-message quota because there is no send path.

## 5. End-to-end data flow

~~~mermaid
flowchart TD
    A["1. Import approved website + structured owner fields; files deferred"] --> B["Untrusted content inspection + source record"]
    B --> C["Context agent proposes facts with citations/confidence"]
    C --> D{"Owner verifies facts, claims, offers, restrictions"}
    D -->|Approved snapshot| E["Strategy agent proposes campaign"]
    D -->|Conflict or gap| C
    E --> F["Copy/creative roles propose exact Instagram assets/form/manual WhatsApp playbook"]
    F --> G["Deterministic checks + AI review findings"]
    G --> H{"Owner approves exact campaign/content envelope"}
    H -->|Rejected/change requested| E
    H -->|All activation artifacts approved| I["Owner-authorized manual occurrence + due work"]
    I --> J["Named human publishes exact Instagram version"]
    J --> K["Actor/time/hash/URL-or-screenshot/verification evidence"]
    K --> M["Hosted-form Lead or manually reconciled WhatsApp Lead"]
    M --> N["Private grounded draft + qualification guidance"]
    N --> O["Consent/tail/hours/suppression/takeover guidance"]
    O --> P["Human reviews, sends in WhatsApp Business, records evidence"]
    P --> Q["Availability read + deterministic booking"]
    Q --> R["Attendance/won/lost outcome"]
    R --> S["Deterministic funnel aggregation"]
    S --> T["Analytics agent proposes evidence + next experiment"]
    T --> H
~~~

### 5.1 Business onboarding

1. Guided owner-entered fields, one owner-approved business domain, and descriptive metadata from an approved `BookingRoute` enter an untrusted ingestion boundary and create provisional candidates. Broad/live-web sources, files, and conversation-derived learning are excluded by OD-021/ADR-0021.
2. The bounded website importer uses a dedicated server-side fetcher and enforces this contract:
   - accept only normalized HTTP(S) URLs on the one owner-approved business domain; reject embedded credentials, unsupported schemes, and unapproved cross-domain redirects;
   - resolve and validate every connection and redirect target, reject loopback/private/link-local/multicast/reserved IPv4 and IPv6 ranges, bind the connection to the validated address, preserve TLS hostname validation, and prevent environment-proxy or DNS-rebinding bypasses;
   - use bounded `HEAD`/`GET` retrieval without browser JavaScript, cookies, authentication, form submission, or recursive embedded-resource crawling;
   - allow only explicitly supported text/HTML response types, cap redirect hops, connect/read duration, compressed bytes, decompressed bytes, and extracted text, and abort the stream when a bound is exceeded; and
   - store sanitized permitted source material plus final URL, capture time, content type, checksum, and fetch/extractor version as provenance. Every extracted value remains provisional until authorized verification.
   Any later file import requires an accepted amendment plus MIME/signature/size/page limits, malware quarantine, safe parsing, private storage, retention, and deletion controls.
3. The Business Context role receives only extracted, bounded content and proposes facts with source location, confidence, conflict status, and expiry if relevant.
4. The deterministic Business Brain service stores candidates. Only an authorized human can mark prices, claims, offers, policies, or disputed facts as verified.
5. A verified-context snapshot receives an immutable version identifier for later campaign and conversation traces.

### 5.2 Campaign and content creation

1. The owner supplies the attended-trial goal, campaign window, one introductory offer, one target audience, and one approved provider-managed `BookingRoute`, which may expose multiple locations/instructors/classes/resources.
2. The application validates required fields and passes a tenant-scoped, minimized snapshot to the Strategy role.
3. The typed proposal is schema-validated, persisted as a draft version, and shown with assumptions and source citations.
4. Copy and creative roles work from the same approved brief snapshot and propose the exact six Instagram content items plus landing/form and manual WhatsApp playbook/private drafts. Each output records prompt-template version, model/provider, source fact IDs, usage, and generation timestamp.
5. Deterministic format, accessibility, forbidden-claim, and platform checks run alongside AI review findings. AI review cannot override a deterministic failure.

### 5.3 Approval, scheduling, and manual publication

1. The owner approves an **Approval Envelope**, not a mutable campaign row. The envelope identifies the exact brief, offer, audience, all six required Instagram items/captions, landing/form, manual WhatsApp playbook/draft set, and other material versions.
2. Approved records are immutable. A material edit creates a new version and invalidates or narrows the prior approval.
3. The owner's schedule command authorizes an exact approved version, Instagram account, and timestamp and creates a manual occurrence plus due-work record atomically. Timestamp-only edits are audited without content reapproval; account/version/out-of-window edits invalidate it.
4. When due, the product re-checks tenant status, pause, approval validity, and occurrence state, then presents the exact asset/caption and checklist to the named human. It makes no Meta request.
5. After acting in Instagram, the human records actor, actual time, content hash, public URL where available, screenshot/evidence, notes, and `verified`/`unverified` state. Due work alone never becomes `published`.
6. Missed access, late work, wrong-version evidence, missing evidence, and contradictions enter explicit resolution queues. A published post cannot be recalled by the product.

### 5.4 Lead capture, qualification, and booking

1. The Active campaign landing/form creates a Contact, Lead, LeadSource, and consent record. A tracked click-to-WhatsApp is recorded only as a click. A named operator may reconcile an actually observed WhatsApp conversation into Contact/Lead/Conversation records with actor/source/consent/evidence and explicit uncertainty. Closed campaigns reject new enrollment.
2. Immutable origin context includes workspace, campaign, creative/content version, offer, platform IDs, UTM/click IDs, consent evidence, and timestamps.
3. The Lead Concierge proposes a private reply/checklist and structured qualification update using verified facts and manually entered conversation evidence. A human reviews/edits/sends externally and records actual action; the product never reads or sends WhatsApp.
4. Policy and consent services suppress drafts/reminders under recorded service-hour, consent/opt-out, tail, takeover, or pause state. Outside hours the product sends nothing and cannot observe WhatsApp inbound. Competing work, human request, low confidence, or sensitive topics remain human-owned.
5. The Booking service uses the configured tier. A deep adapter reads provider-managed options and creates/reconciles idempotently; a tracked hosted route hands off with campaign/Lead metadata and ingests available evidence; an operator-assisted route records actor/provider reference/evidence. Options may span mapped resources, but only the provider calculates availability/routing/capacity. API confirmation is claimed only for deep receipts. Booking notices are human-handled under ADR-0019.
6. Attendance, won/lost outcome, and reason are owner-verified or normalized from a trusted integration and appended to the funnel history.

### 5.5 Learning loop

1. Deterministic attribution rules connect source, qualification, booking, attendance, and outcome events. Corrections append new evidence; they do not rewrite history invisibly.
2. Funnel projections and sample sizes are calculated deterministically.
3. During Active, the Analytics role may produce one typed weekly memo; after the campaign/tail reconcile it may produce one close-out memo. Each contains findings, confidence, data gaps, and at most one experiment proposal.
4. A recommendation cannot alter a live campaign or budget. It re-enters campaign approval as a new proposal.

## 6. AI-agent boundary

### 6.1 Agent roles are capabilities, not authorities

| Role | Allowed output | Never allowed directly |
|---|---|---|
| Campaign Orchestrator | Proposed next step, task decomposition, missing information, approval request | Own authoritative workflow state, execute tools with side effects, bypass a failed step |
| Business Context | Candidate facts, citations, confidence, conflicts, missing fields | Verify disputed facts or publish them as truth |
| Strategy | Campaign brief, funnel, assumptions, KPI, channel and experiment proposal | Guarantee outcomes, commit spend, activate a campaign |
| Copy | Versioned copy variants tied to supplied facts | Invent price, discount, claim, policy, testimonial, or availability |
| Creative Direction | Visual plan, prompt, layout or storyboard proposal | Approve brand/legal risk or publish media |
| Brand and Compliance Review | Findings, risk labels, suggested corrections | Override owner restrictions or deterministic policy |
| Lead Concierge | Private candidate reply/checklist, qualification facts, confidence, handoff recommendation | Read or send WhatsApp, claim delivery, negotiate outside rules, book a fabricated slot |
| Analytics and Experiment | Finding, evidence links, confidence, proposed experiment | Claim unsupported causality or modify campaign/budget |

The Campaign Orchestrator can reason about workflow state, but the Workflow module is the authoritative state machine. This removes the ambiguity in the phrase “agent owns workflow state.”

### 6.2 Shared AI runtime responsibilities

- Build a minimal, tenant-scoped context snapshot from authoritative application data.
- Bind each task class to an explicitly evaluated OpenAI model/config through the static task-policy registry; never allow model-selected routing or an unevaluated fallback.
- Use versioned prompt templates and versioned structured-output schemas.
- Validate syntax, domain constraints, citations, allowed fact IDs, and proposed tool arguments.
- Permit only narrow proposal/read tools from the task allowlist. Provider built-in web/file/computer/shell/code/MCP tools are disabled; model tools cannot approve, execute Meta activity, spend, mutate provider scheduling, or write domain state directly.
- Record model/provider, request correlation ID, prompt-template version, structured output, latency, token/media use, safety decision, and evaluation result.
- Redact secrets and minimize personal data before model calls and traces.
- Time out, retry cautiously, and surface a recoverable failure. Model retries must not imply retries of an external side effect.

### 6.3 Human and policy gates

Autonomy is a policy on a workflow, not a model capability:

- **Assisted:** every campaign, asset, schedule, and outbound sequence requires human approval.
- **Supervised manual:** approved campaign policy creates exact human publication due work and private reply guidance; humans perform every Instagram/WhatsApp action and record evidence.
- **Bounded autonomous:** not enabled until explicit thresholds, evaluation evidence, kill switches, and incident runbooks are approved.

OD-010 accepts the initial **supervised manual** mode: exact customer approval, occurrence-specific human publication, private messaging guidance, and deterministic booking. [ADR-0019](adr/ADR-0019-defer-meta-api-integrations.md) defers all Meta channel execution; broader bounded autonomy is not enabled.

## 7. Deterministic service boundary

The following decisions must be made by code and stored policy, not by an unconstrained model:

| Service | Required invariant |
|---|---|
| Authentication and authorization | Every command has an authenticated actor or verified system principal and an explicit workspace scope |
| Business-fact verification | Only authorized humans promote restricted facts to verified status |
| `CU-01` lifecycle | One Active campaign, 28-day cap, complete activation bundle, Closed/cancel/tail/contact-lock transitions and landing state are deterministic |
| Version and approval | Approval applies to one immutable envelope; material edits require re-approval |
| Policy and capacity | `CU-01` limits, forbidden claims, service hours, manual contact playbook, workload/admission thresholds, and pauses are enforced consistently inside the product |
| Consent and suppression | Recorded opt-out or missing required consent suppresses product drafts/due work regardless of agent suggestion; off-platform enforcement is not claimed |
| Workflow state machine | Only legal, compare-and-set state transitions commit |
| Scheduler | Exact manual occurrence authorization, timezone, active window, close/cancel, tail eligibility, due-work, and lateness behavior are deterministic |
| External action/evidence boundary | Booking side effects use authorization/idempotency; manual channel actions require exact authorization and actor-attributed evidence, never an inferred provider receipt |
| Lead identity and source | Dedupe rules and original source evidence are explicit and reviewable |
| Booking | Deep bookings use current provider state/receipt and idempotency; hosted/manual bookings retain explicit evidence/confidence. All use one approved offer/route and never imply attendance or reproduce provider routing/capacity |
| Attribution | Rules and corrections are versioned; generated prose cannot change funnel counts |
| Audit | Security, approval, policy, external action, takeover, and model events are append-only |
| Capacity and cost | `CU-01`/admission limits, AI/media/job budgets, and measured manual workload cannot be overridden by a prompt |

### 7.1 External-action command pipeline

Every product-controlled booking command follows this order. Manual Instagram/WhatsApp work uses the same authentication, authorization, version, policy, and audit principles but ends in human due work plus later evidence—not adapter dispatch. Any future channel/payment/spend command must inherit the full pipeline through a new approved ADR.

1. Authenticate the human or system principal.
2. Resolve and authorize the Organization and Workspace.
3. Validate the typed command and its schema version.
4. Check legal state transition and optimistic-concurrency version.
5. Evaluate policy, consent, pause, capacity, and budget constraints.
6. Verify the exact approval envelope when approval is required.
7. Reserve or confirm a stable idempotency key.
8. Commit domain transition, audit event, and outbox intent atomically.
9. Dispatch through the selected adapter.
10. Persist the normalized provider receipt and reconcile uncertain results.

A denial returns a stable reason code and creates an audit event. An agent cannot turn a denial into an allow decision by retrying or rephrasing.

## 8. Data architecture and tenancy

### 8.1 Systems of record

| Data class | Recommended home | Notes |
|---|---|---|
| Transactional domain data | Supabase Pro PostgreSQL, Mumbai | One source of truth for tenant, campaign, content, lead, booking, approval, and workflow state; Drizzle schema/queries and reviewed committed SQL migrations |
| Media and approved source objects | Private Supabase Storage | Website snapshots and generated media use signed access/checksums/lifecycle; document-source objects require a future accepted OD-021 amendment and its safety/privacy controls |
| Search/retrieval | PostgreSQL relational metadata and full text; no MVP vector retrieval | Return only current verified Workspace/use-case facts and explicit unknown; a measured retrieval failure plus accepted amendment is required before pgvector |
| Domain and product events | Append-only event tables plus analytics export | Operational event history stays queryable even if the product analytics vendor changes |
| Secrets | Vercel sensitive environment variables plus AWS KMS Mumbai credential envelopes reached through Vercel OIDC | **OD-030 accepted / [ADR-0030](adr/ADR-0030-vercel-sensitive-env-aws-kms-credential-envelope.md):** never place raw tokens in domain rows, prompts, workflow journals, logs, analytics, browser code, or source control |
| Audit evidence | Append-only restricted tables with backups/export | Separate from mutable product-event analytics |

Provider, region, persistence, and private object storage are accepted by **OD-025/ADR-0025**. **OD-036/[ADR-0036](adr/ADR-0036-backup-restore-and-provider-portability.md)** accepts seven-day PITR, independent 35-day database/object backups, measured internal recovery targets, and restore/portability evidence required before paid production.

KMS is an accepted control, not a reason to build a speculative provider integration. Foundation work establishes typed secret configuration, credential-free ports/fakes, and the required synthetic federation/security spike. Provision the tenant-credential envelope path only before the first approved adapter that must store a real Workspace credential; the booking-provider inventory may result in no deep adapter. Once such a credential is in scope, every ADR-0030 OIDC, KMS, context-binding, rotation, outage, and restore control is mandatory before the credential is accepted.

### 8.2 Tenant model and isolation

- Organization is the ownership boundary; in the yoga MVP each Workspace is one independently governed studio business and may map multiple provider-managed locations/instructors/classes/resources. The core tenant model remains neutral. Multi-location/resource routing is not calculated by the product; opaque provider mappings and normalized evidence are modeled under ADR-0020.
- Every customer-owned row carries Organization ID and Workspace ID where meaningful. Global reference data is explicitly marked and read-only to tenants.
- Application services require a TenantContext parameter; unscoped repositories or “find by ID” methods are prohibited for tenant data.
- Authorization uses membership and role plus resource-level checks. UI hiding is not authorization.
- RLS and restricted privileges protect exposed/private app schemas as defense in depth; application-layer tenant enforcement remains mandatory.
- Foreign keys include the tenant key where feasible so cross-workspace associations fail at the database boundary.
- Automated isolation tests attempt horizontal access, guessed IDs, background-job context loss, cache bleed, object-key bleed, and support-role misuse.
- Cache keys, job payloads, trace fields, object paths, idempotency records, and adapter credentials all include tenant scope.
- Support access is time-bound, purpose-bound, least-privilege, and audited; there is no silent “super-admin browse everything” path.

### 8.3 Versioning and immutable evidence

- Verified Business Brain snapshots, campaign briefs, offers, audiences, content, media manifests, policies, and approvals are versioned.
- Media uses a checksum; approval uses a canonical manifest plus cryptographic digest so later edits are detectable.
- Audit and external-action receipts are append-only. Corrections reference the superseded record.
- Original lead source is immutable; attribution corrections add a new rule version and explanation.
- Model output is evidence of a proposal, not business truth. The accepted domain version is stored separately.

### 8.4 Data minimization and lifecycle

OD-027 already defines the default purposes, minimization boundary, and maximum retention periods: 30 days for raw conversation/trace evidence, 90 days for identifiable Lead operational records, 365 days for minimized campaign/approval/audit evidence, 12 months for pseudonymous analytics, and 35 days for off-provider backups, with documented statutory/contractual periods for account, invoice, tax, and dispute records. Before any live data, implementation and OD-033 evidence must map each actual field/object/processor to one of those purposes and prove these capabilities:

- purpose and consent evidence;
- opt-out and suppression that survive marketing-data deletion where legally appropriate;
- tenant export;
- lead data access/correction/deletion workflow;
- workspace closure and credential revocation;
- object and cache deletion propagation;
- processor/subprocessor inventory;
- retention jobs with auditable results.

Geography plus controlled cross-border privacy/retention are accepted by **OD-002** and **OD-027/[ADR-0027](adr/ADR-0027-privacy-consent-retention-and-cross-border-processing.md)**. **OD-033 Platform/legal/subprocessors** must validate the actual notices, contracts, processors, and jurisdictional obligations before production.

## 9. External integrations and adapter strategy

### 9.1 Ports

| Port | Internal contract | Candidate implementations; decision status |
|---|---|---|
| Identity | Verify Supabase session/provider subject and normalize a local actor; application services resolve invitations, Workspace membership, fixed customer/internal roles, time-bounded support grants, MFA level, and revocation | **OD-016 accepted / [ADR-0016](adr/ADR-0016-auth-tenancy-roles.md):** Supabase Auth; application-owned authorization; provider selection reopens if the regional data-stack decisions become incompatible |
| Transactional Auth Email | Deliver invite-only passwordless OTP/magic-link and security emails initiated by Supabase Auth; no campaign, nurture, bulk, or marketing send contract | Required for real invitations by **ADR-0016**. Select and validate a production SMTP/delivery provider under OD-027/OD-033 before use; Supabase's default email service is development-only. This port does not reopen excluded email marketing automation. |
| Model | Generate typed candidate, validate strict schema/tool calls, and normalize provider request/usage/latency/error metadata | **OD-023/OD-026 accepted:** application `ModelPort` with direct OpenAI Responses adapter, static evaluated task policies, layered validators, adversarial gates, human review, and sampled monitoring; [ADR-0023](adr/ADR-0023-direct-openai-responses-model-port.md), [ADR-0026](adr/ADR-0026-layered-ai-safety-and-evaluation-gates.md) |
| Decorative Image Generation (optional) | Produce only non-factual background/texture/pattern/illustration candidates with provenance for deterministic composition and human review | No provider is selected or required for the MVP; customer-approved or rights-recorded media is the default. Any activation needs a separate adapter/provider record, OD-022 restrictions, task-specific OD-026 evaluation, OD-027 minimization/retention, and OD-033 processor/legal readiness. It is not part of the text/reasoning `ModelPort`. |
| Social Publishing (future seam only) | Future capability/publish/reconcile contract; no initial implementation | **OD-018 deferred / [ADR-0019](adr/ADR-0019-defer-meta-api-integrations.md):** initial Instagram work is human due work plus evidence; Facebook excluded |
| Messaging (future seam only) | Future inbound/send/status contract; no initial implementation | **OD-019 deferred / [ADR-0019](adr/ADR-0019-defer-meta-api-integrations.md):** WhatsApp is human-operated; private drafts/manual evidence only |
| Booking | Configure deep/hosted/manual route; read/create/reconcile where supported; normalize references/events/evidence without owning scheduling rules | One evidence-selected deep provider at most plus generic tracked-hosted and operator-assisted tiers; **OD-020 accepted / ADR-0020** |
| Object Storage | Put/get/delete private object, signed URL, checksum, provenance/licence metadata, lifecycle metadata | **OD-022/OD-025 accepted:** private Supabase Storage behind the application port; [ADR-0022](adr/ADR-0022-template-first-creative-media-pipeline.md), [ADR-0025](adr/ADR-0025-supabase-postgres-drizzle-storage-events-audit.md) |
| Durable Work | Commit/reconcile outbox intent; start/inspect/cancel versioned run; durable sleep/retry; execute idempotent current-state-checking steps | **OD-024 accepted / [ADR-0024](adr/ADR-0024-vercel-workflow-durable-runtime.md):** stable GA Vercel Workflow SDK behind `DurableWorkPort`; product DB remains authoritative |
| Product Analytics | Emit allow-listed, pseudonymous event projection without changing product truth | **OD-028 accepted / [ADR-0028](adr/ADR-0028-product-owned-metrics-posthog-sentry-otel.md):** PostHog Cloud EU behind a port; no broad autocapture/replay/raw content; production waits for privacy/legal approval |
| Observability | Capture scrubbed error, structured log, metric, and trace using safe correlation IDs | **OD-028 accepted / [ADR-0028](adr/ADR-0028-product-owned-metrics-posthog-sentry-otel.md):** Sentry EU/DE, structured Vercel logs, OpenTelemetry conventions; no raw bodies/prompts/messages/secrets |
| Billing (future) | Global country/currency/price/tax/payment/refund policy; hosted checkout/customer portal; subscription/invoice/payment/refund/dispute webhooks | Outside the managed-pilot MVP; pilot invoices manually. Dodo is preferred only after written offer/country eligibility. Country activation is allow-listed and provider records do not own entitlement; **OD-031 Pricing/global billing** |
| CRM Sync | No MVP adapter; optional governed tenant-scoped CSV handoff only | **OD-013 accepted / OD-034 deferred:** reopen on a common two-partner target/workflow or blocking paid-partner need after native schema stability |

### 9.2 Adapter rules

These rules apply to approved live adapters such as booking. Social publishing and messaging remain future seams under ADR-0019 and must not be wired into the initial composition root.

- Domain modules speak canonical internal contracts. Adapters own OAuth, API versions, rate limits, templates, media restrictions, provider IDs, and error translation.
- Each connection stores declared capabilities and health; the product does not show an action a connected account cannot support.
- Inbound webhooks are treated as untrusted: verify signature and timestamp, enforce size limits, store a dedupe key, acknowledge quickly, then process asynchronously.
- Retain the minimum raw webhook data needed for reconciliation and support; apply a short, explicit retention period.
- External IDs and request/response fingerprints are stored beside normalized records so operations can be reconciled without relying on logs.
- Contract tests use recorded, redacted fixtures and provider sandboxes. A fake adapter supports deterministic end-to-end tests.
- Rate limits and platform policy errors are first-class states, not generic exceptions.
- No provider is selected from memory alone. Before implementation, verify current official documentation, review requirements, permissions, pricing, regional availability, retention, limits, and deprecations; record the dated result in `docs/research` and the choice in an ADR.

### 9.3 Build-versus-buy recommendation

Build the campaign, approval, manual-work/evidence, source-aware lead, attribution, and learning logic because these form the product wedge. Buy or integrate authentication, its narrowly scoped transactional auth-email delivery, durable execution, relational hosting, object storage, calendar transport, and error tracking. Social/WhatsApp transport, payment transport, and marketing-email automation are deferred. Keep future ports thin and do not implement speculative Meta, billing, marketing-email, or image-generation adapters.

## 10. Security and trust boundaries

### 10.1 Trust zones

| Zone | Trust level | Principal controls |
|---|---|---|
| Browser and public forms | Untrusted | Secure session cookies, CSRF protection where applicable, schema/field/body limits, content security policy, per-route/IP/public-campaign-token throttles, dedupe/idempotency, spam quarantine, anomaly alerts, and an auditable form-disable control |
| Approved OAuth callbacks and webhooks | Untrusted external | State/nonce, signature and timestamp validation, replay protection, fixed redirect allow-list; no Meta ingress in initial MVP |
| Application core | Trusted only after authorization | Tenant context, role/resource checks, typed commands, policy decisions, audit |
| AI runtime and model providers | Untrusted for authority; external processor for data | Minimal context, no secrets, prompt-injection isolation, structured validation, no direct side effects |
| Job runtime | Trusted system principal with scoped capability | Signed/versioned job payloads, tenant scope, least privilege, idempotency and audit |
| Approved integration adapters | Privileged side-effect boundary | Encrypted credentials, narrow scopes, policy/approval recheck, receipts, egress allow-list; no Meta adapter |
| Database and object storage | Sensitive data boundary | Encryption, private networking/access policies, backups, tenant isolation, least-privilege service roles |
| Human support | Privileged and exceptional | Just-in-time access, purpose and expiry, masking, complete audit |

### 10.2 Required threat controls

| Threat | Control |
|---|---|
| Cross-tenant object or query access | Tenant-scoped service APIs, compound keys, isolation tests, optional database row-level security |
| Stolen approved-provider OAuth/API token | Managed secrets, envelope encryption, minimal scopes, rotation/revocation, never expose to AI or browser; no Meta token stored |
| Prompt injection through a website or lead message (and a file only if later approved) | Treat content as data, delimit and label sources, allow-list tools, prohibit source text from defining instructions, validate all tool arguments |
| Server-side request forgery during website import | Dedicated non-browser fetcher; one approved domain; HTTP(S) only; validate and bind every DNS/redirect target; deny non-public IPv4/IPv6; preserve TLS hostname checks; no cookies/auth/JS/proxy bypass; supported content types plus redirect/time/compressed/decompressed-size limits |
| Malicious upload, if file import is later approved | Extension and MIME verification, size/page limits, malware scan/quarantine, private storage, safe parser before enabling the route |
| Forged or replayed approved-provider webhook | Provider signature, timestamp window, nonce/dedupe record, rate limit |
| Unauthorized manual publish/message | Exact approval/guidance state, named actor, delegated access, emergency runbook, evidence/audit sampling; product never claims it can prevent all off-platform action |
| Duplicate/wrong post or message; duplicate booking | Manual channel evidence/reconciliation and trust-incident handling; booking uses stable idempotency, uniqueness, and provider reconciliation |
| Personal data in logs or model traces | Field allow-list, redaction, sampling controls, restricted trace access, retention |
| Owner takeover race | Atomic product guidance ownership transition; drafts/reminders recheck takeover; off-platform action remains human responsibility |
| Model-created false claim | Verified fact IDs, citation validation, forbidden-claim rules, human approval, production evaluation sampling |
| Public-form spam, capacity capture, or cost exhaustion | Reject over-limit payloads before durable work; combine route/IP/public-campaign-token rate limits with duplicate signals rather than trusting IP alone; quarantine suspected spam outside qualification/response queues and accepted Lead-volume counts until reviewed; retain minimal evidence under OD-027; alert operators and allow a campaign form to be disabled without affecting other tenants |
| Auth, model, media, or job cost exhaustion | Tenant quotas, per-principal rate limits, task budgets, retry ceilings, anomaly alerts, and OD-032 fail-closed activation/optional-generation behavior while preserving valid inbound evidence |

### 10.3 Security invariants

- Secrets never enter prompts, analytics events, logs, browser bundles, source control, or job payloads.
- A model output is never used as an authorization, consent, approval, identity, or budget decision.
- Product-controlled external actions can be traced to actor/system principal, tenant, policy decision, approval where required, idempotency key, and provider receipt. Manual Instagram/WhatsApp actions use actor/time/version/purpose/evidence/verification instead.
- Emergency pause is checked before product-controlled actions and suppresses manual-channel due work/drafts; humans separately follow the incident runbook.
- Recorded opt-out is processed ahead of ordinary conversation work and suppresses product drafts/reminders.
- Campaign close/cancel/stop, contact lock, service hours, and capacity state are rechecked before product due work or booking dispatch.
- Production data is never copied to preview or local environments.

Secret storage, rotation, and environment distribution are accepted by **OD-030/[ADR-0030](adr/ADR-0030-vercel-sensitive-env-aws-kms-credential-envelope.md)**. AI-specific threat and evaluation requirements are accepted by **OD-026/[ADR-0026](adr/ADR-0026-layered-ai-safety-and-evaluation-gates.md)**.

Public form throttles are security controls, not outcome evidence. A plausibly valid submission is never silently discarded because a commercial or technology ceiling is reached: it is retained through the bounded intake path with an operator alert, while new activation and optional expensive work follow OD-032. Quarantined spam remains explicitly unqualified until a named human accepts or rejects it, and its security metadata follows a short, documented OD-027 retention purpose.

## 11. Reliability, idempotency, and failure handling

### 11.1 Delivery model

The system assumes at-least-once job and approved-provider webhook delivery. It targets effectively-once product-controlled booking outcomes through idempotency, uniqueness, and reconciliation. It makes no exactly-once claim for human Instagram/WhatsApp actions.

- **Transactional outbox:** domain change, audit event, and job intent commit together.
- **Webhook inbox:** provider event ID or canonical fingerprint deduplicates before domain processing.
- **Stable idempotency key:** includes tenant, action class, logical target, approved version, and booking/job identity. A retry reuses the same key.
- **Unique business constraints:** prevent a second Active campaign per Workspace, duplicate active manual occurrence record, competing product-guided campaign work for one Contact, and a second confirmed appointment for one booking intent. They cannot guarantee a human will not duplicate an off-platform action.
- **Optimistic concurrency:** state transitions compare the expected record version so cancellation, takeover, and approval revocation win deterministically.
- **No distributed transaction:** local state commits first with an outbox; provider results later complete or compensate the state.

### 11.2 Retry classification

| Failure | Behavior |
|---|---|
| Validation/policy denial, revoked approval, recorded opt-out, closed campaign, tail expiry | Do not retry product work; explain and audit/handoff as configured |
| Approved-provider authentication/token expiry | Pause that integration; one controlled refresh if supported; alert owner |
| Rate limit or transient provider outage | Exponential backoff with jitter and bounded attempts; respect provider retry hints |
| Timeout after request may have been accepted | Query/reconcile by idempotency key or provider reference before retry |
| Malformed model output | Schema-repair attempt within a small ceiling; otherwise return a reviewable failure |
| Poison job or repeated unknown error | Dead-letter/manual-resolution queue with full correlation context but redacted payload |
| Calendar contention | Refresh availability and ask the lead/owner to select again; never silently substitute |

### 11.3 Reconciliation and operational controls

- Manual channel reconciliation compares due work with actor evidence and flags missing/contradictory states; booking reconciliation compares local and provider state.
- Token-health probes apply only to approved integrations such as booking; there is no Meta token probe.
- Operators can retry a safe logical action with the same idempotency key, cancel it, or mark it reconciled with a reason; they cannot erase its history.
- Circuit breakers pause an unhealthy connection or adapter while leaving other tenants and channels available.
- Workspace-, campaign-, channel-, connection-, and conversation-level pause controls are independent and auditable.
- Natural close cancels new-enrollment and unpublished-occurrence jobs but retains eligible pre-close unbooked jobs only through each lead's original seven-day window and close+7 maximum, plus eligible booked jobs through close+14. Normal cancellation cancels all unbooked jobs and retains only already-booked tail jobs; emergency stop cancels every tail job.
- Every job payload and event carries a schema version. Deployments support the previous in-flight version or migrate queued work explicitly.

### 11.4 Graceful degradation

| Dependency unavailable | Product behavior |
|---|---|
| Model provider | Existing data, approvals, owner takeover, and manual workflows remain available; generation queues or fails visibly |
| Instagram/WhatsApp manual access | Due work remains pending/failed with access/evidence alert; operators follow the manual fallback/escalation runbook and record uncertainty |
| Calendar | Qualification can continue; booking is handed to a human or a safe link if approved |
| Product analytics | Operational events remain in the system of record and export later |
| Object store | New media and approved-source capture pause; existing domain data and lead handling continue where possible. Document import remains disabled unless a future accepted OD-021 amendment adds it. |

Recovery point, recovery time, backup retention, and restore testing cadence are accepted by **OD-036/[ADR-0036](adr/ADR-0036-backup-restore-and-provider-portability.md)** as internal targets. Its six-hour object RPO is the maximum verified recovery-point age, not a safe nominal job interval: implementation must schedule with measurable margin below six hours, monitor completion and inventory/checksum freshness, and block release or new paid activation when the latest verified copy can no longer meet the target. OD-014 governs human service targets, OD-031 accepts pilot commercial terms, and OD-032 accepts the governing cost envelope. Provider purchase still requires evidence that the current quote fits that ceiling. No contractual reliability promise follows automatically from the internal targets.

## 12. Deployment architecture

### 12.1 Environments

| Environment | Purpose | Data and integration rules |
|---|---|---|
| Local | Domain development and fast tests | Synthetic fixtures; local or isolated dev database; fake adapters by default |
| Test/CI | Deterministic verification | Per-run synthetic data and fake adapters; no network access to real providers |
| Preview | Review a branch/PR | Ephemeral app, isolated non-production data, no production credentials, no real outbound actions |
| Staging | Vercel Pro custom environment for migration, integration, and release rehearsal | Dedicated Mumbai Supabase non-production project/tenant, provider sandboxes/test accounts, production-like jobs and observability |
| Production | Paid/design-partner workflow | Vercel dynamic compute pinned to Mumbai `bom1`, Mumbai Supabase Pro PostgreSQL/private Storage, managed secrets, backups, real integrations, alerts and runbooks; OD-027 accepts controlled cross-border processing and OD-033 validates each actual vendor/contract |

### 12.2 Recommended topology

- A Node.js web/API runtime hosts the Next.js application and public ingress.
- Stable Vercel Workflow executes asynchronous step handlers from the same release and domain/application packages; its journal is never the domain system of record.
- Mumbai Supabase Pro PostgreSQL is the primary state store.
- Private Supabase Storage holds bounded website source snapshots and governed media. Document/file import remains disabled unless OD-021 is amended.
- Model, calendar, storage, and telemetry providers are outbound dependencies. Instagram/WhatsApp are human-operated channels, not application network dependencies.
- Public ingress is limited to the application edge, verified OAuth callbacks, lead forms, and webhook routes. Database and object storage are never public application interfaces.
- Web and job runtimes use distinct least-privilege identities. Only integration workers receive access to the credential-decryption capability required for their adapter.

Hosting, region, and environment shape are accepted by **OD-017** and [ADR-0017](adr/ADR-0017-hosting-region-environments.md):

- use Vercel Pro Node functions with Fluid Compute pinned to Mumbai `bom1`; OD-037 selects the exact supported Node version;
- use `vercel.ts` with `@vercel/config`, not `vercel.json`;
- use `vercel env` and separately scoped development, preview, custom-staging, and production values;
- choose PostgreSQL and other data services through the Marketplace or external managed providers, not retired Vercel Postgres/KV products.
- keep authenticated, lead, and operator responses private/no-store; do not place personal data in CDN/static/build output or raw logs.
- validate/persist/enqueue at webhook ingress and return promptly; do not use request duration as the durable-work mechanism.

This is a Mumbai-compute decision, not an India-only data-residency claim. OD-027/ADR-0027 accepts controlled cross-border processing; OD-033 must validate Vercel's current contract, processors, transfer disclosure, and launch obligations before production.

### 12.3 Release and migration rules

- One commit/release identifier is attached to web, worker, schema migrations, prompt templates, and job handler versions.
- Database changes use expand/migrate/contract sequencing. Destructive contraction waits until the old web and in-flight jobs no longer depend on the old shape.
- Deployment validates required environment-variable names without printing values.
- Release gates include migration rehearsal, tenant-isolation checks, adapter contract tests, job retry/idempotency tests, AI evaluation suite, and one synthetic end-to-end loop.
- Rollback means reverting application behavior while retaining compatible schema; external effects already acknowledged are reconciled, never “rolled back” by deletion.
- A canary or design-partner allow-list should gate new autonomous behavior and new adapters.

Repository/CI environment mechanics and gates are accepted by **OD-035/[ADR-0035](adr/ADR-0035-github-actions-protected-release-pipeline.md)**.

### 12.4 Scaling and extraction triggers

Scale vertically and by worker concurrency first. Add database indexes, partition high-volume events when evidence requires it, and tune adapter-specific concurrency/rate limits. Extract a module into a separate service only when at least one of these is evidenced:

- it needs materially independent scale or resource shape;
- it needs a stronger security or compliance isolation boundary;
- provider SDK/native runtime constraints cannot coexist safely;
- database workload demonstrably harms transactional paths;
- a separate team owns it and a stable contract already exists.

Likely future candidates are media rendering and high-volume ingestion/analytics. Agent roles, campaigns, approvals, leads, and bookings should not be split merely to match conceptual boxes.

## 13. Observability and audit

### 13.1 Signals

| Signal | Purpose | Required dimensions |
|---|---|---|
| Structured application logs | Diagnose state transitions and adapter failures | Environment, release, correlation ID, module, safe tenant reference, error class |
| Distributed traces | Follow UI/API → domain → job → adapter/model | Trace/span, workflow/job ID, model/provider or connection type; redact content/PII |
| Metrics | Alert on reliability, latency, volume, cost, policy, manual workload/evidence gaps, and backlog | Action/evidence class, result, verification state, queue age, model task, tenant tier |
| Audit events | Prove who/what approved, changed, recorded a manual send/publication, paused, booked, or took over | Actor/system principal, tenant, resource/version, evidence/verification, before/after references, reason, time |
| AI evaluations | Detect groundedness, policy, format, and task-quality regression | Dataset version, prompt/model version, score, failure category, reviewer |
| Product/funnel events | Measure activation and qualified attended outcomes | Campaign/content/source/lead/booking/outcome links with privacy filtering |

Logs and traces are operational aids and may be sampled or expire. Audit records are product evidence and follow a separate retention/access policy.

### 13.2 Correlation model

Carry correlation IDs through request, workflow, job, model call, domain command, approved adapter request/webhook, manual evidence record, and audit event. Stable identifiers include Workspace, Campaign, ContentVersion, ApprovalEnvelope, Workflow, ScheduleOccurrence, Lead, Conversation, Draft/ManualAction, BookingIntent, IdempotencyKey, and BookingProviderReceipt.

### 13.3 Initial service indicators

Targets require pilot traffic and business approval, but instrumentation must exist for:

- manual Instagram scheduled-to-actual lateness, evidence completeness/verification, wrong-version and access failures;
- duplicate or contradictory recorded manual actions and zero duplicate product-controlled bookings;
- hosted-form processing plus booking-webhook verification, lag, and dedupe rate;
- human response latency, manual reconciliation lag, and owner-takeover latency;
- draft-to-manual-action distinction, recorded opt-out/takeover compliance, outside-hours reconciliation, and handoffs;
- booking confirmation and conflict rate;
- campaign activation/close/tail state, revoked occurrences, contact-lock conflicts, and tail-job expiry;
- AI schema failures, unsupported-fact findings, escalation rate, and cost per workflow;
- queue age, retry count, dead-letter count, booking-token health, manual evidence gaps, and reconciliation mismatch;
- tenant-isolation and unauthorized-action security events;
- funnel completeness from campaign through attended/won/lost outcome.

Alerting must point to a runbook and an owner. Avoid alerts on vanity volumes without a required response. Vendor choices and the event taxonomy are **OD-028 Analytics/observability**.

## 14. Testing implications

The architecture requires these test layers when implementation begins:

- pure unit tests for `CU-01` activation/close/cancel/tail, contact lock, exact asset/manual-publication limits, schedule authorization, manual evidence states, service-hours/consent/draft suppression, approval invalidation, attribution rules, and canonical fingerprints;
- database integration tests for tenant scoping, unique constraints, transactions, outbox/inbox, and concurrent transitions;
- adapter contract tests for approved AI/booking/storage/job adapters against fakes, redacted fixtures, and provider sandboxes; no Meta fake may imply current execution;
- job tests for at-least-once internal work, retry class, close versus emergency stop, conversion-tail expiry, version compatibility, stale occurrence authorization, pause, and due-work cancellation;
- security tests for cross-tenant access, webhook forgery/replay, support access, server-side request forgery, conditional file-upload controls if enabled, and secret/PII leakage;
- golden AI evaluations for grounded facts, prohibited claims, structured outputs, escalation, opt-out, and prompt injection;
- end-to-end tests for website/structured context → complete `CU-01` approval → authorized manual Instagram due work/evidence → hosted-form or manually reconciled Lead → human service/draft-supported qualification → in-tail booking → attended outcome → weekly/close-out report, including close/cancel/stop, outside-hours, and competing-contact variants;
- production synthetic checks that use dedicated test tenants and cannot contact real leads.

AI evaluation thresholds are accepted by **OD-026/[ADR-0026](adr/ADR-0026-layered-ai-safety-and-evaluation-gates.md)**; CI and release gates are accepted by **OD-035/[ADR-0035](adr/ADR-0035-github-actions-protected-release-pipeline.md)**.

## 15. Accepted ADR coverage and change governance

The focused ADR set now records the accepted architecture rather than leaving this document as one irreversible decision:

- system shape, identity/tenancy, and hosting/environments: ADR-0015 through ADR-0017;
- manual Meta-channel boundary and re-entry conditions: ADR-0019, which supersedes ADR-0018;
- provider-owned booking, verified Business Brain sources, and creative/media rules: ADR-0020 through ADR-0022;
- typed model boundary, durable work, persistence/events/audit, AI safety, privacy, telemetry, accessibility, and secrets: ADR-0023 through ADR-0030;
- release policy, backup/portability, and the engineering toolchain: ADR-0035 through ADR-0037.

Version-specific approval and material-change rules are currently governed by OD-010 plus ADR-0019's occurrence authorization and ADR-0025's immutable version/audit records. Create a dedicated ADR only if that contract materially changes or its implementation introduces a new trade-off; do not create one merely to repeat accepted policy.

Every new or amended ADR must name its evidence and revisit trigger. Microservice extraction still requires measured scaling or isolation evidence; any software-controlled channel, payment, or spend effect requires a new accepted decision/ADR and current provider evidence.

## 16. Accepted decision summary and deferred choices

`OPEN_DECISIONS.md` is authoritative for status and blocking classification. It currently has no open decision row, but accepted policy is not the same as completed Gate G0, implementation, provider, legal, or OD-033 evidence. The tables below summarize architecture impact only; they do not downgrade a `YES — main build` or `YES — dependent work` label. If wording differs, the decision register governs.

### 16.1 Product decisions that shape architecture

| Decision | Architecture effect | Development impact |
|---|---|---|
| **OD-001 Pilot domain/generic core** | A vertical-neutral core contract plus a versioned yoga pack for vocabulary, qualification facts, claims, prompts/templates, outcomes, and evaluation fixtures | **RESOLVED — accepted:** architecture and boundary tests must prevent core packages from importing the yoga pack |
| **OD-002 Geography/language** | Bengaluru/India/INR/`Asia/Kolkata` and English-first pilot settings through configurable workspace geography/locale/language contracts | **RESOLVED — accepted:** multilingual automation remains outside MVP; data-region/privacy choices remain OD-017/OD-027 |
| **OD-003 Primary outcome** | Configurable conversion goal/outcome model; qualified attended introductory trial for the yoga pack; enrollment/revenue tracked separately | **RESOLVED — accepted:** OD-004/OD-012 still govern qualification and outcome evidence/attribution |
| **OD-004 ICP/qualification** | One independently governed studio Workspace may contain multiple provider-managed locations/instructors/classes/resources/pools; each campaign retains one offer/outcome and 3–5 transparent criteria with four decision states | **RESOLVED — accepted and amended:** no hidden score; product does not own scheduling rules; sensitive/uncertain answers require human review |
| **OD-005 Design partners** | Five named/two-cycle commitments; three baseline-and-access-ready; two paid/deposit-backed before G0; full readiness before each live campaign | **RESOLVED — accepted:** supplies the cohort boundary, while OD-006 still governs discovery/success thresholds and OD-031 exact commercial terms |
| **OD-006 Discovery/success thresholds** | Accepted 10–20 interview saturation rule, 70% dual-pain evidence, two manual workflow runs, five-owner prototype test, and later cohort/trust/workload/renewal gates | **RESOLVED — accepted:** completing the evidence is still required for G0; OD-028 finalizes technical telemetry definitions |
| **OD-007 Initial channels/lead routes** | Manually published Instagram only; hosted form primary; tracked click-to-WhatsApp secondary; WhatsApp Business human-operated; Facebook excluded | **RESOLVED — accepted and amended:** manual evidence is explicit; OD-018/OD-019 are deferred under ADR-0019 |
| **OD-008 Paid ads** | Candidate-package/manual-evidence contracts only; separately authorized human execution under hard caps; no Ads API or software spend | **RESOLVED — accepted:** generic external acquisition/budget/spend evidence, not an ad engine |
| **OD-009 Pilot operating model** | Paid product-assisted managed pilot; owner authority; named individual operator roles; no impersonation/shared credentials; manual action/time/gap ledger; self-service deferred | **RESOLVED — accepted:** auth/tenancy is accepted under OD-016; staffing/support is accepted under OD-014 |
| **OD-010 Autonomy/approval/takeover** | Customer-only material approval; exact manual occurrence authorization; private drafts; deterministic booking; product draft/due-work suppression and explicit resume | **RESOLVED — accepted and amended:** product controls its own state; humans own off-platform action; OD-020 still shapes booking |
| **OD-011 Campaign unit** | Versioned yoga `CU-01`; six Instagram items/≤6 manual publications; hosted form; manual WhatsApp playbook; Active ≤28 days; accepted tails/cancel/stop/contact-lock/capacity rules | **RESOLVED — accepted and amended:** generic configurable campaign-unit contract; yoga values are pack policy |
| **OD-012 Attribution/outcome capture** | Immutable first-known Lead origin, later touches, explicit evidence/confidence/unknown, verified separate outcome events, append-only corrections/disputes, no causal inference | **RESOLVED under founder delegation:** canonical event/funnel contract; telemetry implementation is accepted by OD-028 |
| **OD-013 Native lead/CRM boundary** | Workspace Contact plus campaign Lead/enrollment; bounded operational states and orthogonal handoff/takeover; no full CRM/sync | **RESOLVED under founder delegation:** core lead state and anti-CRM boundary; export/sync remains OD-034 |
| **OD-014 Team/support/SLA** | Two trained/named unpaid pilot operators plus founder escalation; daily 10:00–20:00 IST; human lead response median ≤15/p95 ≤30 minutes in-window; actual-minute/shadow-cost ledger; accepted alert/support targets; initial cap 10 with measured gates | **RESOLVED — accepted and amended:** unpaid friend coverage is a bounded pilot subsidy; confidentiality/data handling, rota/exit/replacement, admission control, and capacity evidence are required |

### 16.2 Technical decisions

| Decision | Recommendation | What it blocks |
|---|---|---|
| **OD-015 Modular-monolith/system shape** | TypeScript monorepo; one modular application; shared domain/application packages; web/API and durable-work execution units; one relational system of record | **RESOLVED under founder delegation:** [ADR-0015](adr/ADR-0015-system-shape.md) accepted; OD-017/OD-024 select Vercel execution; exact database/toolchain remains OD-025/OD-037 |
| **OD-016 Auth/tenancy/roles** | Supabase Auth identity/session; invite-only passwordless pilot; application-owned Organization/Workspace/Membership/roles/support grants; tenant key and server checks; operator MFA | **RESOLVED under founder delegation:** [ADR-0016](adr/ADR-0016-auth-tenancy-roles.md) accepted; compatible Mumbai/cross-border privacy stack accepted by OD-017/OD-025/OD-027 |
| **OD-017 Hosting/region/environments** | Vercel Pro/Fluid Compute web/API pinned to Mumbai `bom1`; isolated local/test/Preview/custom-staging/production resources; durable work executes as a distinct Workflow unit; no personal-data caching/raw logs; no silent regional failover | **RESOLVED under founder delegation:** [ADR-0017](adr/ADR-0017-hosting-region-environments.md) plus ADR-0024/ADR-0027/ADR-0037; actual provider/legal readiness remains OD-033 |
| **OD-018 Social publishing** | Defer APIs; exact-approved Instagram publication by named human with actor/time/hash/URL-or-screenshot/verification evidence; no Facebook | **DEFERRED by founder:** [ADR-0019](adr/ADR-0019-defer-meta-api-integrations.md); manual workflow/evidence is the approved build path |
| **OD-019 WhatsApp/policy** | Defer Cloud API/BSP; tracked click plus human-operated WhatsApp Business; private drafts/manual reconciliation only | **DEFERRED by founder:** [ADR-0019](adr/ADR-0019-defer-meta-api-integrations.md); no token/webhook/inbox/send/status/quota claim |
| **OD-020 Booking integration** | External provider is authoritative; multi-location/instructor studios allowed; one evidence-selected deep adapter at most plus tracked-hosted and operator-assisted tiers | **RESOLVED — accepted:** [ADR-0020](adr/ADR-0020-external-booking-system-of-record.md); named deep provider waits for five-partner inventory |
| **OD-021 Business Brain sources/retrieval** | Guided structured facts + one bounded owner-approved domain + approved booking-route metadata; human verification; relational/full-text first; no files/live-web/conversation truth/vectors initially | **RESOLVED — accepted:** [ADR-0021](adr/ADR-0021-verified-business-brain-sources-and-retrieval.md) |
| **OD-022 Media pipeline** | Typed AI proposals; deterministic factual/text/logo/CTA templates; governed customer/licensed media and reviewed non-factual generated decoration; exact manifests/checksums; no Canva/free-form editor/video | **RESOLVED — accepted:** [ADR-0022](adr/ADR-0022-template-first-creative-media-pipeline.md); OD-037 supplies the Satori/Sharp renderer baseline |
| **OD-023 AI runtime/models** | Direct OpenAI Responses/official JS SDK behind typed `ModelPort`; static evaluated GPT-5.6 task policies; no Gateway/AI SDK/Agents SDK or dynamic fallback initially | **RESOLVED under founder-delegated technical direction:** [ADR-0023](adr/ADR-0023-direct-openai-responses-model-port.md); production task matrix/data use remains gated |
| **OD-024 Durable jobs** | Stable GA Vercel Workflow; product DB/outbox/idempotency authoritative; minimal journal inputs; no WorkflowAgent/AI SDK/direct Queues/beta features | **RESOLVED under founder-delegated technical direction:** [ADR-0024](adr/ADR-0024-vercel-workflow-durable-runtime.md); pinned-toolchain/region/privacy/cost spike remains a gate |
| **OD-025 Database/persistence/storage/audit/events** | Mumbai Supabase Pro PostgreSQL/private Storage; Drizzle ORM/Kit plus `node-postgres`; reviewed SQL migrations; tenant constraints; app-owned append-only events/audit/outbox/inbox | **RESOLVED under founder-delegated technical direction:** [ADR-0025](adr/ADR-0025-supabase-postgres-drizzle-storage-events-audit.md); backup/restore is accepted by OD-036 |
| **OD-026 AI safety/evaluations** | Task-specific layered grounding/validation; versioned golden/adversarial suites; exact 95%/100%/zero-tolerance gates; human review and risk-based sampling | **RESOLVED under founder-delegated technical direction:** [ADR-0026](adr/ADR-0026-layered-ai-safety-and-evaluation-gates.md) |
| **OD-027 Privacy/consent/retention/residency** | Mumbai primary authority plus purpose-limited cross-border processors; minimized adult/non-medical Lead fields; versioned consent/suppression; 30/90/365/35 retention; rights/export/deletion | **RESOLVED — accepted by founder:** [ADR-0027](adr/ADR-0027-privacy-consent-retention-and-cross-border-processing.md); OD-033 validates final legal/provider readiness |
| **OD-028 Analytics/observability** | Product-owned events/formulas; allow-listed PostHog EU projections; scrubbed Sentry EU/DE, Vercel logs, and OpenTelemetry conventions | **RESOLVED under founder-delegated technical direction:** [ADR-0028](adr/ADR-0028-product-owned-metrics-posthog-sentry-otel.md); ADR-0027 supplies privacy limits and OD-033 validates actual vendors |
| **OD-029 Accessibility/language/claims** | WCAG 2.2 AA UI/hosted pages; accessible template controls; English-first with fluent review for supplied other-language text; substantiated objective claims and conservative vertical prohibitions | **RESOLVED under founder-delegated product/technical direction:** [ADR-0029](adr/ADR-0029-accessibility-language-and-claims-policy.md); legal terms remain OD-033 |
| **OD-030 Secrets** | Vercel sensitive environment variables; Vercel OIDC; Mumbai AWS KMS envelopes for tenant credentials; scoped decrypt/rotation/revocation/redaction | **RESOLVED under founder-delegated technical direction:** [ADR-0030](adr/ADR-0030-vercel-sensitive-env-aws-kms-credential-envelope.md); provision the real tenant-credential path only when an approved adapter requires it, then prove the full control set before accepting credentials |
| **OD-031 Pricing/global billing** | INR 4,999 through 100 Leads or INR 6,999 for 101–200 per 28-day cycle; INR 1,000 credited deposit; no setup fee; separate ad/provider spend; refund/credit and no-surprise-overage rules; global-ready billing configuration; Dodo later only after written offer/country approval | **RESOLVED — accepted by founder:** manual pilot invoices and entitlement records; unpaid operator time receives market-rate shadow cost; automated/global checkout deferred; [Dodo feasibility review](../decisions/DODO_PAYMENTS_FEASIBILITY.md) |
| **OD-032 Scale/budget/cost controls** | 10-Workspace/10-activation/200-Leads-per-Workspace/60-publication envelope; INR 10,000 development/staging monthly, INR 15,000 one-time readiness, INR 30,000 live-pilot monthly ceilings; per-tier AI allowances, shadow cost, 50/75/90 alerts, and 100% fail-closed admission/generation behavior | **RESOLVED — accepted by founder:** implementation must attribute spend/usage, retain inbound evidence, prevent surprise charges, and require explicit founder approval for any increase |
| **OD-033 Platform/legal/subprocessors** | Mandatory dated manual-channel access, legal/operator, processor, rights/incident, and country-commerce readiness gate; Meta APIs remain deferred | **RESOLVED — accepted by founder:** [live-readiness checklist](../readiness/OD-033_LIVE_READINESS.md) starts not passed and blocks real Lead data/live operation until evidenced |
| **OD-034 CRM sync** | No MVP adapter; native campaign pipeline plus governed CSV handoff only for evidenced need | **DEFERRED under founder-delegated product direction:** common two-partner target or blocking paid-partner need triggers review |
| **OD-035 CI/release environments** | Protected GitHub PR trunk/Actions; isolated Vercel preview/staging; comprehensive gates; immutable Actions/OIDC; release manifest; manual production; app rollback/DB forward-fix | **RESOLVED under founder-delegated technical direction:** [ADR-0035](adr/ADR-0035-github-actions-protected-release-pipeline.md) |
| **OD-036 Portability/backup/DR** | Seven-day PITR; independent nightly DB and object copies scheduled/monitored with margin inside the six-hour object RPO; 35-day immutable retention; export/restore drills; no active-active | **RESOLVED under founder-delegated technical direction:** [ADR-0036](adr/ADR-0036-backup-restore-and-provider-portability.md); OD-027 accepts privacy disclosure/expiry, OD-032 accepts the budget envelope, and OD-033 retains counsel/provider validation |
| **OD-037 Engineering toolchain/UI/tests** | Node 24/pnpm 11/Next 16.2/React 19.2/TypeScript 6/Tailwind 4/source-owned Radix UI/Satori+Sharp/Vitest 4/Playwright 1.61/ESLint 10/Prettier 3 | **RESOLVED under founder-delegated technical direction:** [ADR-0037](adr/ADR-0037-node-next-pnpm-ui-test-toolchain.md); compatibility spike remains Gate G1 evidence |

### 16.3 Choices intentionally deferred beyond MVP

- Microservices, event sourcing, CQRS, a dedicated event warehouse, Kafka, or Temporal-scale orchestration.
- Machine-learned lead scoring; start with transparent rules and verified outcomes.
- A standalone vector database; add pgvector only after retrieval evaluation demonstrates need.
- Facebook and all social/WhatsApp API adapters until ADR-0019 re-entry evidence and a new accepted ADR exist.
- Full CRM sync, complex custom objects, forecasting, invoicing, and territory management.
- Paid-ad budget execution and autonomous changes.
- Voice calling, video rendering pipeline, ecommerce catalogue, ticketing, and broad social-network coverage.
- Multi-region active-active deployment.
- Outcome-linked automated billing.

## 17. Architecture readiness and principal risks

The architecture and blocking policy decisions are accepted for implementation planning, but Gate G0 is not passed and therefore does not yet authorize application scaffolding. After a recorded G0 GO, only the neutral synthetic/local foundation may begin. Real Lead data, paid/live activation, production AI/telemetry, and global checkout remain blocked until the applicable OD-033 and implementation evidence passes.

| Risk | Why it matters | Architectural response |
|---|---|---|
| Manual channel workload or access fails | Humans may miss publication/response work, lose delegated access, or provide incomplete evidence | Two-person rota, rehearsals, manual-work/evidence ledger, response/capacity gates, honest unverified states, and ADR-0019 re-entry trigger |
| Booking-provider fragmentation | Partners may use different systems and integration tiers, weakening uniform telemetry and increasing support | One deep-adapter ceiling; generic hosted/manual tiers; tier-labelled metrics/evidence; no forced migration or multi-provider aggregation |
| Off-platform behavior contradicts recorded policy | Software cannot prevent a human WhatsApp send after opt-out/takeover | Product draft suppression, training, sampling, actor-attributed evidence, and trust-incident escalation |
| Approval envelope is under-specified | “Approved” content could mutate before publication | Immutable versions, canonical manifest, digest, execution-time recheck |
| Outcome is not verifiable | Analytics collapses back to vanity metrics | Outcome/source decision blocks funnel implementation; preserve correction evidence |
| Multi-tenancy is added late | Cross-customer disclosure is an existential incident | Tenant keys and context from the first migration; isolation tests in CI |
| Too many vendors for one operator | Incidents become hard to trace and expensive | Managed components, narrow adapters, shared correlation model, one release train |
| Agent complexity outpaces evidence | Multi-agent demos become costly and brittle | Roles share one thin runtime; typed proposals; deterministic workflows; evaluation gates |
| External action ambiguity | Manual channel evidence may be missing/contradictory and booking retries may duplicate | Explicit verification states/manual reconciliation plus booking outbox/idempotency/provider reconciliation |
| Retention implementation or processor terms diverge from accepted policy | Real Lead data could outlive OD-027 limits or be handled by an unapproved processor even though defaults are documented | Field/object purpose map, lifecycle/deletion/tombstone tests, processor inventory/contracts, restore replay, and OD-033 evidence before live data |

Revisit this architecture after the first complete pilot loop, after measured workload changes by an order of magnitude, after a material compliance change, or before enabling bounded autonomy.
