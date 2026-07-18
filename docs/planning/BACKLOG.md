# MVP Delivery Backlog

**Status:** Decision baseline accepted; R0 evidence still open; Phase 0 implementation started under signed Gate G0 `GO`  
**Scope:** [MVP Scope](../product/MVP_SCOPE.md)  
**Roadmap:** [Delivery Roadmap](ROADMAP.md)  
**Decisions:** [Open Decisions](../decisions/OPEN_DECISIONS.md)  
**Architecture:** [System Architecture](../architecture/SYSTEM_ARCHITECTURE.md)

## Backlog contract

This backlog is ordered to deliver one complete campaign-to-attended-outcome loop before breadth. A story is not “done” because a UI exists: its business rule, authorization, audit/event behavior, failure behavior, and proportionate automated tests must pass together.

### Priority

| Priority | Meaning |
|---|---|
| **P0** | Required for the first credible, supervised MVP-candidate loop or its safety |
| **P1** | Required to operate and harden that candidate through measured paid-pilot validation; may not delay proof of the P0 loop unless a release gate says otherwise |
| **P2** | Candidate after the loop and pilot economics are validated; explicitly excluded from the MVP |

### Decision dependency notation

`OD-xxx (label)` points to the corresponding entry in `OPEN_DECISIONS.md`. No story that depends on an open blocking decision is ready for implementation. Provider names below are deliberately expressed as “approved provider” until that decision is closed.

Decision closure and implementation readiness are different. Before Gate G0, only `VAL-*` evidence work, documentation, de-identified analysis, synthetic exercises, and disposable prototypes may proceed. After a signed G0 `GO`, Phase 0 implementation uses synthetic/local data and fake adapters only; later pre-live implementation remains limited to synthetic/non-customer fixtures and separately authorized sandboxes. An `OD-033` dependency means its policy is fixed; it does not mean the live-readiness evidence passed. Any acceptance criterion involving a real Lead, real partner account, paid/live campaign, production provider, or production AI/telemetry also requires the complete applicable OD-033 evidence and founder live-readiness `GO`.

### Definition of ready

A story may enter implementation only when:

- for every `FND-*`, feature, or implementation `OPS-*` story, Gate G0 is signed `GO`; pre-G0 `VAL-*` evidence activities are the explicit exception;
- the actor, behavior, acceptance criteria, affected tenant/data boundary, and failure cases are unambiguous;
- all blocking `OD-xxx` decisions and predecessor stories are closed;
- separately authorized external sandbox/test credentials exist when the story requires an approved provider test; production credentials never satisfy a pre-live prerequisite;
- any proposed MCP, skill, or plugin is mapped to the accepted provider/boundary, starts read-only and project-scoped where possible, and is not treated as an application dependency, provider decision, or substitute for gate evidence; user help is requested just in time for required authentication, project linking, billing, or external approval;
- implementation fixtures contain synthetic data only; any later governed live-validation records remain outside reusable fixtures;
- migration, telemetry, test, security, documentation, and rollback/forward-fix impacts are identified; and
- the story fits one branch and can be demonstrated independently.

### Definition of done

Every implemented story must:

- meet all listed acceptance criteria;
- enforce workspace authorization at the service and data-access boundaries;
- emit the required domain/audit events for state changes without logging secrets or sensitive message content unnecessarily;
- pass formatting, lint, type checking, unit tests, relevant integration/contract tests, and the smallest relevant end-to-end test;
- document public contracts, environment changes, migrations, and operational failure handling; and
- leave no unresolved severity-1 or severity-2 security, privacy, consent, duplication, or unauthorized-action defect.

## MVP-candidate critical-path slice

The candidate path is the dependency chain below. **Every listed P0 story is mandatory**; this is not a shorthand that permits omitted safety or failure-path work.

```text
VAL-001..005 + signed Gate G0
  -> FND-001..007
  -> OPS-001 + OPS-003
  -> BRN-001..005
  -> CAM-001..004
  -> OPS-004
  -> CNT-001..004
  -> APR-001..003
  -> OPS-002
  -> CAM-005
  -> INT-001..002
  -> PUB-001..004
  -> LED-001..004
  -> CON-001..006
  -> OPS-008
  -> BKG-001..004
  -> OUT-001..004
  -> LRN-001..003
  -> OPS-007
  -> LOOP-001 (synthetic/non-customer integrated acceptance)

FND-008 -> OPS-005
OPS-001 + OPS-002 + OPS-004 + OPS-005 + OPS-007 -> OPS-009
VAL-005 + OPS-003 + OPS-005 + OPS-009 -> OPS-010
LOOP-001 + OPS-009 + OPS-010 + founder OD-033 live-readiness GO
  -> LOOP-002 (real design-partner acceptance)
```

Some cross-cutting stories start earlier than their position in the diagram and continue through later gates. Provider evidence, consent/template review, outcome-data access planning, and pilot recruitment proceed in parallel without authorizing provider enablement or real-data processing. `FND-008` and `OPS-005` retain P1 delivery priority, but they are hard predecessors of P0 `OPS-009`/`OPS-010` and therefore of any real `LOOP-002` run. `LOOP-001` is the synthetic/non-customer integrated MVP-candidate acceptance story; it is not a substitute for independently testable components or live readiness. The product does not pass its MVP success gate until `LOOP-003` and Roadmap Gate G7 have measured the required five-partner, ten-campaign cohort.

## EPIC VAL — Product evidence and implementation gate

**Outcome:** The team knows exactly whom it serves, which outcome it promises, how that outcome is verified, and which provider/data boundaries may be built.  
**Roadmap:** R0 pre-implementation gate
**Scope guard:** Discovery validates, but does not expand, the [exact MVP user and non-goals](../product/MVP_SCOPE.md).

| ID | Pri | User story | Acceptance criteria | Dependencies |
|---|---|---|---|---|
| `VAL-001` | P0 | As the founder, I want the development gate recorded so the team does not encode unresolved assumptions. | **Given** the brief and interview evidence, **when** G0 is reviewed, **then** OD-001 through OD-037 each has an owner/status, every `YES — main build` item is accepted or amended, every `YES — dependent work` item has an evidence plan and target gate, and the founder records go/no-go with date and rationale. | OD-001–OD-037 as classified in the decision register |
| `VAL-002` | P0 | As the founder, I want evidence that the selected customer repeatedly experiences the target problem and understands the proposed workflow. | At least 10 eligible owners complete consistent structured interviews, continuing toward 20 until material findings stabilize; at least 70% provide behavioral evidence of both approved pains; counter-evidence, current workaround, cost, urgency, and willingness to pay are reported without fabricated statistics. Two eligible studios complete a documented manual campaign-to-attendance workflow with time/failures/data/policy gaps, and five eligible owners test the core clickable-prototype journeys with material confusion and assistance recorded. Fatal contradictions fail G0. | OD-001 (vertical), OD-002 (geography/language), OD-005 accepted (design partners), OD-006 accepted (discovery/success thresholds) |
| `VAL-003` | P0 | As a pilot owner, I want an agreed outcome definition so both parties count success the same way. | A written rule defines qualification, booking, attendance evidence, timezone, attribution window, duplicates, cancellations/no-shows, corrections, and disputes; three representative examples are classified consistently. | OD-003 (outcome), OD-004 (ICP/qualification), OD-012 (attribution/outcome capture) |
| `VAL-004` | P0 | As the founder, I want committed design partners with usable baseline data. | Five eligible Bengaluru yoga studios sign participation commitments, name an owner, join discovery/weekly reviews, intend to complete two `CU-01` cycles, and agree to record the required outcomes/operator effort; at least three demonstrate usable four-week baseline data and governed channel/downstream readiness; at least two pay the first accepted cycle amount or its INR 1,000 fully credited commitment deposit before G0. Every partner has a live-activation plan for commercial/privacy terms, account/consent readiness, baseline, selected ≤100 or 101–200 Lead tier, capacity, support, and paid/deposit-backed terms. | VAL-002; OD-005/OD-006/OD-009/OD-014/OD-031 accepted |
| `VAL-005` | P0 | As the delivery team, we want channel and booking feasibility proven before depending on them. | For Instagram/WhatsApp, delegated access, evidence, consent, coverage, workload, privacy, and fallback are recorded. For all five partners, inventory booking provider/plan, locations, instructors, class versus appointment model, resources/pools, hosted link/embed, metadata, API/webhooks, create/reschedule/cancel, capacity/waitlist/payment ownership, attendance export, privacy, price, and evidence tier. Select at most one deep adapter only if it covers ≥3 partners or most expected volume; every partner rehearses deep, tracked-hosted, or manual reconciliation. | OD-007/OD-020/OD-033 accepted, OD-018/OD-019 deferred, ADR-0020; OD-033 live evidence remains a later gate |

## EPIC FND — Repository, tenancy, governance, and integration seams

**Outcome:** All later slices inherit repeatable tooling and fail-closed tenant/action controls.  
**Roadmap:** R1 / Phase 0
**Scope guard:** Foundation follows [Phase 0 Foundation](PHASE_0_FOUNDATION.md); it does not include application features or real external actions.

| ID | Pri | User story | Acceptance criteria | Dependencies |
|---|---|---|---|---|
| `FND-001` | P0 | As a contributor, I want one documented verification contract so a clean checkout fails quickly and consistently. | **Given** an approved toolchain and example environment, **when** the documented bootstrap and local `pnpm verify` command or its canonical required split CI job set runs, **then** install, config validation, format check, lint, types, unit, integration, provider-neutral contract, offline AI, build, and smoke stages have an equivalent pass/fail result; a policy test detects any unassigned stage and no real provider is called. | Signed Gate G0 `GO` after VAL-001–VAL-005; OD-015 (system shape), OD-035 (CI/release environments), OD-037 (engineering toolchain) |
| `FND-002` | P0 | As an owner, I want secure workspace membership and roles so only authorized people act for my business. | Supabase Auth verifies an invite-only passwordless/approved-OAuth session and immutable provider subject; the server resolves a local actor and current application-owned Workspace membership/support grant for every command. Owner/staff/operator boundaries, expired/revoked grants, stale sessions, MFA assurance, unauthenticated access, and wrong-workspace access have allow/deny tests at application and data layers. Internal operators use individual assigned identities, require MFA, remain visible in audit, cannot approve as customers, and cannot impersonate; shared support credentials are rejected. | FND-001; OD-009/OD-016/OD-025/OD-027/OD-030 accepted; ADR-0016/ADR-0025/ADR-0027/ADR-0030 |
| `FND-003` | P0 | As a customer, I want my records isolated from every other workspace. | Tenant key is required on all customer-owned records and repository operations; seeded two-tenant tests prove cross-tenant read/write/list/reference attempts fail at both service and data layers; privileged maintenance access is explicit and audited. | FND-002; OD-025 accepted/ADR-0025 |
| `FND-004` | P0 | As a risk owner, I want append-only evidence of material actions. | Creating, changing, approving, scheduling, recording a manual publication/message, booking, outcome correction, takeover, and pause can emit an immutable event with workspace, actor type/ID, action, target/version, timestamp, correlation/idempotency key where applicable, policy result, evidence/verification state, and safe metadata; application roles cannot mutate prior audit events. | FND-003; OD-025 accepted/ADR-0025 |
| `FND-005` | P0 | As a developer, I want provider-neutral future seams and a vertical-neutral core so features do not depend on a vendor or hard-coded pilot domain. | Typed contracts and fakes exist for the accepted application-owned `ModelPort` and `DurableWorkPort`, booking, object storage, and telemetry. Vercel Workflow directives/SDK and OpenAI SDK remain outside domain/application packages. Manual publication/message evidence uses internal provider-neutral records. Publishing/messaging ports may be specified as future seams but no Meta adapter, SDK, credential, webhook, or fake implying current external execution is implemented. A versioned vertical contract supplies business-field schema, terminology, qualification, outcomes, claims rules, prompts/templates, reason codes, and evaluation fixtures. Core packages cannot import the yoga pack directly; automated boundary tests enforce this. | FND-001; OD-001/OD-015/OD-023/OD-024 accepted, ADR-0015/ADR-0023/ADR-0024; OD-018/OD-019 deferred by ADR-0019 |
| `FND-006` | P0 | As an operator, I want configuration and secrets to fail safely. | Startup validates environment-specific config; secret values cannot be exposed to client bundles, prompts, logs, errors, workflow journals, analytics, or test snapshots; missing/invalid secrets fail before work is accepted; `.env.example` contains names and safe placeholders only. Vercel sensitive variables hold shared keys; Vercel OIDC and context-bound Mumbai KMS envelopes protect tenant credentials; forbidden identities/contexts cannot decrypt. | FND-001; OD-017/OD-030 accepted, ADR-0017/ADR-0030 |
| `FND-007` | P0 | As an operator, I want every retryable external action to have a common idempotency contract. | Duplicate outbox dispatch, workflow start, step delivery, or provider request with the same Workspace/action/version/effect key returns or reconciles the original terminal/in-progress result; conflicting reuse is rejected; ambiguous provider results enter reconciliation; concurrency, leases, and expiry behavior are documented and integration-tested. | FND-004, FND-005; OD-024/OD-025 accepted, ADR-0024/ADR-0025 |
| `FND-008` | P1 | As an operator, I want backup/export and restore evidence before paid operation. | Seven-day PITR is enabled; nightly logical database and six-hourly object copies reach a separately controlled Mumbai recovery account with versioning/retention. A synthetic workspace restores in isolation; deletion/suppression and effects reconcile; evidence meets DB RPO ≤15 minutes, object RPO ≤6 hours, critical RTO ≤8 service hours, and full-object RTO ≤24 hours. | FND-003; OD-036 accepted/[ADR-0036](../architecture/adr/ADR-0036-backup-restore-and-provider-portability.md); current quote and drill must fit accepted OD-032 ceilings |

## EPIC BRN — Verified Business Brain

**Outcome:** Later AI work can use only source-backed, owner-approved business truth.  
**Roadmap:** R2 / Phase 1
**Scope guard:** No generic enterprise knowledge-management system; see [non-goals](../product/MVP_SCOPE.md#7-explicit-non-goals).

| ID | Pri | User story | Acceptance criteria | Dependencies |
|---|---|---|---|---|
| `BRN-001` | P0 | As a pilot owner, I want a guided profile for the facts needed by my vertical. | Required fields derive from a versioned vertical playbook while fact/source/verification contracts remain generic; owner can save draft business, offer, audience, voice, FAQs, claims, restrictions, and booking facts; validation explains omissions without inventing defaults. | FND-003, FND-004; OD-001/OD-004/OD-021 accepted, ADR-0021 |
| `BRN-002` | P0 | As a pilot owner, I want approved sources imported without treating extraction as truth. | One owner-approved primary-domain fixture and one approved normalized booking-route metadata fixture produce proposed facts carrying source location/reference, capture time, extractor/version, and confidence. Unsafe URL, redirect, size, parser/error, duplicate, stale label, and provider conflict follow tested paths; all values remain provisional until explicit owner verification. Broad crawl, arbitrary live web, files, and conversation learning are unreachable. | BRN-001, FND-005; OD-020/OD-021/OD-027 accepted, ADR-0020/ADR-0021/ADR-0027 |
| `BRN-003` | P0 | As a pilot owner, I want to verify, correct, reject, and resolve conflicting facts. | Authorized owner actions create immutable fact versions and audit events; conflicts and missing required fields are visible; rejected/superseded/unverified facts cannot become approved truth. | BRN-001, BRN-002, FND-004 |
| `BRN-004` | P0 | As a campaign or concierge workflow, I want cited approved facts or an explicit unknown. | Workspace/use-case-scoped relational/full-text retrieval returns only current approved facts plus source/version/freshness. Cross-tenant, expired, restricted, disputed, or missing facts yield no usable assertion and a machine-readable reason. Raw source prompt-stuffing and vector retrieval are absent; generated artifacts retain the immutable verified-context snapshot id. | BRN-003; OD-021/OD-026 accepted, ADR-0021/ADR-0026 |
| `BRN-005` | P0 | As an owner, I want time-sensitive facts flagged for reverification. | Price, offer, descriptive booking-route metadata, policy, and claim facts use approved expiry rules; expiry prevents unreviewed external use, alerts the owner, and does not erase history. Live provider availability/capacity is never stored as Brain truth. | BRN-003; OD-020/OD-021/OD-029 accepted, ADR-0020/ADR-0021/ADR-0029 |

## EPIC CAM — Goal-based campaign planning

**Outcome:** A measurable owner goal becomes a typed, explainable campaign and funnel.  
**Roadmap:** R3 / Phase 2
**Scope guard:** No generic automation builder, arbitrary channel expansion, or autonomous spend; see [non-goals](../product/MVP_SCOPE.md#7-explicit-non-goals).

| ID | Pri | User story | Acceptance criteria | Dependencies |
|---|---|---|---|---|
| `CAM-001` | P0 | As an owner, I want to request a campaign in business terms. | Form captures one attended-trial outcome, period, offer, audience, approved `BookingRoute`, selected channels, and constraints. The route may expose multiple provider-managed locations/instructors/classes/resources. It rejects unverified offers, concurrent Active campaigns, product-owned scheduling rules, paid-ad execution, and out-of-scope routes. | BRN-003; OD-003/OD-004/OD-007/OD-008/OD-011/OD-020 accepted |
| `CAM-002` | P0 | As an owner, I want a coherent plan before content is produced. | The direct OpenAI Responses adapter behind `ModelPort` produces a schema-valid goal, audience, offer, proof, objections, message hierarchy, funnel stages, asset list, qualification questions, KPI, assumptions, and risks; every factual assertion cites an approved fact or is labeled hypothesis. Only the task policy's allow-listed proposal/read tools are exposed. Deterministic fakes may satisfy automated component tests but cannot satisfy OPS-008 or the pilot-candidate gate. | CAM-001, BRN-004, FND-005; OD-023/OD-026 accepted, ADR-0023/ADR-0026 |
| `CAM-003` | P0 | As an owner, I want plan revisions to preserve evidence and history. | Requesting a change creates a new immutable brief version linked to the prior version and comment; comparison highlights material fields; prior versions remain inspectable and cannot silently replace an approved version. | CAM-002, FND-004 |
| `CAM-004` | P0 | As an operator, I want campaign generation bounded by quality and cost policy. | Each run records task policy, OpenAI model/config/request id, prompt/schema/template version, approved source snapshot, latency, token/media usage, cost estimate, validation/evaluation result, and retry count. Configured quota or safety threshold pauses and alerts rather than silently changing model or quality; any fallback model/config must already be evaluated for that task. The INR 4,999/6,999 cycle tiers enforce the accepted INR 750/1,250 AI allowances and contribute to aggregate OD-032 alerts. | CAM-002; OD-023/OD-026/OD-032 accepted, ADR-0023/ADR-0026 |
| `CAM-005` | P0 | As an owner, I want the approved `CU-01` lifecycle and tails enforced. | Activation requires all six Instagram items QA-passed/version-approved plus brief, landing/form, manual WhatsApp playbook, one offer/outcome mapped to a rehearsed provider-managed deep/hosted/manual `BookingRoute`, and manual-operations readiness. The route may span multiple locations/instructors/classes/resources but provider rules remain external. One Active campaign, 28-day, six-publication, form, and accepted tail/close/cancel/stop ceilings apply. Existing attribution is immutable; competing contact work hands off; provider capacity exhaustion or an OD-032 100% cost ceiling blocks new activation without dropping inbound evidence. | CAM-003, CNT-002, APR-001, OPS-004, FND-007; OD-010/OD-011/OD-020/OD-032 accepted, ADR-0019/ADR-0020 |
| `CAM-006` | P1 | As an owner, I want a controlled handoff when I choose to run paid traffic manually. | The product can assemble a clearly labelled candidate package referencing only approved creative/copy plus destination/source parameters, audience hypothesis, schedule, and suggested-not-authorized budget. Before an external campaign is recorded as authorized, the owner separately approves exact ad account, versions, destination, audience/geography, dates, named human operator, and hard daily/total caps. The operator uses delegated access outside the product and records actor-attributed external IDs, spend/results evidence, source, timestamp, and verification status. Tests prove no Ads API credential, launch/change/pause path, budget action, Lead Ads intake, platform-compliance claim, or extra `CU-01` asset allowance exists. | CAM-003, CNT-004, APR-001, FND-004; OD-008 accepted (paid boundary), OD-009 (operating model), OD-010 (approval), OD-031 (commercial terms) |

## EPIC CNT — Coordinated MVP content and deterministic QA

**Outcome:** The campaign produces only the coordinated assets required for the approved P0 routes.  
**Roadmap:** R3 / Phase 2
**Scope guard:** Full design editor, unrestricted image/video generation, bulk localization, and unsupported networks are [out of scope](../product/MVP_SCOPE.md#7-explicit-non-goals).

| ID | Pri | User story | Acceptance criteria | Dependencies |
|---|---|---|---|---|
| `CNT-001` | P0 | As an owner, I want one coordinated campaign bundle rather than unrelated posts. | From one brief version, typed AI proposals plus versioned deterministic templates produce the exact six Instagram items, landing/form content, and manual WhatsApp playbook/private draft set with consistent offer, message hierarchy, CTA, verified source fact IDs, channel/format metadata, and versions. Authoritative text/logo/facts remain deterministic overlays; partial failure does not regenerate successful items. No Facebook adaptation or automated message sequence is produced. | CAM-002, BRN-004; OD-007/OD-011/OD-022 accepted, ADR-0019/ADR-0022 |
| `CNT-002` | P0 | As an owner, I want risky or invalid assets blocked before approval. | Deterministic checks cover dimensions/length, required disclosures, approved price/offer/CTA, prohibited claims, spelling, accessibility baseline, and duplicate content; each result is pass/fail/warn with rule/version and remediation; mandatory failures block ready-for-approval. | CNT-001; OD-026/OD-029 accepted, ADR-0026/ADR-0029 |
| `CNT-003` | P0 | As an owner, I want to revise one failed asset without losing the bundle history. | A change request targets one asset/version, preserves successful siblings, reruns affected checks, and creates a diff-linked version; bundle consistency checks run before approval. | CNT-002, CAM-003 |
| `CNT-004` | P0 | As an owner, I want an exact channel preview. | Preview uses the final stored payload/media for each P0 route and the canonical render manifest; records template/renderer/media provenance, dimensions, crop, tokens, checksum, and verified-context version; labels known platform rendering uncertainty; and is the exact version submitted to approval. Any pixel-affecting edit creates a new version. | CNT-002; OD-022 accepted/ADR-0022 |

## EPIC APR — Version-specific approval and policy

**Outcome:** Nothing external can act on content, audience, offer, budget, or messages the authorized owner did not approve.  
**Roadmap:** R3 / Phase 2, cross-cutting thereafter
**Scope guard:** Multi-step enterprise approval builders are [out of scope](../product/MVP_SCOPE.md#7-explicit-non-goals).

| ID | Pri | User story | Acceptance criteria | Dependencies |
|---|---|---|---|---|
| `APR-001` | P0 | As an authorized customer, I want to approve, reject, or request changes to an exact campaign bundle. | Decision requires current version IDs/hash, actor/role, timestamp, optional comment, and all mandatory QA passes; unauthorized, operator/AI-originated, inferred/silent, stale, partial, or conflicting decisions fail; audit shows the exact payload covered. | CNT-002, FND-002, FND-004; OD-010 accepted (autonomy/approval/takeover) |
| `APR-002` | P0 | As an owner, I want material edits to invalidate prior approval. | Changing configured material fields—including price, offer, claim, CTA, audience, budget, content/media, or external payload—creates a new version with `approval_required`; tests prove prior approval cannot authorize it. | APR-001, CAM-003, CNT-003 |
| `APR-003` | P0 | As an operator, I want every external-action request checked against approval and policy. | A shared decision service returns allow/deny/escalate with rule versions and reason; deny is the default for missing context, expired approval, emergency pause, policy conflict, or unsupported action; agents cannot bypass it. | APR-001, FND-007; OD-010 (autonomy/approval/takeover), OD-026 (AI safety/evals) |

## EPIC INT — Manual channel readiness and booking account binding

**Outcome:** An owner can prove the exact manual Instagram/WhatsApp operating setup and connect the booking source required by the loop.  
**Roadmap:** R4 / Phase 3 and R5 / Phase 4  
**Scope guard:** This epic records one Instagram account, one official WhatsApp Business number, and one approved external booking connection/route for the single introductory offer. The route may span multiple provider-managed locations/instructors/classes/resources; it stores no Meta token, builds no scheduling engine, and adds no generic integration marketplace.

| ID | Pri | User story | Acceptance criteria | Dependencies |
|---|---|---|---|---|
| `INT-001` | P0 | As an owner, I want to prove that the manual Instagram and WhatsApp routes are safely operable. | An authorized owner records exactly one Instagram account and one official WhatsApp Business number for the Workspace, names permitted human actors, confirms delegated access/no password sharing, completes a non-customer rehearsal, and chooses the publication/conversation evidence method. Readiness shows account identity, last rehearsal, rota, and evidence gaps—not API health. Missing access, actor, service coverage, evidence method, or consent/opt-out playbook blocks activation. No SDK, OAuth, token, webhook, template, provider status, or automated send/publish test exists. | FND-002, FND-004, VAL-005; OD-018/OD-019 deferred by ADR-0019, OD-027 (privacy/consent), OD-033 (platform/legal) |
| `INT-002` | P0 | As an owner, I want to configure one external booking route without recreating my scheduling rules. | An authorized owner binds or records one deep, tracked-hosted, or operator-assisted connection for the Workspace and maps the campaign's single introductory offer/outcome to the allowed provider route/resources, which may include multiple locations/instructors/classes/calendars/pools. Deep setup validates least privilege, availability/booking/webhooks and a sandbox/test flow; hosted/manual setup validates tracked metadata, evidence/reconciliation, and fallback. Health shows tier, capabilities, freshness, route scope, discrepancies, and credential state where applicable. | FND-004–FND-007, VAL-005; OD-004/OD-020/OD-027/OD-030/OD-033 accepted, ADR-0020/ADR-0027/ADR-0030; live-provider evidence must pass |

## EPIC PUB — Scheduling and evidenced manual publication

**Outcome:** A named human publishes only the exact approved Instagram version and the product records honest evidence without claiming provider confirmation.  
**Roadmap:** R4 / Phase 3
**Scope guard:** Only the route(s) approved in OD-007 are P0; every other social network and autonomous paid-ad launch is [out of scope](../product/MVP_SCOPE.md#7-explicit-non-goals).

| ID | Pri | User story | Acceptance criteria | Dependencies |
|---|---|---|---|---|
| `PUB-001` | P0 | As an owner, I want the exact Instagram account and human access boundary recorded. | The Workspace displays the owner-approved Instagram account, named actors, delegated-access confirmation, rehearsal time, and evidence method. It stores no password or Meta credential. Wrong-account, missing-access, or shared-password evidence fails readiness. | INT-001, FND-004; OD-007 accepted, OD-018 deferred by ADR-0019 |
| `PUB-002` | P0 | As an authorized customer, I want to authorize an exact approved occurrence in my business timezone. | Creating/editing a schedule stores the exact Workspace timezone/UTC instant/Instagram account/campaign/content version/occurrence identity inside the active window and commits versioned human due work/outbox intent. Vercel Workflow durably waits and rechecks current approval/pause/cancel/tail state before marking work due. Timestamp-only customer edits create an audited replacement without content reapproval; account/campaign/version/out-of-window edits invalidate it. Past, closed/cancelled, paused, or stale-approval cases fail deterministically. | APR-003, PUB-001, FND-007; OD-010/OD-011/OD-024 accepted, ADR-0024 |
| `PUB-003` | P0 | As an owner, I want honest manual publication state and evidence. | A named human records `not_started`, `due`, `completed_unverified`, `verified`, `failed`, or `cancelled` plus actual actor/time, approved content hash, public URL where available, screenshot/evidence reference, and notes. The UI never labels an occurrence provider-confirmed and cannot treat due work as published. Duplicate or contradictory evidence is flagged for reconciliation. | PUB-002, FND-004; OD-018 deferred by ADR-0019, OD-025 (evidence storage) |
| `PUB-004` | P0 | As an operator, I want missed manual work and campaign closure handled safely. | Due/late/missing-access/wrong-version/missing-evidence cases create distinct actionable states. Campaign close/cancel revokes unfinished occurrences; emergency stop suppresses future due work. A post already published cannot be recalled, so it remains recorded with evidence/uncertainty and any corrective human action. | PUB-003, CAM-005, OPS-002 |
| `PUB-005` | P1 | As the founder, I want manual publishing economics and evidence quality measured. | Across the cohort, the scorecard reports scheduled-to-actual delay, evidence completeness, wrong/unapproved version incidents, access failures, reconciliation effort, and human minutes per occurrence. Repeated labor/failure may trigger ADR-0019 re-entry review but cannot silently enable an API. | PUB-003, OPS-007; OD-018 deferred by ADR-0019, OD-028 (analytics/observability) |

## EPIC LED — Source-aware lead capture and consent

**Outcome:** Campaign interest becomes a deduplicated lead with exact source and purpose-specific consent.  
**Roadmap:** R4 / Phase 3
**Scope guard:** No general-purpose CRM objects, forecasting, or broad import engine; see [lead boundary and non-goals](../product/MVP_SCOPE.md#7-explicit-non-goals).

| ID | Pri | User story | Acceptance criteria | Dependencies |
|---|---|---|---|---|
| `LED-001` | P0 | As a prospect, I want to express interest through the approved active route with clear consent. | The sole `CU-01` hosted form captures the minimum approved fields, campaign/creative/offer/version, UTM/click ID when present, consent purpose/text/version/time/source, and timezone. A tracked click-to-WhatsApp is recorded only as a click and never creates a Lead, message, or consent. New enrollment is rejected after campaign close; required consent is unbundled. | PUB-002 or approved test source; CAM-005; OD-007 accepted, OD-011 accepted, OD-019 deferred, OD-027 (privacy/consent) |
| `LED-002` | P0 | As an operator, I want to reconcile an actual WhatsApp conversation without inventing provider evidence. | A named operator may create/link a campaign Lead from an observed WhatsApp conversation by recording observed time, contact identity, route/click evidence where available, consent source/status, actor, notes/evidence, and confidence. Duplicate reconciliation does not create a second Contact/Lead; unknown stays explicit. No webhook/provider ID/delivery state is fabricated. | FND-004, LED-001; OD-019 deferred by ADR-0019, OD-025 (evidence), OD-027 (privacy/consent) |
| `LED-003` | P0 | As an owner, I want every lead to retain campaign context. | Each campaign-specific Lead retains an immutable first-known link to Workspace Contact, campaign, brief/content version, offer, route, external IDs/UTMs, capture event, consent, evidence source, and confidence; later touches remain distinct, unknown stays explicit, and manual additions/corrections require actor/reason/evidence and append history rather than overwrite origin. Contact dedupe cannot erase a Lead source. | LED-001, LED-002; OD-012 and OD-013 accepted |
| `LED-004` | P0 | As a prospect, I want a recorded opt-out respected by product guidance. | A manually observed or form-originated opt-out records channel/purpose/scope/observed time/actor/evidence, updates central suppression, and cancels product drafts/reminders. Duplicate records are safe and an owner cannot casually override them. The UI states that the product cannot enforce or observe later off-platform human sends; contradiction is a trust incident. | LED-001, LED-002, APR-003; OD-019 deferred, OD-027 (privacy/consent) |

## EPIC CON — Policy-bound Lead Concierge and human takeover

**Outcome:** The product helps a human advance a source-aware conversation without inventing facts or overruling consent/human control.  
**Roadmap:** R5 / Phase 4
**Scope guard:** Voice calling, negotiation outside policy, learned lead scoring, support ticketing, and open-ended CRM automation are [out of scope](../product/MVP_SCOPE.md#7-explicit-non-goals).

| ID | Pri | User story | Acceptance criteria | Dependencies |
|---|---|---|---|---|
| `CON-001` | P0 | As a consenting lead, I want an honest campaign-specific human acknowledgment. | During service hours, the worklist surfaces a private grounded acknowledgment draft/checklist with current campaign, consent, suppression, takeover, and tail state. A named human reviews/edits, sends it in WhatsApp Business, and records actual actor/time/purpose/evidence. Outside hours the product sends nothing and cannot observe WhatsApp inbound; operators reconcile at the next window. A draft is never shown as sent. | INT-001, LED-003, LED-004; OD-011 accepted, OD-014 accepted, OD-019 deferred by ADR-0019 |
| `CON-002` | P0 | As a lead, I want accurate answers based on approved business facts. | For a golden set, the evaluated `ModelPort` task policy cites/uses only current approved facts; unknown, expired, restricted, sensitive, or low-confidence questions ask for clarification or escalate. Adversarial input cannot reveal another tenant/secret, enable built-in web/file/computer/shell tools, authorize a tool action, or select a different model/provider. | CON-001, BRN-004; OD-023/OD-026 accepted, ADR-0023/ADR-0026 |
| `CON-003` | P0 | As a lead, I want human qualification to feel progressive rather than like a long form. | The product suggests only the approved unanswered question(s), one or two at a time. A human asks through WhatsApp, then records the answer, provenance, observed time, and qualification-rule version; the product computes transparent fit/intent/urgency evidence and flags stop/escalation conditions. | CON-002; OD-004 accepted, OD-010 accepted, OD-013 accepted |
| `CON-004` | P0 | As an owner, I want a simple lead state that explains why a lead is qualified. | Pipeline exposes only approved MVP stages; transition rules reject impossible/stale transitions; qualification shows contributing answers/rules rather than an opaque model score; every transition is audited. | CON-003; OD-013 (native lead/CRM) |
| `CON-005` | P0 | As a lead, I want direct human ownership when I ask or when guidance is unsafe. | Human request, anger/sensitive topic, negotiation, low confidence, high-value rule, or emergency pause sets takeover/paused state and suppresses product drafts/reminders; manual inbound recording and a private summary may continue. Authorized customer resume is audited and cannot override opt-out without valid re-consent. The software does not claim it can stop an off-platform human action. | CON-002, CON-003, OPS-002; OD-010 accepted, OD-014 accepted |
| `CON-006` | P0 | As a consenting lead, I want bounded manual follow-up without harassment. | Product due work may suggest at most the accepted no-response, appointment, booking-change, and no-show steps. Each draft/reminder rechecks current tail, recorded consent/opt-out, service hours, latest manually entered response, booking state, suppression, and takeover. Unbooked guidance ends at booking, opt-out, takeover, normal cancel/emergency stop, capture+7, or close+7 as applicable. Humans decide/send/log externally; there is no automated quota or provider delivery state. | CON-001, CON-004; OD-011/OD-014 accepted, OD-019 deferred, OD-032 (capacity/workload) |

## EPIC BKG — Availability, booking, and reminders

**Outcome:** A qualified lead books real availability exactly once with correct timezone and owner visibility.  
**Roadmap:** R5 / Phase 4
**Scope guard:** No full calendar product, payment/deposit system, routing marketplace, or unsupported booking provider; see [non-goals](../product/MVP_SCOPE.md#7-explicit-non-goals).

| ID | Pri | User story | Acceptance criteria | Dependencies |
|---|---|---|---|---|
| `BKG-001` | P0 | As a qualified lead, I want only real, relevant options from the studio's existing booking route. | A deep adapter returns fresh provider options; a hosted route displays/opens the authoritative provider scheduler; an operator-assisted route records an authorized observation/action. Options may span allowed locations/instructors/classes/resources but must match the one campaign offer/outcome and active-plus-tail boundary where product-controlled. Stale, unavailable, wrong-route/tenant, unhealthy, outside-tail, or contradicted evidence is not presented as valid. | INT-002, CON-003, CAM-005, FND-005; OD-004/OD-011/OD-020 accepted, ADR-0020, VAL-005 |
| `BKG-002` | P0 | As a lead, I want my selected option recorded honestly and without product-caused duplication. | Deep creation revalidates provider state and route/tail, applies idempotency/concurrency control, creates at most one provider/local booking, and confirms only after provider receipt. Hosted/manual tiers store provider reference or actor evidence plus verification confidence and never claim API confirmation. All tiers retain timezone, selected provider resources, offer, Lead/source, and discrepancy state. | BKG-001, FND-004, FND-007; ADR-0020 |
| `BKG-003` | P0 | As an owner, I want the lead and appointment linked without manual copying. | Appointment links the correct contact, lead, conversation, campaign/source, qualification snapshot, and consent; owner can inspect it in the light pipeline; wrong-workspace references fail. | BKG-002, CON-004; OD-013 (native lead/CRM) |
| `BKG-004` | P0 | As a consenting lead, I want booking changes, the bounded reminder, and no-show recovery handled safely by a human. | Deep or reconciled create/reschedule/cancel events update one normalized booking idempotently without overriding provider authority. Product due work suggests the accepted reminder/first change/no-show steps under current consent, service, tail, suppression, and takeover state; a named human sends through WhatsApp and records evidence. Provider-native notifications are labelled provider behavior. State changes cancel obsolete due work; discrepancies, tail expiry, unsupported changes, or accepted OD-032 capacity controls hand off. | BKG-002, LED-004; OD-011/OD-014/OD-020/OD-032 accepted, OD-019 deferred, ADR-0020 |

## EPIC OUT — Verified outcomes and funnel ledger

**Outcome:** Attendance and later business outcomes are verified, correctable, and connected to campaign evidence.  
**Roadmap:** R6 / Phase 5
**Scope guard:** No perfect or probabilistic multi-touch attribution; unknown attribution remains unknown per [non-goals](../product/MVP_SCOPE.md#7-explicit-non-goals).

| ID | Pri | User story | Acceptance criteria | Dependencies |
|---|---|---|---|---|
| `OUT-001` | P0 | As an owner, I want to record whether a booking was attended. | Approved normalized system-of-record event or authorized customer action records attended/no-show/cancelled with source/evidence, occurred/recorded time, actor, rule version, and appointment/Lead link; booking/message activity never implies attendance. Duplicate/late/conflicting input follows versioned precedence/dispute rules. | BKG-003; OD-003 and OD-012 accepted |
| `OUT-002` | P0 | As an owner, I want a reconciled funnel from campaign to attended outcome. | For a chosen period/campaign, counts for captured, engaged, qualified, booked, attended, and won derive from immutable events and published definitions across the accepted Lead→booking-by-close+7→appointment-by-close+14 chain; repeated/late events do not inflate totals; missing/unknown/uncertain attribution and late evidence are separate, and no view labels correlation causal. | OUT-001, LED-003, CON-004; OD-012 accepted, OD-025 (DB/storage/audit/events) |
| `OUT-003` | P0 | As an owner, I want corrections to preserve the original evidence. | Authorized correction requires reason and creates a superseding event; prior value remains auditable; funnel recomputes deterministically; unauthorized or cross-tenant correction fails. | OUT-001, FND-004 |
| `OUT-004` | P0 | As an owner, I want won/lost enrollment outcome and loss reason captured without redefining attendance. | Won/lost, reason, supplied monetary value/currency, evidence source, occurred/recorded time, and correction history are separate events after attendance; unknown/free-text handling is explicit. The attended-trial north star remains unchanged, and OUT-002 counts `won` only from verified events without guaranteeing or inferring revenue. | OUT-001, OUT-003; OD-012 accepted |

## EPIC LRN — Evidence-based weekly learning

**Outcome:** The owner sees what is known, what is uncertain, and the next bounded experiment; the system cannot act on the recommendation itself.  
**Roadmap:** R6 / Phase 5
**Scope guard:** No automatic strategy, audience, offer, or budget changes and no causality claims from small samples; see [non-goals](../product/MVP_SCOPE.md#7-explicit-non-goals).

| ID | Pri | User story | Acceptance criteria | Dependencies |
|---|---|---|---|---|
| `LRN-001` | P0 | As an owner, I want the bounded `CU-01` learning outputs tied to actual outcomes. | During Active, one evidence-labelled memo per week uses the same definitions/ledger as OUT-002; after the campaign and bounded tail reconcile, one close-out memo is produced. Each includes period, sample size, missing data, rates, source links, owner-workload/trust signals, and reconciled totals. | OUT-002, CAM-005; OD-003 (outcome), OD-006 (success thresholds), OD-011 (campaign unit) |
| `LRN-002` | P0 | As an owner, I want one defensible next experiment. | The evaluated static task policy returns a memo separating observation, evidence, confidence/limitations, hypothesis, expected effect, and proposed single-variable test; insufficient evidence says so; recommendation cannot enqueue work, alter policy, change budget, or dynamically change model/provider. | LRN-001, APR-003; OD-023/OD-026 accepted, ADR-0023/ADR-0026 |
| `LRN-003` | P0 | As an owner, I want to accept, reject, or defer the proposed experiment. | Decision records actor, rationale, and linked memo/version; acceptance creates a draft campaign request only and still requires normal planning/approval; rejection does not rewrite evidence. | LRN-002, CAM-001 |

## EPIC OPS — Safety, observability, privacy, and operating controls

**Outcome:** The founder can detect, stop, diagnose, recover, and cost-control the high-risk workflow.  
**Roadmap:** R1 / Phase 0 through R7 / Phase 6
**Scope guard:** Controls apply to the MVP loop; enterprise compliance packs and generalized policy builders are [out of scope](../product/MVP_SCOPE.md#7-explicit-non-goals).

| ID | Pri | User story | Acceptance criteria | Dependencies |
|---|---|---|---|---|
| `OPS-001` | P0 | As an operator, I want failures traceable across request, job, evidence record, and domain event. | Correlation IDs link safe structured logs, traces, due-work/job attempts, booking-provider references, manual channel evidence, and audit events; dashboards/alerts cover manual publication lateness/evidence, capture/reconciliation, response workload, booking, AI/policy, and outcome-sync failures; secrets and disallowed PII are redacted. | FND-004, FND-005; OD-028 (analytics/observability), OD-030 (secrets) |
| `OPS-002` | P0 | As an authorized customer/operator, I want an emergency pause that fails closed inside the product. | Authorized pause at workspace/campaign/channel/conversation scope prevents new schedules/bookings as configured and suppresses product drafts, due work, and reminders; workers recheck before product-controlled actions. Resume is explicit/audited and cannot override opt-out/re-consent rules. The UI warns that humans must separately stop off-platform Instagram/WhatsApp action; contradictory action is incident evidence. | APR-003, FND-007; OD-010 accepted, ADR-0019 |
| `OPS-003` | P0 | As a privacy owner, I want export, retention, and deletion behavior defined and testable. | Synthetic data map identifies controller/processor, purpose, region, retention, legal/operational holds, and deletion method; an authorized export is tenant-complete; deletion anonymizes/deletes per policy without silently corrupting required audit evidence. Backup/restore readiness is a separate P1 dependency. | FND-003; OD-027 (privacy/consent/retention/residency), OD-033 (platform/legal/subprocessors) |
| `OPS-004` | P0 | As the founder, I want exact capacity and cost limits before AI or manual operations run away. | Usage/admission ledger records AI/draft, media, job, hosted-form/manual Lead, campaign activation, planned/manual Instagram publication, evidence gap, owner/operator actual minutes, INR 200/hour initial shadow cost, and volunteer-coverage status. It enforces the OD-031 tier and accepted 10-Workspace/10-activation/200-Leads-per-Workspace/60-publication envelope plus INR 10,000/month development-staging, INR 15,000 one-time readiness, INR 30,000/month live-pilot, and INR 750/1,250 cycle AI ceilings. It notifies at 50/75/90%. At 100%, it preserves data and inbound Lead capture/reconciliation but blocks new activation and optional expensive generation pending founder review; it never creates an unapproved charge, drops evidence, or silently changes evaluated quality. No automated-message quota exists. | FND-005, CAM-004; OD-011/OD-014/OD-031/OD-032 accepted, ADR-0019 |
| `OPS-005` | P1 | As an operator, I want tested backup, restore, and incident runbooks. | Runbooks cover manual channel access loss, wrong/unapproved publication, contradictory message after opt-out/takeover, missing evidence, booking-provider outage/credential compromise, duplicate booking, bad AI draft, consent complaint, data leak suspicion, and database/object restore; tabletop plus synthetic restore records owner, timestamps, evidence, and follow-ups. | FND-008, OPS-001; OD-014/OD-036 accepted, ADR-0036 |
| `OPS-006` | P1 | As a paying pilot customer, I want clear managed-pilot entitlement, usage disclosure, invoice reference, and cancellation. | The tenant record fixes the accepted 28-day cycle, INR 4,999/≤100-Lead or INR 6,999/101–200-Lead tier, applicable-tax treatment, INR 1,000 fully credited deposit, zero setup fee, pay-before-activation status, separate customer-paid ad/provider costs, start/end dates, cancellation-before-next-cycle, and product-team-failure refund/full-credit choice. Every invoice/reference/status and entitlement change is auditable. Excess inbound is retained and triggers handoff/capacity review without surprise billing. No lead, attendance, enrollment, revenue, or platform-compliance guarantee appears. Dodo is not integrated for the human-led bundle without written eligibility. The future billing contract preserves country, ISO currency, localized price/tax/payment methods, invoice/refund policy, provider references, and jurisdiction activation without making them active MVP checkout paths. Ask the founder for Dodo account details only when an approved integration story starts. | G6, OPS-004; OD-009/OD-031 accepted, [Dodo feasibility](../decisions/DODO_PAYMENTS_FEASIBILITY.md) |
| `OPS-007` | P0 | As the founder, I want every quantitative MVP gate and manual intervention computable from versioned evidence. | A versioned scorecard defines numerator, denominator, exclusions, window, timestamp/source, and late/correction behavior for activation, campaign completion, manual Instagram completion/evidence by scheduled time +30 minutes, wrong/unapproved publications, human lead response during service hours, manual-message evidence, source/outcome completeness, booking consistency, combined owner/operator workload, trust incidents, and partner/campaign denominators. A manual-work ledger records workspace, actor, category, duration, reason, customer involvement, product-gap classification, and external evidence/verification state. | OUT-002, LRN-001, OPS-001; OD-006/OD-009/OD-012/OD-028 accepted, ADR-0019/ADR-0028 |
| `OPS-008` | P0 | As the founder, I want the approved real model path evaluated before any pilot candidate uses it. | In a controlled non-customer evaluation, each proposed OpenAI Responses task policy/model/config/prompt/schema/tool set runs the versioned yoga-studio golden and adversarial suites. Results meet at least 95% correct supported answers and 100% abstention/escalation for unsupported sensitive, price, policy, and claim cases; schema validity, prompt injection, cross-tenant/secret leakage, unauthorized/built-in-tool denial, latency, and accepted OD-032 cost budgets pass. Every result records provider request, model/config/prompt/schema/eval versions and usage. Terra is only a default candidate; Sol/Luna or any fallback must pass per task. A deterministic fake cannot pass this story, and failure blocks G6; production sampling rules are documented before live leads. | CAM-002, CNT-002, CON-002, OPS-001, OPS-004; OD-023/OD-026/OD-028/OD-032 accepted, ADR-0023/ADR-0026/ADR-0028 |
| `OPS-009` | P0 | As the founder, I want live admission tied to proven human support capacity. | Before first activation, the two trained/named unpaid pilot operators use individual identities and pass a rehearsal covering founder escalation, daily 10:00–20:00 IST rota, backup and exit/replacement, confidentiality/data/work-product terms, manual Instagram/WhatsApp access, alert routing, and runbooks. Every work item records actual minutes and the accepted initial INR 200/hour shadow cost. In-window human lead response targets are median ≤15 minutes and p95 ≤30 minutes; critical alerts are acknowledged/assigned within 30 minutes, other operational escalations within 2 service hours, and routine support within 1 service day. Admission starts at 10 live Workspaces. Expansion requires explicit founder approval plus the accepted four-week/workload/reserve gate and cannot assume free labour persists. Outside hours the hosted form records Leads, while WhatsApp inbound is unobserved until manually reconciled; the product sends no receipt. | OPS-001, OPS-002, OPS-004, OPS-005, OPS-007; OD-014/OD-031/OD-032 accepted, ADR-0019 |
| `OPS-010` | P0 | As the founder, I want accepted readiness policy converted into dated proof before anyone treats the pilot as live-ready. | Every required item in the [OD-033 live-readiness checklist](../readiness/OD-033_LIVE_READINESS.md) has a named owner, dated source/evidence, pass/fail status, and blocking follow-up. Actual channel access, customer/privacy/operator documents, vendor DPAs/subprocessors/regions/retention/deletion/incident contacts, rights and incident rehearsals, and country/checkout restrictions pass. No exception is silently waived; counsel spend has separate founder approval; the founder records go/no-go. A policy acceptance, template, local fake, or unchecked box cannot pass. | VAL-005, OPS-003, OPS-005, OPS-009; OD-027/OD-029/OD-031/OD-033/OD-036 accepted |

## EPIC LOOP — Complete campaign-to-attended-outcome release acceptance

**Outcome:** Prove the whole value proposition with one coherent, safe trace rather than disconnected feature demos.  
**Roadmap:** R6 / Phase 5
**Scope guard:** This is exactly one approved vertical, route set, and outcome. Additional variants remain [out of scope](../product/MVP_SCOPE.md#7-explicit-non-goals).

| ID | Pri | User story | Acceptance criteria | Dependencies |
|---|---|---|---|---|
| `LOOP-001` | P0 | As a pilot owner, I want one `CU-01` campaign to produce a verified attended outcome and useful next experiment through an honest managed workflow. | **Given** an eligible single- or multi-location/instructor Workspace, verified Business Brain, rehearsed manual-channel fixtures, an evaluated non-production model path, one deep/hosted/manual booking-route contract exercised through a fake or separately authorized sandbox, and synthetic/non-customer governed data, **when** artifacts/occurrences are approved, **then** exact manual-work evidence, honest Lead/source/consent, human qualification, tier-labelled non-duplicated booking, verified attendance, funnel, evidence uncertainty, and all manual work are traceable. Tests include multi-location/resource routing remaining provider-owned plus close/cancel/stop/outside-hours/opt-out/takeover/discrepancy variants. LOOP-001 cannot use a real Lead, live campaign, or production provider; those belong to LOOP-002 after OPS-009/OPS-010. | All functional P0 critical-path stories including OPS-008; signed G0 and G1–G5; ADR-0019 and ADR-0020; synthetic/non-customer only |
| `LOOP-002` | P0 | As the founder, I want a real design-partner acceptance run before declaring the MVP candidate ready for the measured cohort. | At least one designated partner completes LOOP-001 using approved real/safely governed records only after the applicable OD-033 checklist and founder live-readiness `GO` pass; baseline and resulting measures are recorded; all manual operations and failures are disclosed; founder and partner record acceptance or specific failed criteria; no test fixture, sandbox, policy acceptance, or partial checklist can pass. This proves pilot readiness, not the 10-campaign MVP success gate in LOOP-003/MVP_SCOPE. | LOOP-001, VAL-004, OPS-009, OPS-010; OD-005 (design partners), OD-006 (discovery/success thresholds), OD-009 (pilot operating model), signed OD-033 live-readiness `GO` |
| `LOOP-003` | P1 | As the founder, I want paid-pilot readiness judged on reliability and workload, not feature count. | Five distinct partners each complete two `CU-01` cycles (10 total), at least three have comparable baseline volume/data, the approved cohort outcome gate passes, and at least three renew or sign a post-pilot paid agreement. Zero severe trust incidents occur, and manual publication evidence/timeliness, human response, reconciliation workload, booking reliability, cost, support-hour, backup/restore, data-rights, cancellation, and lower-severity incident gates pass. The go/no-go rationale cites measured evidence and decides whether either Meta integration merits separate re-entry review. | LOOP-002, PUB-005, LRN-003, OPS-005, OPS-006, OPS-007; OD-005/OD-006/OD-014 accepted, ADR-0019 |

## P2 opportunity backlog — explicitly not MVP

These are placeholders for later discovery, not authorized build work. Each requires evidence, a scope change, and the process in [ROADMAP.md](ROADMAP.md#scope-change-rule).

| ID | Candidate | Why deferred | Dependency before reconsideration |
|---|---|---|---|
| `LATER-001` | More social/publishing/messaging channels | Breadth adds review, creative, policy, retry, and support matrices before the wedge is proven. | LOOP-002 plus repeated loss attributable to missing channel |
| `LATER-002` | Direct paid-ad launch and budget changes | Spend, permission, policy, attribution, and trust risk are materially higher. | Explicit OD-008 scope change, budget-policy ADR, pilot evidence |
| `LATER-003` | Full CRM sync/custom objects/forecasting | Recreates mature CRM breadth and dilutes campaign-native focus. | Repeated paid-customer need; OD-034 provider/sync design |
| `LATER-004` | Voice calling | Consent, recording, telephony, latency, safety, and support complexity. | Proven text loop and separate legal/product validation |
| `LATER-005` | Rich free-form design editor and broad video pipeline | Competes with mature creative platforms and is not the outcome wedge. | Evidence that integration/template path blocks conversion |
| `LATER-006` | Learned lead scoring/optimization | Requires sufficient verified outcomes and measured lift over transparent rules. | Large, representative, governed outcome dataset and evaluation ADR |
| `LATER-007` | Multi-touch/probabilistic attribution | False certainty is likely at pilot sample sizes. | Reliable event coverage, explicit model/evaluation, user demand |
| `LATER-008` | Additional verticals/geographies/languages | Would weaken the vertical playbook before repeatability is proven. | Retained first-vertical cohort and documented transfer hypothesis |
| `LATER-009` | Ecommerce, invoicing, support ticketing, proprietary models | Outside the appointment-to-attendance job and available from established providers. | Separate product thesis and founder-approved scope reset |

## Suggested issue slicing order

Within each story, prefer this implementation sequence:

1. contract and acceptance fixture,
2. domain rule plus unit tests,
3. tenant-scoped persistence and migration plus integration tests,
4. deterministic fake adapter and failure cases,
5. application/API boundary and authorization,
6. minimal user interface,
7. real provider adapter contract test where approved,
8. telemetry/audit/runbook, and
9. smallest end-to-end demonstration.

Do not split a story into “frontend complete” and “backend complete” states that cannot independently demonstrate user value. If a story is too large for one branch, split by a narrower end-to-end behavior or failure mode while preserving an independently testable result.
