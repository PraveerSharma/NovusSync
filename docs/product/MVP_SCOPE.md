# MVP Scope

**Document status:** Decision baseline accepted; Gate G0 evidence and founder go/no-go pending  
**Decision authority:** Founder  
**Source:** `docs/product/PRODUCT_BRIEF.md`  
**Last updated:** 15 July 2026  
**Execution status:** **Not authorized. Decision closure is necessary but not sufficient: application scaffolding requires a signed Gate G0 `GO`; that `GO` authorizes only synthetic/local Phase 0, while real Lead data and every paid/live path remain separately blocked by OD-033.**

## 1. Purpose and MVP boundary

The MVP validates one narrow, measurable campaign-to-attended-trial-class loop through the independent-yoga-studio vertical pack. The underlying product is a business- and vertical-agnostic campaign-to-outcome platform; it is not a general AI marketing suite, and the MVP does not claim that unvalidated business types are ready to use.

The product will help a pilot business establish approved business facts, plan one campaign, produce and approve the concrete `CU-01` campaign unit, coordinate evidence-backed manual Instagram publication and WhatsApp handling, capture campaign-attributed interest, qualify and book the lead, record attendance, and learn what to test next.

The scope below reflects the accepted/deferred decision baseline. It remains evidence-gated: an accepted scope or decision does not prove Gate G0 discovery evidence or OD-033 live readiness.

### 1.1 Accepted product-versus-pilot boundary

OD-001 establishes two separate boundaries:

- **Generic product core:** Organization, Workspace, Business Profile, Campaign, Offer, Audience, Content, Approval, Contact/Lead, Conversation, Qualification, Conversion Goal, Appointment/Outcome, Policy, Audit Event, and provider ports must not depend on yoga-specific code or terminology.
- **Yoga MVP vertical pack:** yoga-specific profile fields, trial-class terminology, qualification rules, outcome vocabulary, claims policy, prompts, templates, reason codes, and evaluation fixtures are versioned configuration selected for the first cohort.
- **No speculative multi-vertical build:** only the yoga pack is implemented and validated in the MVP. A future business type needs an explicit vertical pack, discovery evidence, policy/compliance review, and contract/evaluation coverage before being represented as supported.
- **Extensibility test:** foundation and application tests must demonstrate that the core consumes a vertical contract/configuration and does not import the yoga pack directly. This protects reuse without building features for hypothetical industries.
- **Global-commerce target:** country, currency, price, tax, payment method, invoice, refund/cancellation policy, locale, and provider references must remain configurable so eligible customers in activated jurisdictions can eventually purchase the software. The Bengaluru managed MVP remains invite-only and manually invoiced; it does not open an unevaluated worldwide checkout or claim every jurisdiction/business type is supported.

## 2. Exact MVP pilot user

### 2.1 Primary pilot user — accepted through OD-001 to OD-006

The accepted first-pilot target user is:

> The owner-operator of one independent yoga-studio business in **Bengaluru Urban, Karnataka**, operating an English-first campaign and service workflow, who owns lead response and bookings, currently markets through Instagram and WhatsApp, offers one introductory trial-class offer/outcome through an existing booking service that may coordinate multiple locations, instructors, classes, calendars, resources, or capacity pools, and agrees to share lead, booking, attendance, enrollment, loss-reason, integration-tier, and owner/operator-time data during a managed pilot.

MVP eligibility should require all of the following:

| Criterion | Exact accepted boundary | Why it matters | Status |
|---|---|---|---|
| Business model | Independent, appointment/trial-led yoga studio; no ecommerce-first or marketplace business in the first pilot | Creates a short, observable conversion loop | Accepted for first pilot; OD-001 |
| Vertical | Yoga studios are the only MVP vertical pack; gyms, broad fitness, wellness clinics, and coaching are not yet validated or supported | Enables one vocabulary, introductory offer, qualification, booking, and claim playbook without hard-coding that vocabulary into the core | Accepted for first pilot; OD-001 |
| Geography | Bengaluru Urban, Karnataka, with an English-first product, generated campaign, human-assisted lead-conversation, support, and documentation workflow; India/INR and `Asia/Kolkata` for the pilot | Fixes a concrete recruiting, pricing, support, privacy, language-QA, and provider-feasibility boundary without hard-coding it into the product core | Accepted for first pilot; OD-002 |
| Operating shape | One independent owner-operated studio business and decision authority; one `CU-01` introductory offer/outcome; one approved provider-managed booking route that may expose multiple locations, instructors, classes, calendars, resources, or pools | Preserves a comparable campaign while allowing existing booking services to own operational complexity | Accepted/amended; OD-004 and OD-020, [ADR-0020](../architecture/adr/ADR-0020-external-booking-system-of-record.md) |
| Acquisition channels | Manually operated professional Instagram account as the only social discovery channel; hosted campaign form as primary entry; tracked click-to-WhatsApp secondary; official WhatsApp Business app for manual conversation | Preserves the accepted first loop and source/consent evidence without Meta APIs or Facebook | OD-007 accepted/amended; OD-018 and OD-019 deferred under ADR-0019 |
| Conversion event | A qualified introductory yoga trial class with attendance verified by an authorized user or approved source; enrollment/loss/value remain separate downstream outcomes | Makes the north-star outcome valuable and measurable without inferring attendance or guaranteeing revenue | Accepted; OD-003 |
| Data commitment | All five partners agree to record booking, attendance, enrollment/loss, and operator effort; at least three demonstrate usable four-week baseline data and governed channel/downstream readiness before G0 | Prevents the product falling back to vanity metrics while staging sensitive access until required | Accepted cohort and evidence mechanics; OD-005 and OD-012 |
| Pilot relationship | Accepts a paid, product-assisted managed pilot, weekly review, visible operator assistance, and measurement of combined owner/operator effort | Allows safe learning before autonomy without misreporting hidden agency labor as product capability | Accepted; OD-009 |
| Design-partner commercial tier | INR 4,999 plus applicable tax per 28-day cycle through 100 new Leads, or INR 6,999 preselected before the cycle for 101–200; INR 1,000 commitment deposit credited to cycle one; no setup fee; ad spend/provider charges separate | Tests willingness to pay while making the lead-volume/manual-work boundary explicit | Accepted; OD-031 |

Before Gate G0, all five named design partners must have signed participation commitments and intend to complete two `CU-01` cycles; at least two must pay the accepted first-cycle amount or its INR 1,000 credited commitment deposit. Each cycle balance is due before activation, with cancellation allowed before the next cycle. Before any partner activates a live campaign, it must complete approved commercial/privacy terms, account and consent readiness, baseline evidence, capacity confirmation, and paid/deposit-backed terms. If the product team cannot launch despite timely customer readiness, the unused cycle fee is refunded or fully credited at the customer's choice. The future global-commerce requirement does not broaden this first cohort or bypass country/vertical readiness.

### 2.2 Secondary users

- A staff member may review the lead inbox, take over a conversation, update appointment attendance, or approve content if the owner grants the role.
- Two trained, individually named internal pilot operators—the founder's friends, volunteering without salary for the measured pilot—may assist onboarding, campaign QA, exact-approved manual Instagram publication, manual WhatsApp response/reconciliation, booking exceptions, and pilot support, with the founder as escalation owner. Every product and off-platform action must be individually attributable and audited. A complete rota, backup/escalation and exit/replacement path, approved confidentiality/data-handling/work-product terms, actual-minute ledger, and market-rate shadow cost are required before the first live activation. Unpaid labour cannot support permanent pricing or scale claims.
- A prospective customer is an external participant, not a workspace user. They interact through a consented landing-page form, WhatsApp conversation, and booking flow.

Franchises or agencies managing independently governed brands, enterprise approval chains, regulated medical providers, and businesses without an attended appointment outcome are not the MVP user. Multiple locations/instructors within one eligible independently governed studio business are allowed when its external booking route owns their operational rules.

## 3. Exact problem

The first pilot's target yoga studio can produce posts or buy generic marketing software, but it does not have a reliable, low-configuration way to carry campaign context through the entire funnel. Campaign planning, content, approval, publishing, lead response, qualification, trial-class scheduling, attendance, enrollment, and learning happen in separate tools or in the owner's head.

This creates five concrete failures:

1. Leads wait for a reply or receive generic replies without the originating offer and creative context.
2. The owner repeatedly supplies facts, and generated content or messages can introduce incorrect prices, claims, or policies.
3. Approval is ambiguous: a later edit can be published even though only an earlier version was reviewed.
4. The business can see reach and raw leads but cannot reliably connect a campaign to qualified, attended bookings.
5. The owner spends time moving information between social channels, WhatsApp, calendars, and spreadsheets, then lacks evidence for the next campaign decision.

The MVP problem statement is therefore:

> For an eligible pilot business, reliably turn one owner-approved campaign into qualified, attended bookings while preserving source context, consent, exact-version approval, human control, and an auditable outcome trail.

The MVP does not promise revenue, guaranteed lead volume, or autonomous growth. It proves that the campaign-to-attendance workflow can be executed safely and measured.

## 4. Accepted MVP campaign unit (`CU-01`)

`CU-01` is the accepted unit of MVP delivery under OD-011, including the founder's manual-channel amendment.

| Element | Exact accepted limit |
|---|---|
| Concurrency | One active/executing campaign per workspace. A later campaign may activate after the prior campaign enters `Closed`. A Contact still in a prior campaign's manual conversion-tail workflow cannot enter a competing product-guided campaign workflow; retain the new touch and assign it to a human until the earlier workflow is terminal. |
| Active duration | Maximum 28 consecutive calendar days from activation. Drafting and approval time do not count. At the configured end or day 28, whichever comes first, the campaign automatically enters `Closed`. |
| Natural close and tails | Natural close immediately removes new manual-publication due work, closes the landing form to new enrollment, and stops new promotional activity. A pre-close unbooked lead may remain in the operator's approved qualification/booking worklist only for the remainder of its original seven-day window and never beyond **7 calendar days after close**. A lead booked before/during that tail may receive manually handled transactional work only through **14 calendar days after close**. No slot may fall outside close+14 days. |
| Cancellation | Customer cancellation is an immediate close with audited actor/time/reason. It revokes unpublished manual occurrences, disables new enrollment and unbooked drafts/reminders. An already published manual post cannot be recalled and remains recorded from evidence. The close+14 booked tail continues only for existing appointments. `Emergency stop` suppresses all product due work/drafts/reminders; humans handle existing appointments under the incident runbook. |
| Strategy | One versioned campaign brief covering one introductory trial-class offer, one audience segment, one primary CTA, one qualification rubric, one capacity limit, and the north-star outcome. |
| Organic content | Exactly 6 canonical Instagram feed items must be generated, pass mandatory QA, and be version-specifically approved before activation: 4 single-image posts and 2 carousels of no more than 5 slides each, each with one Instagram caption. Facebook, Stories, Reels, live content, and video are excluded. |
| Publication ceiling | After all 6 items are approved, the owner may schedule any subset. Each item may be manually published once to the approved Instagram account, for no more than 6 publications. The product creates operator due work; it does not call Meta or retry a publication. |
| Schedule authorization | An authorized customer's create/edit schedule action authorizes one exact manual occurrence: approved content version/hash, Instagram account, and timestamp inside the active window. Time-only edits require explicit customer action/audit and replace the occurrence without content reapproval. Account/campaign/version/out-of-window changes invalidate it; content changes require approval. Human execution records actor, actual time, public reference/screenshot evidence, and `verified`/`unverified` status. |
| Landing route | Exactly 1 hosted campaign landing page with 1 lead form, one offer/CTA, required contact and consent fields, and no more than 3 owner-approved pre-qualification questions. |
| WhatsApp operating playbook | The product has no WhatsApp API, inbox, token, template, send, status, or receipt. It may generate private grounded drafts/checklists in the previously bounded categories from facts an authorized user manually enters. A trained owner/operator reviews/edits, sends in the official Business app, and records the actual action/evidence. A draft is never a send. |
| Conversation lifetime | Product-guided manual qualification stops on booking, recorded opt-out, human request/takeover, safety/policy stop, cancellation/emergency stop, 7 days after capture, or 7 days after natural close—whichever applies first. Natural close alone does not truncate a pre-close lead's original window. Booked manual transactional work ends close+14. |
| Service coverage and outside hours | Human service is daily **10:00–20:00 `Asia/Kolkata`** with no 24/7 promise. Hosted-form submissions are recorded/queued immediately. The product cannot observe outside-hours WhatsApp inbound and sends no WhatsApp receipt. At the next service window, operators reconcile the official app and work the queue under current consent/opt-out/tail/takeover state. |
| Manual policy precedence | Recorded consent, opt-out, suppression, quiet-hours/frequency playbook, takeover, campaign/tail state, and emergency stop suppress product drafts/due-work reminders. Software cannot guarantee off-platform behavior; a later contradictory human action is a trust incident and triggers incident review. No automated-message/provider quota exists. |
| Learning output | One campaign funnel report plus one evidence-labelled weekly memo during the active period and one close-out memo after completion. Each memo proposes at most one next experiment and cannot activate it. |

The fixed unit is a scope/safety ceiling, not a performance promise. All 6 items and mandatory artifacts must be approved, but the owner may schedule fewer. The product may not silently add/substitute assets, occurrences, or drafts, and manual work cannot be represented as automated or provider-confirmed.

## 5. Primary user journey

### Preconditions

- The business meets the approved pilot eligibility definition.
- The owner has authority over the selected Instagram account and WhatsApp Business number, and the owner or named operator can use delegated access without sharing passwords.
- The manual Instagram evidence method, hosted form, tracked click-to-WhatsApp route, service rota, consent playbook, and privacy terms are ready. No Meta App Review, token, template, webhook, or API permission is required.
- The owner has defined one introductory trial-class offer/outcome, qualification rules, and one approved external `BookingRoute` whose provider or documented manual process owns all included location/instructor/class/resource/capacity rules.

### Happy path

| Step | User action | Product behavior | Required evidence |
|---|---|---|---|
| 1. Create workspace | Owner signs in, creates the business workspace, invites an optional staff member, and accepts pilot/privacy terms | Creates a tenant boundary, roles, policy defaults, and an audit trail | Workspace and membership exist; cross-tenant access tests pass |
| 2. Establish Business Brain | Owner completes the guided vertical profile, authorizes one primary business domain, and maps approved booking-route metadata | Creates only provisional candidates from the website/provider labels, records provenance/confidence/version, and flags conflicts, missing values, and expiry | Owner explicitly verifies or rejects every campaign-critical fact; unknown remains unknown |
| 3. Prepare the loop | Owner identifies the Instagram account and WhatsApp Business number, confirms delegated manual access, chooses the evidence method, and configures one approved provider-managed booking route for the offer | Records channel readiness and the booking connection/tier without storing Meta credentials; maps or links permitted provider locations/instructors/classes/resources without copying their scheduling rules | Named actors can rehearse channel work; booking route/tier/evidence are visible; provider or hosted/manual fallback proves a complete booking path |
| 4. Request campaign | Owner selects the one outcome, offer, audience, date range, capacity, channels, and optional spend context | Produces a typed brief containing assumptions, KPI, content plan, capture route, qualification flow, and constraints | Brief is reproducible and every factual claim traces to an approved fact |
| 5. Review campaign bundle | Owner previews the `CU-01` brief, all 4 single-image posts, both carousels, their Instagram captions, 1 landing page/form, and the manual WhatsApp playbook/draft set | Runs factual, brand, policy, format, duplication, and accessibility checks; labels unresolved risks | Failed mandatory checks prevent approval or activation |
| 6. Approve exact versions | Owner approves or requests changes to the campaign, all 6 required content items, landing route, and messaging-policy versions | Locks approved versions and records actor, timestamp, comments, and version identity | Activation is impossible until all 6 items and mandatory campaign artifacts are approved; a material edit invalidates the affected approval |
| 7. Schedule and publish | Owner chooses any subset of the 6 approved items and authorizes each exact Instagram account/timestamp occurrence; a named human manually publishes it | Creates due work and rechecks the exact approved version, then records the human's actual time, actor, public reference/screenshot, content hash, and verification state | Timestamp-only edits are audited without content reapproval; account/version/out-of-window edits invalidate the occurrence; the product never labels an occurrence `published` without human evidence |
| 8. Capture lead | Prospect submits the campaign form or follows the tracked click-to-WhatsApp route | Form submissions create source/consent-complete Leads. A click is stored as click evidence only; an operator must reconcile an actual WhatsApp conversation into a Lead with actor/source/consent evidence | Owner can trace known origin while unknown or unverified channel facts remain explicit |
| 9. Qualify and book | During service hours, the owner/operator reads WhatsApp, reviews or edits private grounded drafts, sends manually, records answers/consent/opt-out, and offers real slots from the approved pool | Product supplies campaign context, checklists, draft replies, transparent qualification, due work, and booking controls; it never reads or sends WhatsApp | Unknown/sensitive questions, competing campaign conversations, additional booking changes, opt-out, and human requests create human-owned work; actual sends and outcomes require manual evidence |
| 10. Take over when needed | Owner accepts an escalation or assumes direct ownership | Suppresses product drafts/reminders and supplies a concise context summary plus suggested reply | No product draft is treated as sent; later contradictory off-platform action is recorded as a trust incident |
| 11. Record outcome | Owner or approved integration marks booked, attended/no-show, won/lost, value if supplied, and loss reason | Maintains the funnel and source link without claiming uncertain attribution | Outcome changes are timestamped, attributed, and auditable |
| 12. Review learning | Owner opens a weekly funnel report | Shows campaign-to-lead-to-qualified-to-booked-to-attended counts and rates, data gaps, and one evidence-labelled next experiment | Recommendation distinguishes observation, hypothesis, confidence, and approval required |

### Mandatory exception paths

The MVP is not complete unless it handles missing delegated access, missing/contradictory manual publication evidence, schedule edits, campaign close/cancellation/tail expiry, conflicting business facts, form-versus-click distinction, manually reconciled WhatsApp consent/opt-out, unobservable outside-hours WhatsApp inbound, uncertain or sensitive questions, competing campaign attribution, unavailable booking slots, first and additional rescheduling/cancellation, no-show, human takeover, and emergency campaign/channel pause.

## 6. Included capabilities

This table combines accepted P0 boundaries with clearly identified open dependencies. A provider or capability is authorized only where its related-decision cell says it is accepted.

| Capability | Included MVP behavior | Hard boundary | Related decisions |
|---|---|---|---|
| Identity and tenancy | Supabase Auth sessions; invitation-only passwordless email and optional verified Google OAuth; local Organization/Workspace/Membership; owner, staff, internal operator, and time-bounded support grants; tenant-scoped server authorization; operator MFA; multiple locations/resources may belong to one independently governed Workspace. Passwordless email is essential authentication transport only, not a campaign/Lead channel, and its production SMTP/provider remains disabled until OD-033 passes for the actual configuration. | No public signup, custom password system, provider-role-as-authority, impersonation, SSO, SCIM, complex enterprise RBAC, agency hierarchy, franchise/multi-brand hierarchy, broad browser CRUD, or automated marketing/Lead email | OD-004, OD-015 through OD-017, OD-020, OD-025, OD-027, and OD-033 accepted; ADR-0016/ADR-0027; live provider evidence pending |
| Business Brain | Guided structured entry, one owner-approved domain as bounded provisional input, and approved booking-route metadata; relational/full-text retrieval of current source/version/freshness-linked facts; explicit owner verification for every campaign-critical fact | No broad autonomous crawling, arbitrary live-web truth, unrestricted document upload, conversation-derived truth, prompt-stuffed raw sources, vector retrieval, or learning unverified facts | OD-021 accepted; [ADR-0021](../architecture/adr/ADR-0021-verified-business-brain-sources-and-retrieval.md) |
| Campaign planning | One Active `CU-01` per Workspace for ≤28 days plus accepted tails: one typed brief for one offer, audience, attended outcome, period, channels, and one approved provider-managed `BookingRoute` that may span multiple locations/instructors/classes/resources | No concurrent Active campaigns, multi-offer campaign, product-owned routing/capacity rules, competing product-guided contact workflows, optimizer, forecast guarantee, or autonomous budget change | OD-003, OD-007, OD-011, and OD-020 accepted |
| Content bundle | Exactly 4 Instagram single-image feed posts and 2 Instagram carousels of up to 5 slides, 1 landing page/form, and the manual WhatsApp playbook/draft set defined in `CU-01`; typed AI copy/layout proposals feed deterministic factual/text/logo/CTA templates. Owner-approved or rights-recorded photography and reviewed non-factual generated decoration are allowed; every render has a manifest/checksum and exact approval. An optional paid-use candidate package may reference approved assets without creating extra asset allowance | The owner may schedule fewer items, but there is no Facebook adaptation, extra asset allowance, generated authoritative text/logo, generated real-person/premises/result representation, video, Canva integration, free-form editor, unlimited variants, multilingual localization, or software ad buying | OD-008, OD-011, and OD-022 accepted; [ADR-0022](../architecture/adr/ADR-0022-template-first-creative-media-pipeline.md) |
| Model-assisted proposals | Application-owned `ModelPort` with a direct OpenAI Responses adapter; strict typed outputs and allow-listed proposal/read tools; static task-policy binding to an evaluated model/config; product database owns all workflow/domain state | No Gateway/AI SDK/Agents SDK dependency, provider-built-in web/file/computer/shell/MCP tool, model-selected routing, unevaluated fallback, provider-session system of record, AI approval, or direct side effect | OD-023/OD-026/OD-027/OD-030/OD-032/OD-033 accepted; ADR-0023/ADR-0026/ADR-0027/ADR-0030; production remains gated by provider/privacy/evaluation evidence |
| Content QA | Grounding, approved-claim, brand, spelling, format, duplication, text-length, and basic accessibility checks | Reviewer does not provide legal approval or infer permission for unsupported claims | OD-026, OD-029 |
| Approval Centre | Authorized-customer exact-version approve/reject/request-change; material-diff invalidation; no operator/AI approval; schedule-occurrence authorization; comments, risk labels, expiry/revocation, and immutable audit | Timestamp-only customer edits replace occurrence authorization without content reapproval; account/channel/campaign/version/out-of-window edits cannot retain it; no inferred/silent approval, enterprise chains, or external approval portal | OD-010 and OD-025 accepted; exact approval and append-only evidence persist under ADR-0025 |
| Calendar and publishing | Calendar view; customer-authorized exact Instagram occurrences; timestamp-only replacement authorization and audit; schedule cancel; operator due work; execution-time approval/pause checks; and actor/time/content-hash/public-reference-or-screenshot/verification evidence after manual publication | No publishing API, Meta credential, Facebook, provider-confirmed status, retry automation, every-network support, social listening, unified inbox, best-time optimization, software paid-ad launch, stale occurrence execution, or publish after campaign close | OD-007, OD-008, and OD-010 accepted; OD-018 deferred by ADR-0019 |
| Human-run paid traffic handoff | Clearly labelled candidate package; separate exact account/creative/destination/audience/geography/date/hard-cap authorization; named operator using delegated access; manual external campaign/ad references, spend/results evidence, source, actor, timestamp, and verification status | No platform-compliance claim, shared passwords, Ads API permission, software launch/change/pause, Lead Ads ingestion, automated budget/bid/audience action, or AI spending; ad spend remains customer-paid and outside the accepted cycle fee | OD-008 through OD-010, OD-014, and OD-031 accepted |
| Lead capture and source context | One hosted campaign form as primary entry plus tracked click-to-WhatsApp secondary entry; Workspace Contact deduplication plus distinct campaign Lead/enrollment; immutable first-known campaign/content/offer/route/consent origin; UTM/click evidence and confidence; manual WhatsApp reconciliation with actor/reason/evidence; later touches separate | A click is not a Lead, message, or consent. No source overwrite, inferred attribution, Meta inbox/webhook, DM/comment automation, arbitrary form builder, call tracking, marketing/Lead email automation, or probabilistic multi-touch | OD-007, OD-012, and OD-013 accepted; OD-019 deferred by ADR-0019 |
| Lead Concierge | Private campaign-aware drafts/checklists; approved FAQ help; versioned customer-approved rule set of 3–5 criteria; deterministic `unknown`/`qualified`/`unqualified`/`human_review_required`; manually entered answer evidence; confidence/risk escalation; reasoned override; draft/takeover suppression | Humans read, review/edit, send, and record every WhatsApp action in the official Business app. The product cannot observe outside-hours inbound, send a receipt, negotiate, provide regulated/medical advice, invent answers, or represent drafts as sends | OD-004/OD-010/OD-011/OD-014/OD-026 accepted; OD-019 deferred; ADR-0026 |
| Booking | Use the studio's external booking service as system of record through one of three labelled tiers: one evidence-selected deep adapter, tracked hosted link/embed, or operator-assisted reconciliation. One campaign offer may expose multiple provider-managed locations/instructors/classes/resources; normalize booking references/events, enforce active/tail eligibility where product-controlled, link attendance, and create human notification due work | No native availability/routing/capacity/conflict/substitution/waitlist/membership/payment engine, multi-provider availability merge, forced provider migration, or WhatsApp send path. Provider-native notifications remain provider behavior | OD-003, OD-004, OD-011, and OD-020 accepted; [ADR-0020](../architecture/adr/ADR-0020-external-booking-system-of-record.md) |
| Follow-up | Product may create policy-aware private drafts/checklists and due work for at most 2 no-response reminders, 1 appointment reminder, 1 first reschedule-or-cancel notice, and 1 no-show recovery step, subject to campaign/tail state, service hours, recorded consent/opt-out, takeover, and suppression; a human decides and sends manually | No automated send, provider/message quota claim, open-ended nurture, bulk reactivation, extra booking-change reminders, or custom workflow builder | OD-011/OD-027/OD-032 accepted; OD-019 deferred |
| Lightweight pipeline | Workspace Contact plus campaign-specific Lead; captured, engaged, qualification unknown/qualified/unqualified/human-review, booking-invited/booked, attended/no-show/cancelled, won/lost, and orthogonal handoff/takeover; deterministic transitions and immutable history | No general/custom CRM pipelines or objects, forecasting, territories, invoicing, general tasks, bulk reactivation, email sequences, arbitrary workflows, or native CRM sync | OD-013 accepted; export/sync remains OD-034 |
| Outcome intelligence | First-known in-scope campaign attribution with explicit evidence/confidence/unknown; verified attended/no-show/cancelled and separate won/lost/value events; occurred/recorded times; append-only correction/dispute history; deterministic funnel counts/rates; one weekly memo and next-test proposal | No booking/message-as-attendance, inferred outcome, causal claim, black-box optimization, broad BI suite, or probabilistic multi-touch attribution | OD-003/OD-012/OD-028 accepted; [ADR-0028](../architecture/adr/ADR-0028-product-owned-metrics-posthog-sentry-otel.md) |
| Trust and control | Typed proposals only from AI; deterministic approval, booking, due-work, and evidence controls; exact occurrence authorization; audit; recorded consent/suppression; tenant/secrets isolation; execution-time recheck; scoped emergency pause; immediate draft suppression/takeover; explicit resume; safe failure; durable versioned Vercel Workflow steps started through the product outbox and governed by database state/idempotency | No AI/operator customer approval, inferred approval, autonomous spend, Meta dispatch, workflow-journal authority, raw unnecessary workflow payloads, request-lifetime background promises, or external action outside accepted bounded policy | OD-010 and OD-024 through OD-027 accepted; ADR-0024/ADR-0025/ADR-0026/ADR-0027; OD-018/OD-019 deferred |
| Managed pilot operations | Two trained/named unpaid pilot operators cover daily 10:00–20:00 IST with founder escalation and may assist onboarding/configuration, QA, exact-approved manual Instagram publication, manual WhatsApp response/reconciliation, approved manual paid media, booking exceptions, and weekly review through individual assigned tenant-scoped access. Material on/off-platform work records actual time, market-rate shadow cost, reason, customer involvement, and product-gap category. Initial admission cap is 10 live Workspaces. | No 24/7 human promise, impersonation, shared credentials, hidden back-office actions, routine direct-DB correction, assumption that volunteer coverage persists, or permanent dependence on manual copying. Expansion to 20 and then toward 50 requires founder approval plus four consecutive passing weeks, p90 operator work ≤2 hours/Workspace/week, no severe trust incident or missed critical target, and ≥30% rostered reserve; otherwise admission pauses or staffing increases. | OD-005, OD-009, OD-014, OD-031, and OD-032 accepted |
| Capacity and cost controls | Load/admission tests use 10 live Workspaces, 10 cohort activations, 200 Leads per Workspace, and 60 planned/manual Instagram publications per rolling 28 days. Technology ceilings are INR 10,000/month development/staging, INR 15,000 one-time readiness/evaluation/recovery, and INR 30,000/month live pilot; cycle AI allowances are INR 750/1,250 and operator time is initially shadow-costed at INR 200/hour. Notify at 50/75/90%. | At 100%, retain data and inbound Lead capture/reconciliation but deny new activation and optional expensive generation pending founder review. Never drop inbound evidence, create surprise customer charges, or silently switch to an unevaluated model/config. Ads and legal/counsel are separately authorized. | OD-014/OD-023/OD-031/OD-032/OD-033 accepted; the OD-033 evidence checklist still gates live provider/legal readiness |

## 7. Explicit non-goals

The following are outside the MVP even if a provider makes them easy to add:

- Launching or validating multiple vertical packs at once, or marketing the MVP as ready for “all small businesses.” This does not weaken the accepted requirement that the underlying core remain vertical-agnostic.
- A Canva-style editor, large template marketplace, stock library, or pixel-perfect free-form design tooling.
- AI-generated or assembled video, voice-over, voice calling, or call transcription.
- TikTok, YouTube, LinkedIn, X, Pinterest, Google Business Profile, or every social network.
- Facebook in any form, Meta API integration, Instagram/WhatsApp DM automation, or social listening unless later approved through a new scope decision and ADR.
- Software/API paid-ad account management, launch, pause, bid/budget/audience control, Lead Ads ingestion, or automatic optimization. The accepted human-run handoff may use approved assets under separate exact authorization and hard caps, but cannot claim ads-platform compatibility or hide manual execution.
- A general-purpose CRM, help desk, ecommerce catalog, payments/deposits, invoicing, forecasting, custom objects, or territory management.
- A generic automation/workflow builder, open-ended agent tool access, or user-authored executable automations.
- Fully autonomous campaign strategy, publishing, messages, offer changes, claim changes, or material budget changes.
- A proprietary foundation, image, embedding, speech, or video model.
- ML-based lead scoring before a sufficient set of verified outcomes demonstrates measurable lift over transparent rules.
- Guaranteed revenue, guaranteed bookings, causal attribution, or “self-improving” claims unsupported by controlled evidence.
- Perfect multi-touch attribution, cross-device identity resolution, data clean-room features, or a custom analytics warehouse.
- Native CRM sync, billing automation, outcome-linked fees, referral programs, product-owned scheduling/routing/capacity management, multi-provider availability merging, multiple campaign offers/outcomes, franchise/multi-brand management, or public API/marketplace. Multiple provider-managed locations/instructors/classes/resources for the single campaign offer are explicitly allowed.
- Enterprise SSO/SCIM, complex approval chains, custom data residency per customer, or regulated-industry compliance certifications.
- Multilingual generation, localization, and multi-currency operation until the first geography and language are validated.
- Replacing the owner in sensitive, high-value, angry, uncertain, legal, medical, financial, or negotiation conversations.

Requests for any item above require an explicit scope decision and backlog change; they are not implicitly accepted as “small additions.”

## 8. MVP success metrics

The discovery and product-outcome gates are accepted under OD-006. Exact technical telemetry and reliability measurement remain subject to OD-028. Phase 0 must measure each design partner's baseline before any uplift claim is finalized.

### 8.1 North-star metric

**Qualified attended bookings per active pilot business per rolling 28 days.**

- **Qualified** means all approved mandatory fit criteria for the chosen vertical are satisfied and recorded.
- **Attended** means the owner or trusted calendar/outcome integration verifies that the prospect attended the defined appointment/trial.
- **Active pilot business** means the workspace had at least one approved campaign live for 14 or more days in the 28-day window.
- Absolute target and improvement target cannot be set credibly until baseline discovery is resolved; OD-001, OD-003, and OD-004 have fixed the pilot domain, outcome type, and qualification decision model.

### 8.2 Gate G0 discovery evidence

Execution records, privacy-safe templates, stop conditions, and the founder decision record are maintained in the [Gate G0 execution pack](../discovery/GATE_G0_EXECUTION.md). This table remains the scope authority; the execution pack does not lower any threshold.

| Metric | Accepted pass threshold |
|---|---|
| Discovery | At least 10 eligible-owner interviews; continue toward 20 if material findings have not stabilized; include behavioral/workflow/baseline evidence and counter-evidence rather than opinion only |
| Design partners | 5 signed two-cycle participation commitments; at least 3 demonstrate usable four-week baseline plus governed channel/outcome readiness; at least 2 are paid or deposit-backed before G0, as accepted in OD-005 |
| Repeated pain | At least 70% of eligible interviewees report both slow/fragmented lead handling and inability to connect campaign activity to attended outcomes |
| Willingness to pay | At least 2 design partners make paid or deposit-backed commitments before G0 without a promise of guaranteed outcomes; at least 3 paid renewals/post-pilot agreements remain the later commercial-success gate |
| Workflow validity | One full campaign-to-attendance workflow is completed manually for at least 2 businesses and produces no unresolved legal/policy blocker |
| Prototype validity | At least 5 eligible owners test the core clickable-prototype journeys; material confusion, missing steps, objections, and required manual assistance are recorded and resolved or explicitly accepted |

### 8.3 Product and workflow gates

| Metric | Accepted MVP pass threshold | Measurement rule |
|---|---|---|
| Activation | Median time from access granted to verified Business Brain, confirmed manual channel readiness, and a rehearsed deep/hosted/manual booking route is at most 1 business day, with at most 2 owner-hours | Measure the first 5 eligible pilots; include mapping/rehearsal time and report integration tier/provider waiting separately |
| End-to-end completion | At least 90% of approved pilot campaigns produce a traceable lead-to-outcome funnel without manual database repair | Minimum reliability sample is 10 completed campaigns: exactly 2 `CU-01` cycles from each of 5 distinct design partners; extra campaigns from one partner cannot substitute for another partner; operator UI actions are allowed and audited |
| Manual publication execution | At least 95% of authorized manual Instagram occurrences have actor/time/content/public-reference-or-screenshot evidence and are completed by scheduled time plus 30 minutes; 0 unapproved or wrong-version publications caused by the pilot operation | Measure against all authorized occurrences; platform or access failures remain visible, and unverified evidence is never upgraded to provider-confirmed |
| Lead acknowledgment | Median at most 15 minutes and p95 at most 30 minutes during configured service hours | From hosted-form Lead creation or operator-evidenced WhatsApp inbound during service hours to first substantive human response; outside-hours work starts at the next service window and no WhatsApp receipt is claimed |
| Booking integrity | 0 double bookings caused by the product; at least 99% consistency for deep-adapter state; hosted/manual evidence completeness and discrepancies reported separately | Reconcile by provider route and integration tier; never represent hosted/manual evidence as API-confirmed |
| Source completeness | At least 95% of captured leads retain campaign and offer context; missing platform identifiers are visibly marked | Denominator is all in-scope campaign entry points |
| Outcome completeness | At least 90% of booked appointments receive attended/no-show state within 7 days | Verified automatically or by owner; unknown remains unknown, never inferred |
| Owner control | 100% of recorded opt-outs, takeover requests, and emergency pauses suppress later product drafts/reminders while that state remains active | Test product suppression synthetically and sample every real event; separately audit contradictory human/off-platform actions as trust incidents because the software cannot prevent them |
| Manual message evidence and policy compliance | 100% of sampled recorded WhatsApp actions identify the human actor/time/purpose and current consent/opt-out/takeover state; 0 product records treat a draft or click as a sent message or consent | Audit all opt-out/takeover events and a risk-based sample of ordinary conversations; there is no automated provider quota or delivery-status claim |
| Grounded-answer quality | At least 95% correct, supported answers on the approved vertical evaluation set; 100% of unsupported sensitive/price/policy cases abstain or escalate | Golden set must include adversarial and conflicting-fact cases |
| Approval integrity | 100% of recorded manual publications and other governed external actions reference the exact approved version and current policy/evidence state | Automated invariant tests plus production audit sampling |
| Unauthorized actions | 0 unapproved publishes, messages, bookings, budget actions, or cross-tenant data disclosures | Release-blocking safety metric |
| Owner workload | Median ongoing campaign and exception workload at most 2 hours per business per week by pilot week 4 | Time log plus weekly owner confirmation |
| Operator support | During 10:00–20:00 IST, 100% of critical safety, opt-out, unauthorized-action, duplicate-effect, suspected privacy/security, and emergency-stop alerts are acknowledged and assigned within 30 minutes; other operational escalations within 2 service hours; routine support within 1 service day | Alert/event log plus named rota and ownership history; product draft/due-work suppression remains immediate, while off-platform execution remains a human operational responsibility |
| Admission capacity | Start with no more than 10 simultaneously admitted live Workspaces; a proposed increase to 20 or toward 50 has four consecutive passing weeks, no severe trust incident or missed critical target, p90 operator work ≤2 hours/Workspace/week, and at least 30% rostered capacity reserve | Capacity ledger uses actual operator time, leave/incident cover, active tails, and proposed-cap workload; failure holds admission at the last proven cap or requires more staff |

### 8.4 Pilot outcome gates

After the 5 design partners have each completed 2 `CU-01` campaigns (10 campaigns total):

- At least 3 have enough baseline volume to compare qualified-to-booked and booked-to-attended rates; low-volume pilots are reported separately rather than pooled deceptively.
- The median qualified-to-booked rate improves at least 20% relative to each business's measured baseline **or** median lead-response time falls at least 80% while booking quality does not decline.
- Qualified attended bookings and cost per attended booking are reported for every active business; improvement is not claimed where sample size or attribution is insufficient.
- Zero severe trust incidents occur. A severe incident is a cross-tenant disclosure, prohibited/false high-risk claim sent externally, message after confirmed opt-out or takeover, unauthorized external action, overspend, or unrecoverable duplicate booking/publication.
- At least 3 pilot customers renew or sign a post-pilot paid agreement; stated intent without a commercial commitment does not pass this threshold.

### 8.5 MVP failure or pivot triggers

Pause expansion and revisit the product thesis if any of the following occurs:

- Eligible design partners will not provide outcome data, making attended bookings unmeasurable.
- The chosen vertical does not repeat the same campaign, qualification, and booking playbook across at least 3 businesses.
- Delegated Instagram/WhatsApp access, evidence completeness, response coverage, or manual workload makes the proposed acquisition-to-conversation loop operationally unworkable.
- Human review and exception handling remain above 4 hours per business per week after four campaign cycles.
- The product causes any severe trust incident, or recurring lower-severity incidents cannot be controlled with deterministic policy.
- Businesses value content production but do not value or pay for conversion and outcome tracking; this would invalidate the stated wedge.

## 9. Approval gate

Decision acceptance is necessary but not sufficient for implementation. Before application scaffolding or feature development begins, the founder must record Gate G0 as `PASSED` with a signed `GO` in `docs/discovery/GATE_G0_EXECUTION.md`; every **YES — main build** decision must also remain accepted or amended. Until then, only research, documentation, de-identified analysis, synthetic exercises, and disposable risk-reduction prototypes may proceed.

A signed Gate G0 `GO` authorizes only Roadmap R1 / synthetic-local Phase 0 foundation work. It does not authorize real Lead data, a paid/live campaign, production providers, production AI/telemetry, or global checkout. Those paths require the applicable OD-033 evidence and the founder's separate live-readiness go/no-go. Before any later module or release work begins, every decision and evidence gate named for that work must be satisfied; an accepted policy, local fake, sandbox, template, or unchecked checklist item is not completion evidence.

The accepted decision baseline fixes the stated user, problem, journey, capability boundary, non-goals, and metric definitions. It does **not** by itself pass Gate G0, approve a named production vendor/account, prove external API behavior, or pass OD-033.
