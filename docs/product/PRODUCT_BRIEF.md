# AI Growth Agency — Master Product & Execution Brief

**Business thesis · Product strategy · PRD · Technical architecture · AI-agent workflows · Launch plan**

**WORKING DEFINITION**

**A vertical-configurable AI growth agency platform that plans campaigns, creates exact-approved content, coordinates named-human publication and messaging work, converts campaign interest into qualified appointments or customers, and learns from revenue outcomes. One domain is configured and validated at a time; the core is not hard-coded to that domain.**

| **Document item**            | **Current position**                                              |
|------------------------------|-------------------------------------------------------------------|
| **Status**                   | Accepted-decision-aligned working brief; Gate G0 and OD-033 evidence remain pending |
| **Primary reader**           | Founder + GPT-5.6 Sol; later Cursor and Hermes                    |
| **Initial market**           | Appointment-based service businesses; one vertical first          |
| **First measurable outcome** | Qualified attended booking, consultation, demo, or trial          |
| **Build principle**          | Complete one campaign-to-conversion loop before expanding breadth |
| **Freshness date**           | Market and tool references checked 13 July 2026                   |

> Purpose of this document
>
> Use this file for strategy discussion and shared context, but treat `MVP_SCOPE.md`, `OPEN_DECISIONS.md`, `SYSTEM_ARCHITECTURE.md`, accepted ADRs, and the planning documents as authoritative when wording differs. Do not scaffold until Gate G0 is recorded as passed, and do not use real Lead data or enable paid/live operation until OD-033 readiness passes.


*Prepared as a living document. Decisions should be updated in the repository, not left only inside chat history.*

# 0. How to use this document

*Use GPT Sol for judgment, Cursor for implementation, Hermes for continuity and operations, and Git as the source of truth.*

## Recommended sequence

**1.** Upload this document to GPT-5.6 Sol and use the opening prompt below.

**2.** Review the accepted strategy and architecture baseline plus the still-unverified assumptions. Do not start implementation until the founder records Gate G0 as passed.

**3.** Record any material amendment in `OPEN_DECISIONS.md` and, for an architectural change, in a focused ADR before implementation.

**4.** Let Cursor implement one small, testable work item at a time on feature branches.

**5.** Use Hermes to maintain project memory, research changing APIs, run recurring QA/documentation workflows, and coordinate status from your phone.

**6.** Update this brief when the product direction changes materially.

## Opening prompt for GPT-5.6 Sol

> You are joining this project as a critical product strategist, startup operator, and system architect.
>
> Read the attached Master Product & Execution Brief completely.
>
> Do not start coding yet.
>
> First, produce:
>
> 1. A plain-language restatement of the business and product.
>
> 2. The strongest case for the idea and the strongest case against it.
>
> 3. The ten assumptions most likely to make the product fail.
>
> 4. A recommended initial customer vertical and measurable outcome.
>
> 5. A ruthless MVP scope: what is P0, what is later, and what should never be built.
>
> 6. A proposed technical architecture, including build-vs-buy decisions.
>
> 7. A risk register covering market, product, platform APIs, AI reliability, privacy, and cost.
>
> 8. The decisions you need from me before execution.
>
> Challenge the brief where necessary. Do not simply agree with it.
>
> Use clear tables and finish with a recommended decision sequence.


## Document map

| **Section**                        | **What it answers**                                                            |
|------------------------------------|--------------------------------------------------------------------------------|
| **1. Executive thesis**            | What are we building, for whom, and why now?                                   |
| **2. Market position**             | How do Ocoya, HighLevel, HubSpot, Jasper, and others affect the strategy?      |
| **3. Product strategy**            | Where can we win without recreating every competitor feature?                  |
| **4. Product system**              | What are the major modules and user journeys?                                  |
| **5. Lead-conversion strategy**    | How will campaigns become qualified appointments and revenue?                  |
| **6. AI and workflow design**      | Which agents exist, what can they do, and where is human approval required?    |
| **7. Technical architecture**      | How should the application, data, jobs, integrations, and models be built?     |
| **8. Development operating model** | How do MacBook, GPT Sol, Cursor, Hermes, Git, and documentation work together? |
| **9. Roadmap and launch**          | What should be built first, piloted, measured, and commercialized?             |
| **10. Decisions and prompts**      | What must be resolved next, and how should GPT Sol be used?                    |

> Important account distinction
>
> A ChatGPT subscription can be used for planning and review with GPT-5.6 Sol. Production use of OpenAI models inside the application requires an OpenAI API account with separate billing. Treat these as two different budgets.


# 1. Executive thesis

*The business should sell growth outcomes, not a monthly quota of AI-generated posts.*

## The idea in easy language

A business owner tells the product what the business sells, who the ideal customer is, what the brand sounds like, and what result is needed. The product proposes a campaign, creates the required content, asks for exact approval, creates publication and response due work for named humans, captures hosted-form and manually reconciled Lead evidence, supports booking through an approved external route, records outcomes, and improves the next campaign.

| **Step**          | **System responsibility**                                                                                       | **Owner responsibility**                                   |
|-------------------|-----------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| **1. Understand** | Build a verified Business Brain from guided entry, one approved business domain, approved booking-route metadata, offers, pricing, audience, FAQs, and supplied previous results. Imported values remain provisional. | Explicitly verify, reject, or correct every campaign-critical fact. |
| **2. Plan**       | Recommend campaign goal, offer, audience, message, channels, budget, funnel, and success metrics.               | Approve or modify the strategy.                            |
| **3. Create**     | Generate typed copy/layout proposals and deterministic-template posts, landing pages, private message drafts, and carousels using governed media. | Approve sensitive claims, media, and exact rendered versions. |
| **4. Execute**    | Schedule exact-approved manual occurrences, create due work, record actor-attributed publication evidence, and capture hosted-form/manual Lead source context. | Named humans publish through the official Instagram app and record honest evidence. |
| **5. Convert**    | Create private grounded drafts and worklists, enforce product-side consent/tail/takeover rules, and use the approved booking route without owning provider schedules. | Humans review/send every WhatsApp message and own sensitive or complex conversations. |
| **6. Learn**      | Connect campaign, lead, appointment, and sale data; recommend the next experiment.                              | Approve material strategy or budget changes.               |

## Positioning statement

> Recommended category
>
> An AI growth agency for a focused vertical: from campaign idea to qualified, attended outcome in one system.


## North-star outcome

The primary product metric should be qualified attended outcomes per active business per month. Depending on the vertical, an outcome may be an attended trial class, consultation, demo, inspection, assessment, or confirmed appointment. Reach and engagement are diagnostic metrics, not the final promise.

## Initial strategic assumptions

| **Decision area**       | **Working assumption**                                                                              | **Why**                                                                                    |
|-------------------------|-----------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| **Customer**            | Owner-operated appointment-based service business                                                   | Clear funnel, frequent missed follow-up, measurable bookings, and manageable sales cycles. |
| **Vertical**            | Use yoga studios as the first pilot pack while keeping the product core vertical-agnostic            | Focus validation and go-to-market without hard-coding the platform to one industry.         |
| **Primary channel set** | Manually published Instagram; hosted landing/form; tracked click-to-WhatsApp; human-operated WhatsApp Business | Preserves discovery-to-conversation while Facebook, marketing-email automation, and all Meta APIs remain deferred under ADR-0019. Transactional auth email is a separate identity dependency. |
| **Conversion**          | Qualified attended booking before final sale                                                        | It is measurable and less dependent on the owner than revenue alone.                       |
| **CRM boundary**        | Simple native lead pipeline plus integrations                                                       | Enough for small businesses without rebuilding HubSpot or HighLevel.                       |
| **Autonomy**            | Assisted first, supervised later, bounded autonomy last                                             | Trust must be earned through correct, auditable work.                                      |

## What success looks like for the owner

> Weekly owner summary
>
> “This campaign: 6 approved Instagram occurrences were manually published with evidence, 34 Leads were captured or reconciled, 22 qualified, 13 booked, 9 attended, and 3 became customers. Beginner-focused education produced the best observed booking rate. Approval is needed for the next campaign proposal.”


# 2. Market landscape and competitor reality

*The market is crowded. The strategy must avoid a head-on feature war with mature platforms.*

## Competitor map

| **Product**               | **Where it is strong**                                                                            | **What it already proves**                                                             | **Strategic opening for us**                                                                                 |
|---------------------------|---------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| **Ocoya**                 | AI social content, scheduling, approvals, collaboration, and social analytics                     | Small businesses and agencies want one place to create, approve, and schedule content. | Do not compete only on content and calendar. Continue into lead conversion and revenue learning.             |
| **HighLevel**             | CRM, funnels, messaging, automations, calendars, ads, AI conversations, booking, and reactivation | A broad campaign-to-customer platform is possible and valuable.                        | Win through much simpler vertical workflows, faster setup, better recommendations, and less configuration.   |
| **HubSpot Breeze**        | CRM context, content, lead capture, qualification, scoring, booking, handoff, sales, and service  | AI can span the full go-to-market workflow when connected to customer data.            | Serve customers who find a full CRM suite excessive; focus on a specific outcome and vertical.               |
| **Jasper**                | Brand knowledge, campaign briefs, content workflows, enterprise governance                        | Brand-controlled AI content is a serious product category.                             | Connect brand content to lead conversations, appointments, and revenue rather than stopping at deliverables. |
| **Canva / social suites** | Design, templates, creative production, publishing, listening, and team workflows                 | Creative polish and usability are baseline expectations.                               | Do not integrate in the MVP; use controlled deterministic templates and revisit only after measured workflow demand. |

## Honest conclusion

Ocoya is a strong benchmark for the content creation, approval, calendar, and publishing layer. HighLevel and HubSpot are the more serious strategic threats once the product includes lead qualification, booking, follow-up, and CRM-style workflows. We should not claim to be “better” in general. We should be materially better for one narrow customer and one measurable job.

> The replacement test
>
> If a customer can replace the product with Ocoya plus a spreadsheet, the product is not differentiated enough. The system must understand the campaign, manage the lead conversation, book the outcome, record what happened, and use the result to improve future campaigns.


## Where we should compete

| **Do not fight on**                     | **Compete on**                                                  |
|-----------------------------------------|-----------------------------------------------------------------|
| **Number of social networks**           | Depth of one vertical conversion workflow                       |
| **Number of design templates**          | Quality of business context and campaign recommendations        |
| **Cheapest AI captions**                | Qualified bookings and customer outcomes                        |
| **Generic automation builder**          | Ready-made playbooks that require little configuration          |
| **Perfect all-in-one CRM breadth**      | Campaign-native lead context and simple owner experience        |
| **Autonomous actions without controls** | Approval, auditability, safe escalation, and reliable execution |

## Why a vertical wedge matters

A configured vertical pack can know the typical offers, customer objections, qualification questions, booking flow, seasonality, terminology, compliance risks, and conversion benchmarks. The reusable core supplies campaigns, approvals, leads, conversations, outcomes, policies, audit, and integrations. The first yoga pack must feel like a tested operating system rather than a generic setup exercise, but yoga-specific behavior must not be embedded in core modules.

# 3. Product strategy and product principles

*The vision is broad; the first sellable loop must be deliberately narrow.*

## Recommended first product

> AI Campaign + Lead Concierge
>
> Create one goal-based campaign, coordinate exact-approved human publication through the accepted channel set, capture every Lead with honest campaign context, support human qualification and provider-owned booking, and show which content is associated with attended outcomes.


## Product principles

| **Principle**                           | **Meaning in the product**                                                                                                                |
|-----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| **Outcome first**                       | Every campaign begins with a business goal and funnel metric, not a request for “more posts.”                                             |
| **Business truth before generation**    | Prices, claims, policies, offers, and FAQs must come from an owner-approved Business Brain.                                               |
| **AI proposes; systems enforce**        | AI can plan and create. Deterministic backend services control permissions, approvals, schedules, budgets, retries, and external actions. |
| **Approval is version-specific**        | Editing an approved price, claim, offer, asset, audience, or budget creates a new version that may require re-approval.                   |
| **Campaign context follows the lead**   | The lead record keeps the exact campaign, creative, offer, form answers, and conversation history.                                        |
| **Learn from downstream outcomes**      | Optimize toward qualified, attended, and won outcomes—not only clicks, likes, or raw leads.                                               |
| **Explain every recommendation**        | Show evidence, sample size, confidence, expected impact, and the proposed experiment.                                                     |
| **One reliable loop beats broad demos** | One reliable manual channel set and one conversion flow are better than ten partially working integrations.                              |

## Explicit non-goals for the first release

- A full Canva replacement or complex free-form design editor.

- A complete general-purpose CRM with forecasting, invoicing, territories, custom objects, and enterprise sales administration.

- Support for every social network.

- Fully autonomous advertising budget changes.

- A proprietary foundation model, image model, or video model.

- Perfect multi-touch attribution or certainty from tiny datasets.

- Voice calling, ecommerce catalogue management, or customer support ticketing unless required by the chosen vertical.

- Serving every small business category at launch.

## Autonomy ladder

| **Mode**               | **What the system may do**                                                              | **What the owner approves**                                                  |
|------------------------|-----------------------------------------------------------------------------------------|------------------------------------------------------------------------------|
| **Assisted manual (initial MVP)** | Draft plans, assets, private replies, schedules, and checklists. Named humans publish/send externally and record evidence. | Every campaign/artifact plus exact Instagram occurrences; humans review every WhatsApp send. |
| **Supervised (future)** | Execute routine actions inside an approved campaign and policy only after a separately accepted channel-integration ADR. | Campaign strategy, sensitive claims, new offers, budget, and exceptions. |
| **Bounded autonomous** | Operate within channel, budget, claim, frequency, and confidence limits; pause on risk. | Policy changes, material budget changes, high-risk content, and escalations. |

# 4. Major product components

*Each component should have a clear customer job, system boundary, and release priority.*

| **Component**               | **Customer job**                          | **P0 capability**                                                                                       | **Competitor-grade evolution**                                                                       |
|-----------------------------|-------------------------------------------|---------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| **1. Business Brain**       | Teach the agency the business once.       | Guided vertical profile; one bounded owner-approved domain and approved booking-route metadata as provisional sources; explicit owner verification; relational/full-text retrieval. | Evidence-gated document/vector sources, richer campaign memory, and additional governed vertical templates. |
| **2. Growth Planner**       | Turn a business goal into a campaign.     | Goal, audience, offer, channel, funnel, content plan, lead flow, KPI, assumptions.                      | Budget scenarios, capacity awareness, benchmarks, reusable playbooks, experiment backlog.            |
| **3. Creative Studio**      | Produce coordinated campaign assets.      | Six Instagram assets/captions, landing copy, and a manual WhatsApp playbook/private drafts.             | Bulk edit, localization, templates, variant testing, rich preview, brand QA, content reuse.          |
| **4. Approval Centre**      | Review important decisions quickly.       | Versioned approve/reject/request-change; comments; exact diff; audit event.                             | External approval links, multi-step policies, approval bundles, SLA reminders, risk labels.          |
| **5. Calendar + Manual Publication** | Coordinate exact-approved publication. | Calendar, occurrence authorization, human due work, actor/time/hash/URL-or-screenshot evidence, honest verification state. | API publishing only after ADR-0019 re-entry evidence and a new ADR. |
| **6. Human-assisted Lead Concierge** | Turn interest into a qualified next step. | Hosted-form/manual reconciliation, private grounded drafts, progressive qualification, booking, follow-up due work, takeover. | API inbox/routing/reactivation only after separate validation. |
| **7. Revenue Intelligence** | Understand what produced customers.       | Campaign-to-lead-to-booking funnel, outcomes, lost reasons, weekly learning memo.                       | Offline conversion sync, cohort value, experiments, benchmarks, budget recommendations.              |
| **8. Trust + Control**      | Stay safe and in control.                 | Roles, tenant isolation, approval rules, consent, opt-out, audit log, emergency pause.                  | Fine-grained policy engine, compliance packs, anomaly detection, advanced retention and export.      |

## Primary owner journey

| **Moment**           | **Owner sees**                                               | **System does**                                                                              |
|----------------------|--------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| **Onboarding**       | Guided entry plus provisional facts from one approved business domain and approved booking-route metadata. | Creates Business Brain candidates; flags uncertainty; requires owner verification of campaign-critical facts. |
| **Campaign request** | Goal, time period, budget, capacity, and offer controls.     | Builds strategy, expected funnel, assets, lead questions, and success metrics.               |
| **Approval**         | One campaign summary plus asset previews and risk labels.    | Locks approved versions and creates scheduled work.                                          |
| **Execution**        | Calendar, manual publication evidence, lead worklist, and alerts. | Creates due work/drafts, records form Leads/manual channel evidence, and books; named humans publish and converse. |
| **Weekly review**    | Outcomes, lost reasons, evidence, and recommended next test. | Connects the funnel and proposes the next campaign or correction.                            |

## Minimum credible MVP acceptance criteria

- An owner can create a verified Business Brain without manual database work.

- The owner can request one measurable campaign and receive a coherent plan plus coordinated assets.

- The owner can approve an exact asset/campaign version and see an audit trail.

- Approved Instagram posts can be scheduled for named humans and completed with exact-version evidence, lateness/failure states, and no provider-confirmation claim.

- A lead can be captured from the campaign with source context and consent information.

- Private Lead Concierge drafts help a human answer approved FAQs and qualify progressively; booking uses real availability.

- The owner can take over instantly and product drafts/reminders stop; the product never sends WhatsApp in the initial MVP.

- The product can show the funnel from campaign to qualified lead to attended outcome.

- A weekly learning memo recommends the next experiment and separates evidence from hypothesis.

# 5. Lead-conversion strategy

*Lead handling should be core, but the product should not become a complete CRM in version one.*

## Product boundary

> Recommended boundary
>
> Build a campaign-native lead-conversion layer: capture, human-operated conversation support, qualification, provider-owned booking, bounded transactional follow-up, handoff, outcome, and learning. Provide a simple native pipeline. CRM adapters and sync are deferred; a governed tenant-scoped CSV handoff is allowed only for an evidenced partner need.


## Lead lifecycle

| **Stage**       | **Automation**                                                                     | **Stored context**                                                              | **Escalation**                                                       |
|-----------------|------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------------------------------------------|
| **Capture**     | Create Contact/Lead records from the hosted form; record a tracked WhatsApp click only as a click; let a named operator reconcile an actually observed WhatsApp conversation. No DM, Lead Ads, or Meta inbox ingestion. | Campaign, creative, offer, UTM/click ID, form answers, consent/evidence, actor where reconciled, timestamps, and uncertainty. | Duplicate, closed campaign, missing consent/evidence, or suspected spam. |
| **Acknowledge** | Create time-bound response due work and a private campaign-specific draft; a named human reviews and sends through WhatsApp Business. | Due/actual response time, service window, consent/suppression, draft version, human actor/evidence. | Outside hours, opt-out, takeover, policy restriction, or missing human capacity. |
| **Answer**      | Propose a private answer using only current verified business facts and manually entered conversation evidence. | Source/version of each fact, confidence, and freshness. | Unknown price/policy, prohibited claim, angry user, sensitive topic, or low confidence. |
| **Qualify**     | Propose one or two transparent questions at a time for human review/send; store structured answers and four-state fit. | Fit evidence, intent, urgency, location, preference, and timeline. | High-value prospect, negotiation, sensitive answer, low confidence, or owner rule. |
| **Book**        | Use one approved `BookingRoute`: deep adapter only if selected, otherwise tracked hosted link or operator-assisted evidence. The external provider owns availability, routing, capacity, conflicts, payments, and authoritative state. | Provider reference/evidence, route/evidence tier, service, consent, timezone, and reconciliation status. | No suitable option, provider uncertainty, special request, or deposit issue. |
| **Follow up**   | Create human-handled confirmation, reminder, first reschedule/cancel, or no-show work only for an already booked Lead within the accepted transactional tail. Open-ended nurture and reactivation are excluded. | Reason, due work, tail eligibility, prior action, suppression/takeover state, and human evidence. | Tail expiry, repeated non-response, complaint, opt-out, cancellation, or emergency stop. |
| **Outcome**     | Record attended, won, lost, and reason; sync where needed.                         | Revenue or outcome value, source campaign, owner verification.                  | Conflicting data or uncertain attribution.                           |

## Explainable lead score

| **Dimension**  | **Suggested weight** | **Examples**                                                                     |
|----------------|----------------------|----------------------------------------------------------------------------------|
| **Fit**        | 0–40                 | Location, service match, eligibility, business size, role, or vertical criteria. |
| **Intent**     | 0–30                 | Asked for availability, price, demo, trial, or a direct next step.               |
| **Urgency**    | 0–20                 | Wants to start this week, has a deadline, or has an active need.                 |
| **Engagement** | 0–10                 | Answered questions, opened links, returned to the conversation.                  |

*Begin with transparent rules. Use machine learning only after enough verified outcomes exist and only when its lift can be measured.*

## Human takeover rules

| **Take over when**                                                                                                                              | **Owner receives**                                                                                                                         |
|-------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| **The person requests a human, shows strong buying intent, needs negotiation, is upset, asks a sensitive question, or the agent is uncertain.** | A concise summary: source campaign, goal, qualification facts, objection, recent messages, recommended next action, and a suggested reply. |

## Lead data that improves marketing

The most valuable marketing signals often occur after the click. The product should learn which campaign produced qualified leads, which question caused drop-off, which objection blocked booking, which reminder recovered a lead, which appointments were attended, and which customers were won. Lost-lead reasons become campaign inputs, not forgotten CRM notes.

# 6. AI agents and workflow management

*Use specialist agents for judgment. Keep external actions behind deterministic services and explicit policy checks.*

## Agent roles

| **Agent**                        | **Role**                                                                 | **Inputs**                                           | **Structured output**                                      | **May not directly do**                                     |
|----------------------------------|--------------------------------------------------------------------------|------------------------------------------------------|------------------------------------------------------------|-------------------------------------------------------------|
| **Campaign Orchestrator**        | Reason over application-owned workflow state, coordinate proposal work, reconcile outputs, and request approvals. | Goal, verified Business Brain snapshot, authoritative campaign state, policy. | Proposed next step, task list, status, approvals needed. | Own authoritative state, publish/send, spend money, or alter records without deterministic services. |
| **Business Context Agent**       | Extract and reconcile business knowledge.                                | Guided fields, one bounded approved website/domain snapshot, approved booking-route metadata, prior campaigns. | Facts, sources, conflicts, missing fields, confidence. | Mark disputed facts as approved or ingest files/live-web truth. |
| **Strategy Agent**               | Design the campaign and funnel.                                          | Goal, audience, capacity, budget, history.           | Brief, offer, message, channels, funnel, KPI, assumptions. | Commit ad spend or guarantee results.                       |
| **Copy Agent**                   | Create accepted-channel copy and variants.                               | Approved brief, brand rules, platform constraints.   | Instagram captions, landing copy, manual WhatsApp drafts, CTA. | Invent facts, discounts, claims, or testimonials.           |
| **Creative Director**            | Plan visual concepts, template choices, governed media, and carousel frames. | Brief, verified facts, brand assets, formats, copy. | Typed creative plan, media brief, template/layout proposal. | Approve legal/brand risk or create final pixels directly. |
| **Brand + Compliance Reviewer**  | Check facts, voice, claims, repetition, policy, and format.              | Generated assets, sources, rules.                    | Pass/fail, issues, risk level, corrections.                | Override explicit owner or legal restrictions.              |
| **Lead Concierge**               | Continue campaign context in human-operated conversations and propose the next action. | Lead source, verified Business Brain snapshot, manually reconciled dialogue, approved booking-route evidence. | Private reply/checklist, qualification update, next action, confidence. | Read or send WhatsApp, negotiate beyond rules, or send after opt-out. |
| **Analytics + Experiment Agent** | Explain funnel performance and propose tests.                            | Events, outcomes, costs, sample size, history.       | Finding, evidence, confidence, recommendation, experiment. | Claim causality without evidence or change budget directly. |

## Deterministic services

| **Service**                      | **Why it must not be an unconstrained agent**                                                              |
|----------------------------------|------------------------------------------------------------------------------------------------------------|
| **Approval service**             | Must enforce exact versions, roles, timestamps, comments, and re-approval conditions.                      |
| **Scheduler**                    | Must create exact manual occurrences/due work at the correct timezone and enforce cancellation/state.     |
| **Manual channel evidence**      | Must distinguish due work/drafts from human action and retain actor/time/version/evidence/verification.    |
| **Budget and policy engine**     | Must prevent overspend, disallowed claims, out-of-tail guidance, and unapproved actions.                   |
| **Consent and guidance engine**  | Must suppress product drafts/reminders under recorded opt-out, service-hour, takeover, and pause state.    |
| **Audit log**                    | Must create immutable evidence of who changed, approved, manually acted, booked, or paused.                |

## Core workflows

| **Workflow**                  | **Agents**                       | **Services**                               | **Human checkpoint**                                      | **Failure handling**                                 |
|-------------------------------|----------------------------------|--------------------------------------------|-----------------------------------------------------------|------------------------------------------------------|
| **Business onboarding**       | Context Agent                    | Importer, storage, source tracker          | Owner approves facts, prices, claims, restrictions.       | Keep uncertainty visible; do not silently guess.     |
| **Campaign planning**         | Orchestrator + Strategy          | Campaign state, policy engine              | Approve strategy, offer, budget, audience.                | Return assumptions and alternatives.                 |
| **Content production**        | Copy + Creative + Reviewer       | Template renderer, media store, versioning | Approve campaign bundle or risky assets.                  | Regenerate only failed assets; keep version history. |
| **Scheduling and publication** | Orchestrator monitors only | Approval, scheduler, manual due work/evidence | Named human publishes exact approved version. | Flag lateness/access/wrong-version/missing evidence; never claim provider confirmation. |
| **Lead conversion** | Lead Concierge | Form/manual reconciliation, worklist, calendar, consent guidance | Human reviews/sends every WhatsApp message and takes direct ownership on risk. | Suppress drafts/reminders and preserve context/evidence. |
| **Weekly learning**           | Analytics + Experiment           | PostgreSQL product-event tables and versioned attribution/formula rules | Approve any next campaign or material budget proposal. | Show confidence, sample size, and data gaps. |

> Model-routing principle
>
> Bind each task to an application-owned, static, explicitly evaluated model/config policy under ADR-0023 and ADR-0026. Terra, Sol, and Luna are evaluation candidates, not automatic quality tiers; no model selects its own route and no unevaluated fallback is allowed.


# 7. Technical architecture and build plan

*Start modular and reliable. Avoid microservices before there is a real scaling or isolation need.*

## Recommended architecture

> Web application (Next.js + TypeScript)
>
> │
>
> ├── Product API / domain services
>
> │ ├── Business Brain
>
> │ ├── Campaigns + content versions
>
> │ ├── Approvals + policies
>
> │ ├── Leads + conversations + bookings
>
> │ └── Analytics + experiments
>
> │
>
> ├── Typed model integration layer
>
> │ ├── application ModelPort + direct OpenAI Responses adapter
>
> │ ├── static evaluated task policies + structured outputs
>
> │ └── traces, evaluations, guardrails
>
> │
>
> ├── Durable jobs / workflow engine
>
> │ ├── generation jobs
>
> │ ├── manual publication and response due work
>
> │ ├── booking retries + approved webhooks
>
> │ └── analytics sync + weekly reports
>
> │
>
> ├── Integration adapters
>
> │ ├── manual Instagram/WhatsApp evidence (initial)
>
> │ ├── booking/calendar adapter; transactional auth-email delivery before real invitations
>
> │ └── Meta, marketing-email, CRM, and payment integrations deferred
>
> │
>
> └── Data layer
>
> ├── PostgreSQL relational + full-text retrieval
>
> ├── private Supabase Storage
>
> ├── event analytics
>
> └── secrets + audit logs


## Pragmatic technology stack

| **Layer**          | **Recommended starting choice**                                                                    | **Reason / alternative**                                                                          |
|--------------------|----------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| **Frontend**       | **Accepted by OD-037:** Next.js 16.2 App Router, React 19.2, strict TypeScript 6, Tailwind 4, source-owned native/Radix components | Stable Node 24 path with WCAG ownership; TypeScript 7 and experimental framework features deferred. |
| **Backend**        | **Accepted by OD-015:** modular TypeScript domain services in one monorepo, with web/API and durable-worker execution units | One logical modular monolith; split services only after measured scaling, isolation, or team-ownership evidence. |
| **Database**       | **Accepted by OD-025:** Supabase Pro PostgreSQL in Mumbai, Drizzle ORM/Kit plus `node-postgres`, relational/full-text retrieval, no initial vectors | One transactional source with reviewed SQL migrations and tenant constraints; reconsider pgvector only after measured failures and an accepted amendment. |
| **Auth + tenancy** | **Accepted by OD-016:** Supabase Auth for identity/session; application-owned Organization/Workspace/Membership, fixed roles, and support grants | Invite-only passwordless pilot; operator MFA; never treat provider metadata or a client-selected Workspace as authorization. |
| **Agent runtime**  | **Accepted by OD-023:** direct OpenAI Responses via the official JavaScript SDK behind an application-owned typed `ModelPort` and static task-policy registry | Strict structured outputs and allow-listed proposal/read tools; product database owns state; Gateway, AI SDK, Agents SDK, built-in tools, and dynamic fallback are deferred. |
| **Workflow jobs**  | **Accepted by OD-024:** stable GA Vercel Workflow SDK behind `DurableWorkPort`, started through a transactional outbox | Same Vercel deployment, durable retry/sleep/versioning and observability; product DB/idempotency stays authoritative; no WorkflowAgent/AI SDK/direct Queues/beta runtime features. |
| **Media**          | **Accepted by OD-037:** Satori-to-SVG plus Sharp raster composition behind the renderer port | Pinned fonts/templates guarantee exact text, brand, size, logos, manifests, checksums, and OD-029 checks; generated pixels never carry authoritative facts or represent real people/premises/results. |
| **Storage**        | **Accepted by OD-025:** private Supabase Storage behind an application port                        | Signed short-lived access, checksums, lifecycle metadata, and one data-provider boundary for the pilot. |
| **Publishing**     | Manual Instagram due work plus actor-attributed evidence; provider-neutral future seam only        | ADR-0019 removes Facebook, App Review, tokens, and API delivery claims from the initial MVP.       |
| **Messaging**      | Human-operated WhatsApp Business plus private drafts/manual reconciliation; no product inbox/send   | Retains the customer channel while making consent, response labor, and uncertainty visible.       |
| **Analytics**      | **Accepted by OD-028:** PostgreSQL-owned events/formulas plus allow-listed pseudonymous PostHog Cloud EU projections | Product/audit truth never depends on analytics delivery; no broad autocapture, replay, or sensitive content. |
| **Observability**  | **Accepted by OD-028:** scrubbed Sentry EU/DE, structured Vercel logs, and OpenTelemetry conventions | Correlation and diagnosis without raw bodies, prompts, messages, direct identifiers, or secrets.   |
| **Commercial records** | Manual accountant-approved India invoices plus application-owned cycle entitlement/payment-reference status | No automated checkout or payment transport in the managed-pilot MVP. Dodo is only a conditional future candidate after written offer, country, tax, payment, and OD-033 approval. |

## Content creation pipeline

| **Step**      | **Implementation**                                                                                                               |
|---------------|----------------------------------------------------------------------------------------------------------------------------------|
| **Brief**     | Strategy Agent returns a typed campaign brief with goal, audience, offer, proof, objections, channels, KPI, and restrictions.    |
| **Copy**      | Generate one canonical message hierarchy, then channel-specific variants. Store prompt, model, source facts, and output version. |
| **Visuals**   | Use customer-approved or rights-recorded media by default; optional non-factual generated decoration requires a separately selected/evaluated provider and human review. Apply authoritative text, pricing, CTA, logo, and layout only with deterministic templates. |
| **Carousels** | Render React/HTML/SVG templates to images; validate contrast, safe zones, text length, and dimensions.                           |
| **Video**     | Excluded from the MVP under OD-022/ADR-0022; revisit only for a validated outcome experiment.                                   |
| **QA**        | Run fact, brand, spelling, duplicate, claim, accessibility, and platform-format checks.                                          |
| **Preview**   | Show exact platform preview and differences between revisions.                                                                   |
| **Approval**  | Hash or otherwise identify the exact approved content and media version.                                                         |

## Scheduling and manual publication pipeline

| **State**              | **Required behavior**                                                           |
|------------------------|---------------------------------------------------------------------------------|
| **Draft**              | Editable; never publishable.                                                    |
| **Ready for approval** | All mandatory QA checks complete; unresolved risks displayed.                   |
| **Approved**           | Exact version locked; any material edit creates a new approval state.           |
| **Scheduled**          | Instagram account, timezone, time, approved version/hash, and occurrence identity recorded; human due work created. |
| **Manual action due**  | Named human receives the exact asset/caption and checklist; the product makes no Meta request.       |
| **Completed**          | Store human actor, actual time, approved hash, public URL or screenshot/evidence, and verified/unverified state. |
| **Failed / late**      | Classify missing access, lateness, wrong version, missing evidence, or other reason; alert and reconcile. |
| **Cancelled / paused** | Revoke unfinished due work and audit actor/reason/time; already published posts remain evidenced.     |

## Core data entities

| **Entity group**          | **Important records**                                                                            |
|---------------------------|--------------------------------------------------------------------------------------------------|
| **Identity + tenancy**    | User, Organization, Workspace, Membership, Role, IntegrationCredential                           |
| **Business knowledge**    | BusinessProfile, Fact, Source, BrandRule, Offer, Audience, FAQ, ClaimPolicy, Asset               |
| **Campaign**              | Campaign, BriefVersion, AudienceVersion, OfferVersion, KPI, BudgetPolicy, Experiment             |
| **Content**               | ContentItem, ContentVersion, MediaAsset, Template, ReviewResult, Approval, Schedule, Publication |
| **Lead**                  | Contact, Lead, LeadSource, Conversation, Message, QualificationAnswer, LeadScore, Handoff        |
| **Booking + outcome**     | Availability, Appointment, Attendance, Opportunity, ConversionEvent, LostReason, Revenue         |
| **Learning + governance** | Event, AttributionLink, Recommendation, Evaluation, PolicyDecision, AuditEvent                   |

## Security and reliability requirements

| **Requirement**      | **Minimum implementation**                                                                                |
|----------------------|-----------------------------------------------------------------------------------------------------------|
| **Tenant isolation** | Tenant key on every customer record, authorization middleware, automated isolation tests.                 |
| **Secrets**          | Encrypted approved-provider tokens/API keys in managed stores; no Meta/WhatsApp credential in initial MVP. |
| **Idempotency**      | Product-controlled bookings, future payments, and approved webhooks must tolerate retries; manual channel duplicates are audited incidents. |
| **Auditability**     | Immutable record of approvals, policy decisions, external actions, model/version, and actor.              |
| **Consent**          | Purpose-specific opt-in, opt-out, suppression list, retention, deletion, and channel policy state.        |
| **Human control**    | Immediate takeover, emergency pause per workspace/campaign/channel, and safe default on uncertainty.      |
| **AI evaluation**    | Golden test cases, hallucination checks, tool-call validation, regression tests, and production sampling. |
| **Cost controls**    | Admission/campaign limits, model/media/job budgets, retry limits, manual-work tracking, and usage reporting. |

# 8. Development operating model for your setup

*Your tools should have distinct responsibilities and share durable project context.*

## Tool responsibilities

| **Tool**                   | **Primary role**                                                         | **Use it for**                                                                                          | **Do not use it as**                                               |
|----------------------------|--------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| **MacBook**                | Local development and secure operator environment                        | Repository, local services, tests, previews, development database, Hermes gateway.                      | The long-term always-on production server.                         |
| **GPT-5.6 Sol in ChatGPT** | Strategic and technical reviewer                                         | Business challenge, architecture, product tradeoffs, threat modeling, difficult debugging, plan review. | The only place where decisions live.                               |
| **Cursor**                 | Primary implementation environment                                       | Codebase exploration, feature implementation, refactoring, tests, diffs, local commands.                | An unconstrained product manager deciding scope without the brief. |
| **Hermes Agent**           | Continuity, research, orchestration, and reusable development operations | Memory, skills, project status, research, documentation, QA checklists, Git summaries, phone access.    | The ungoverned customer-facing production runtime.                 |
| **Git + GitHub**           | Source of truth and collaboration history                                | Branches, commits, pull requests, issues, ADRs, release tags, CI.                                       | A backup used only at the end.                                     |

## Recommended responsibility split

| **Work type**        | **GPT Sol**                     | **Cursor**                          | **Hermes**                                   | **Founder**               |
|----------------------|---------------------------------|-------------------------------------|----------------------------------------------|---------------------------|
| **Product strategy** | Challenge and recommend         | Read context                        | Maintain research/context                    | Decide                    |
| **Architecture**     | Design/review major choices     | Implement approved design           | Track ADRs and dependencies                  | Approve risk/cost         |
| **Feature coding**   | Review difficult plan or diff   | Primary implementer                 | Optional isolated task/review                | Accept behavior           |
| **Tests and QA**     | Design risk-based test approach | Write/run tests                     | Run repeatable checklists and summarize      | Validate user outcome     |
| **Documentation**    | Review clarity and completeness | Update near code                    | Maintain recurring docs/changelog            | Approve external claims   |
| **Research**         | Analyze hard tradeoffs          | Inspect technical docs while coding | Monitor APIs/competitors and save procedures | Set question and decision |
| **Release**          | Review readiness and risks      | Prepare code and fixes              | Run release checklist/status report          | Approve deployment        |

## Repository as shared memory

> ai-growth-agency/
>
> ├── AGENTS.md # shared instructions for coding agents
>
> ├── .cursor/rules/ # Cursor-specific rules
>
> ├── .hermes.md # Hermes operating boundaries
>
> ├── docs/
>
> │ ├── product/master-brief.md
>
> │ ├── product/prd.md
>
> │ ├── architecture/system-design.md
>
> │ ├── decisions/ADR-0001-*.md
>
> │ ├── research/
>
> │ ├── sprints/
>
> │ └── runbooks/
>
> ├── apps/
>
> │ ├── web/
>
> │ └── worker/
>
> ├── packages/
>
> │ ├── domain/
>
> │ ├── agents/
>
> │ ├── integrations/
>
> │ ├── ui/
>
> │ └── config/
>
> ├── tests/
>
> └── infra/


## Shared agent rules

- Read the master brief and relevant ADRs before proposing a major change.

- Do not modify the main branch directly. Use one feature branch or worktree per task.

- Only one agent actively edits a branch at a time; reviewers should comment or use a separate branch.

- Before coding, write acceptance criteria, affected components, migration impact, tests, and rollback plan.

- Never commit keys, tokens, customer data, generated secrets, or local environment files.

- Run formatting, type checks, unit tests, integration tests, and relevant end-to-end checks before marking a task complete.

- Update documentation and ADRs in the same pull request as behavior-changing code.

- Do not silently change product scope because implementation is easier. Escalate the tradeoff.

## Suggested task workflow

| **Step**                  | **Owner / tool**                                                      | **Output**                                                                 |
|---------------------------|-----------------------------------------------------------------------|----------------------------------------------------------------------------|
| **1. Define**             | Founder + GPT Sol                                                     | Approved problem, acceptance criteria, risks, and architectural direction. |
| **2. Record**             | Hermes or founder                                                     | Issue, ADR if needed, task plan, relevant context links.                   |
| **3. Implement**          | Cursor                                                                | Small feature branch with code, migrations, tests, and notes.              |
| **4. Review**             | Cursor second pass + GPT Sol for high-risk changes + Hermes checklist | Findings, fixes, evidence that acceptance criteria pass.                   |
| **5. Validate**           | Founder                                                               | User-level behavior accepted; screenshots/demo where useful.               |
| **6. Merge and document** | GitHub + Hermes                                                       | Merged PR, changelog, updated project status, next task.                   |

> Hermes context strategy
>
> Keep facts such as project paths, preferences, environments, and current state in memory. Keep repeatable procedures such as release checks, competitor reviews, API verification, and PRD-to-issue conversion as skills. Keep product truth and architectural decisions in the repository.


# 9. Roadmap, pilot, and launch strategy

*Validate the outcome with real customers while the product is still service-backed.*

## Recommended delivery phases

| **Phase**                            | **Outcome**                                          | **Scope**                                                                                              | **Exit evidence**                                                                 |
|--------------------------------------|------------------------------------------------------|--------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| **0. Discovery + design partners (R0)** | Prove the accepted yoga/Bengaluru workflow manually and pass Gate G0. | OD-005 cohort: 5 signed two-cycle partners, 3 baseline/access-ready, 2 paid/deposit-backed before G0; OD-006 interviews/manual trials/prototype. | Repeated pain, willingness to pay, one clear conversion event, staged commitments, and founder-recorded G0 GO. |
| **1. Repository + secure platform foundation (R1 / Phase 0)** | Create a tenant-safe engineering base after Gate G0. | Repository/tooling, auth, organizations, roles, tenant-safe persistence, provider ports/fakes, audit/event/outbox primitives, CI, and environment isolation. No Business Brain or live adapter behavior. | Gate G1 proves a clean checkout, tenant isolation, migrations, tests, and no reachable real external action. |
| **2. Verified Business Brain (R2)** | Let an owner create and approve the facts later work may use. | Guided structured entry, one bounded provisional website import, booking-route metadata, fact verification/versioning, and relational/full-text retrieval. No files, live-web truth, conversations-as-truth, or vectors. | Gate G2 proves only current verified Workspace facts can be retrieved and corrected/exported. |
| **3. Campaign, content, and exact approval (R3)** | Create and approve one complete campaign envelope. | Planner, copy, deterministic templates, governed media, QA, exact manifest/version approval, and no external effect. | Gate G3 proves the accepted `CU-01` bundle is complete, reproducible, policy-safe, and exactly approved. |
| **4. Evidenced manual publication + source-aware capture (R4)** | Coordinate named-human Instagram work and capture resulting interest honestly. | Occurrence authorization, due work, actor/time/hash/evidence, hosted form, tracked click evidence, manual WhatsApp reconciliation, spam/duplicate controls. | Gate G4 proves no Meta action is implied and every enrolled Lead has honest source/consent state. |
| **5. Human-assisted Lead Concierge + booking (R5)** | Support timely human qualification and provider-owned booking. | Worklist, private grounded drafts, human WhatsApp evidence, transparent qualification, approved booking tiers, takeover/suppression/tails. | Gate G5 proves human-visible work from source-aware Lead to real booking without product messaging or provider-state invention. |
| **6. Attendance + funnel intelligence (R6)** | Complete the campaign-to-attended-outcome loop and propose the next experiment. | Verified outcome events, versioned attribution/formulas, lost reasons, weekly/close-out memo, and evidence/confidence. | Gate G6 proves the complete synthetic loop and defensible funnel reporting. |
| **7. Pilot hardening + paid launch (R7)** | Operate reliably for paying design partners only after OD-033 passes. | Observability, policy controls, support, cost/recovery monitoring, manual invoice/entitlement reconciliation, onboarding playbook, and defensible case studies. No automated/global checkout. | Live-readiness, security/privacy/recovery, workload, budget, and founder go/no-go evidence pass before activation. |

*Timeline should be estimated after team capacity, channel APIs, and build-vs-buy decisions are approved. A solo founder should plan in months, not pretend this is a weekend build.*

## Managed-service-first launch

For the first customers, sell a polished agency outcome even if some work is manually supervised behind the scenes. Review every campaign and lead flow, study lost leads, and document each repeated procedure. Automate only workflows that work repeatedly across customers. This reduces the risk of productizing the wrong behavior.

## Pilot scorecard

| **Metric family** | **Baseline and target examples**                                                                             |
|-------------------|--------------------------------------------------------------------------------------------------------------|
| **Marketing**     | Campaign spend, reach, clicks, landing conversion, raw leads.                                                |
| **Lead handling** | Median response time, engaged rate, qualification rate, unanswered leads, takeover rate.                     |
| **Bookings**      | Booking rate, time to book, attendance rate, no-show recovery.                                               |
| **Business**      | Customers won, revenue, cost per attended outcome, owner time per week.                                      |
| **Trust**         | Incorrect claims, unauthorized actions, opt-outs, complaints, duplicate messages/posts, failed publications. |
| **Product**       | Activation time, campaign approval time, weekly active owners, retention, workflow completion.               |

## Business model hypothesis

| **Revenue component**        | **Purpose**                                                                                                              |
|------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| **Credited commitment deposit** | The first five design partners pay INR 1,000, fully credited to cycle one; there is no separate pilot onboarding fee.   |
| **Fixed 28-day design-partner cycle** | INR 4,999 plus applicable tax through 100 new Leads, or INR 6,999 selected before activation for 101–200; includes the bounded campaign, managed manual assistance, analytics, and support. |
| **Separate customer costs**  | Ad spend and third-party booking/provider charges remain customer-paid; there is no surprise per-Lead overage.            |
| **Outcome-linked fee later** | Optional charge for verified attended outcomes or qualified opportunities after attribution and definitions are trusted. |

The first-five prices are subsidized validation terms because two named friends of the founder will operate the measured pilot without salary. Their actual minutes and market-rate shadow cost remain part of unit economics; permanent pricing cannot assume unpaid labour. Customers intend two cycles, pay before activation, and may cancel before the next cycle. Volume beyond the selected tier is retained as evidence but triggers handoff/capacity review rather than surprise billing. Post-pilot INR 7,999/9,999 prices remain hypotheses until workload, outcome, and renewal evidence is measured inside the accepted OD-032 cost envelope.

OD-032 caps product technology spending at INR 10,000 per calendar month during development/staging, INR 15,000 one time for production-readiness tests/model evaluation/recovery drills, and INR 30,000 per calendar month during the live pilot through 10 Workspaces. The live planning allocation is INR 16,000 for Vercel/Supabase/PITR, INR 8,000 for OpenAI, INR 2,000 for AWS recovery/KMS plus monitoring/email, and INR 4,000 reserve. The INR 4,999/6,999 cycle tiers receive INR 750/1,250 AI allowances, and unpaid operator time is initially shadow-costed at INR 200/hour. Advertising and OD-033 legal/counsel costs are separate.

Usage notifications occur at 50%, 75%, and 90%. At 100%, the product preserves customer data and inbound Lead capture/reconciliation but blocks new campaign activation and optional expensive generation pending founder review. It never creates an unapproved customer charge or silently lowers evaluated quality. Any ceiling increase requires explicit founder approval.

OD-033 accepts a mandatory, dated live-readiness policy rather than declaring the product legally or operationally ready. Real Lead data, paid/live activation, production AI/telemetry, and global checkout remain disabled until actual channel access, customer/privacy/operator terms, subprocessors, data-rights and incident rehearsals, and founder go/no-go pass the [live-readiness checklist](../readiness/OD-033_LIVE_READINESS.md). Meta APIs and App Review remain outside the initial manual MVP.

The commercial architecture remains global-ready: use configurable country, ISO currency, localized price/tax/payment methods, invoice and refund policy, and supported-jurisdiction activation rather than an INR-only billing domain. The first managed Bengaluru pilot remains manually invoiced. Dodo is the preferred later software-billing candidate subject to written offer eligibility and country/tax/payment coverage; account details will be requested from the founder only when that approved integration enters development.

## Go-to-market sequence

**1.** Choose the vertical where you have the easiest access to owners and conversion data.

**2.** Recruit design partners with a concrete promise tied to one outcome, not a broad “AI marketing” pitch.

**3.** Establish a baseline before the pilot: leads, response time, booking rate, attendance, sales, spend, and owner hours.

**4.** Operate the workflow with close supervision and weekly result reviews.

**5.** Publish case studies only when the attribution and comparison are defensible.

**6.** Productize the repeated playbook, then expand to adjacent verticals with similar funnels.

# 10. Decisions to resolve with GPT Sol before execution

*These are product choices, not merely engineering details.*

| **Priority** | **Decision**                       | **Why it blocks execution**                                                         | **Recommended default**                                                                     |
|--------------|------------------------------------|-------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| **1**        | First pilot domain and geography   | Resolved by OD-001/OD-002: the yoga pack runs first in Bengaluru through an English-first workflow, while core domain and locale settings remain configurable. | **Accepted:** yoga/Bengaluru/English-first pilot; generic vertical and locale core. |
| **2**        | Primary outcome                    | Resolved by OD-003: defines the funnel, analytics, and product promise while preserving downstream commercial evidence. | **Accepted:** qualified attended introductory trial for yoga; configurable outcome core. |
| **3**        | Initial organic channels and entry routes | Resolved by amended OD-007: controls manual execution, formats, source evidence, and first conversation path. | **Accepted:** manual Instagram only; hosted form primary; tracked click-to-WhatsApp secondary; WhatsApp Business human-operated; Facebook/marketing-email/DM automation excluded. Transactional auth email remains separate. |
| **4**        | Paid ads in MVP                    | Resolved by OD-008: preserves controlled pilot traffic without giving software spending authority. | **Accepted:** candidate package plus separately authorized human execution under hard caps; manual evidence only; no Ads API, Lead Ads, or automation. |
| **5**        | Publishing integration strategy    | Founder chose the faster manual path while value and labor are validated.            | **Deferred:** no Meta API; exact-approved manual Instagram plus evidence. ADR-0019 governs re-entry. |
| **6**        | Lead system boundary               | Resolved by OD-013: prevents accidental recreation of a full CRM while preserving campaign-specific operational state. | **Accepted:** Workspace Contact plus campaign Lead, bounded native pipeline; CRM sync deferred. |
| **7**        | WhatsApp and messaging policy      | Founder chose human operation while consent/workload evidence is gathered.           | **Deferred:** no Cloud API/BSP; private grounded drafts plus human read/send/manual reconciliation. |
| **8**        | Model and agent architecture       | Resolved by OD-023: fixes provider/runtime boundaries while leaving production task bindings subject to evaluation, privacy, and budget gates. | **Accepted:** direct OpenAI Responses behind `ModelPort`; Terra balanced candidate, Sol/Luna only when task evaluation justifies them; no dynamic/unevaluated fallback or initial agent/gateway framework. |
| **9**        | Hosting and data residency         | OD-017/OD-025 accept Mumbai Vercel compute and Mumbai Supabase data; OD-027 accepts controlled cross-border processors and OD-036 accepts independent Mumbai recovery, without an India-only claim. OD-033 accepts the mandatory legal/provider evidence gate. | **Hosting/data/privacy/recovery policy accepted:** isolated regional authority plus purpose-limited global processors and tested backups; live use awaits passing legal/provider evidence and budget. |
| **10**       | Pilot pricing and global commerce  | OD-009/OD-014 accept managed delivery and support; OD-031 fixes first-five prices, volume tiers, deposit, refund/credit and manual-invoice terms while preserving the founder's global-purchasing requirement. | **Accepted:** INR 4,999 through 100 Leads or INR 6,999 for 101–200 per 28-day cycle, INR 1,000 credited deposit, no setup fee; future billing remains country/currency/tax/payment configurable and Dodo remains subject to written eligibility. |

## Questions GPT Sol should challenge

- Is the selected vertical painful and valuable enough, or merely convenient for us?

- Can we access verified downstream outcomes, or will the product be forced back to vanity metrics?

- Which component is the genuine wedge: campaign planning, lead conversion, vertical playbooks, or agency-style service?

- What could Meta, HighLevel, HubSpot, or a vertical CRM copy quickly, and what data/workflow advantage remains?

- Which integrations are likely to delay launch because of platform review, policy, or permission requirements?

- What failure would permanently damage customer trust, and how do we prevent it by design?

- Can a solo founder support the operational load of messaging, publishing, and customer success?

- Which P0 feature can be bought or integrated instead of built without sacrificing the moat?

## Definition of ready for development

> Do not start the main build until
>
> The founder records Gate G0 as passed in `docs/discovery/GATE_G0_EXECUTION.md` after the accepted interview, design-partner, workflow, prototype, outcome, contradiction, and readiness evidence is complete. Accepted decisions and architecture are necessary but do not substitute for that record. Before G0, only research, documentation, and disposable synthetic risk-reduction prototypes are permitted; OD-033 separately gates every real-data or paid/live step.


# 11. Prompt pack for discussion and execution

*Use these prompts as starting points; keep final decisions in the repository.*

## A. Strategy challenge prompt

> Using the attached master brief, act as a skeptical investment committee and product strategist.
>
> Evaluate:
>
> - the customer pain and willingness to pay,
>
> - the first vertical and outcome,
>
> - competitive threats from Ocoya, HighLevel, HubSpot, Meta, and vertical CRMs,
>
> - the minimum wedge that can produce a defensible customer result,
>
> - the risks of building too broad a product.
>
> Return a scorecard, the strongest objections, evidence needed to resolve them, and one recommended positioning statement. Do not flatter the idea.


## B. Architecture decision prompt

> Act as the principal architect for this product.
>
> Based on the accepted product decisions and current architecture:
>
> 1. Review the existing modular-monolith architecture and data model for the requested change; do not redesign accepted boundaries without evidence.
>
> 2. Define agent boundaries versus deterministic services.
>
> 3. Preserve manual Instagram/WhatsApp execution, manual pilot invoicing, required transactional auth email, and the accepted auth/jobs/storage/analytics choices; identify a decision amendment only if the request truly conflicts.
>
> 4. Identify platform-review and compliance dependencies.
>
> 5. Define the failure model, idempotency strategy, audit requirements, and human-approval controls.
>
> 6. Produce or amend an ADR only for a material new architecture trade-off; link existing ADRs otherwise.
>
> Optimize for a solo founder on a MacBook using Cursor and Hermes, but do not sacrifice production safety.


## C. MVP breakdown prompt

> Convert the approved master brief and architecture into an execution backlog.
>
> Create:
>
> - epics and small vertical slices,
>
> - user stories with acceptance criteria,
>
> - database and integration dependencies,
>
> - test requirements,
>
> - release gates,
>
> - a critical path,
>
> - explicit out-of-scope items.
>
> The first demo must complete one synthetic loop: verified business context → campaign → exact-approved content → named-human manual-publication due work and evidence → hosted-form or manually reconciled Lead → human-assisted qualification → provider-owned booking evidence → outcome report. It must not contact a real Lead or imply a Meta/WhatsApp API action.
>
> Do not create tasks that cannot be independently tested.


## D. Cursor implementation prompt template

> Read AGENTS.md, the master brief, the relevant ADRs, and this issue.
>
> Before editing:
>
> - restate the acceptance criteria,
>
> - identify affected modules and data migrations,
>
> - list risks and tests,
>
> - propose the smallest implementation plan.
>
> Then implement only the approved scope on the current feature branch.
>
> Run formatting, type checks, tests, and relevant end-to-end checks.
>
> Return: files changed, behavior added, tests run, unresolved risks, and documentation updated.
>
> Do not expose secrets or modify unrelated code.


## E. Hermes recurring skill ideas

| **Skill**                  | **Trigger**                              | **Output**                                                                                 |
|----------------------------|------------------------------------------|--------------------------------------------------------------------------------------------|
| **PRD-to-issue**           | Approved product change                  | Small issues, dependencies, acceptance criteria, and context links.                        |
| **Release readiness**      | Release candidate branch                 | Checklist status, failing tests, migrations, secrets, docs, rollback, and go/no-go report. |
| **Competitor/API monitor** | Weekly or before integration work        | Verified changes, impact, source links, and recommended action.                            |
| **Campaign workflow QA**   | Changes to content/publishing/lead logic | Test scenarios for approvals, duplicates, policy, takeover, retries, and attribution.      |
| **Project status**         | Daily/weekly                             | Completed work, blockers, decisions needed, risk changes, and next tasks.                  |
| **Documentation sync**     | Merged PR                                | Updated changelog, architecture map, setup/runbooks, and product status.                   |

# 12. Reference notes and freshness

*Market features, models, APIs, and pricing change. Verify current official documentation before implementation.*

## Key reference conclusions used in this brief

| **Reference**            | **Conclusion used**                                                                                                                      |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| **OpenAI GPT-5.6**       | Sol is the flagship tier for complex professional work; Terra and Luna provide lower-cost/faster routing options.                        |
| **OpenAI API billing**   | ChatGPT subscriptions and API usage are billed and managed separately.                                                                   |
| **OpenAI Agents SDK**    | Provides useful loops, tools, handoffs, guardrails, sessions, human-in-the-loop, MCP, and tracing, but OD-023 defers it until measured workflows justify those primitives and trace privacy is approved. |
| **Cursor documentation** | Project rules, AGENTS.md, skills, subagents, CLI, and hooks can provide durable coding guidance.                                         |
| **Hermes documentation** | Hermes supports persistent memory, reusable skills, project context files, profiles, and a learning loop.                                |
| **Ocoya**                | Positions around AI content creation, social scheduling, approvals, and collaboration.                                                   |
| **HighLevel**            | Provides an all-in-one growth stack including CRM, social planning, ads, conversations, workflows, calendars, lead scoring, and booking. |
| **HubSpot Breeze**       | Supports AI-assisted content plus lead capture, qualification, booking, scoring, handoff, and CRM context.                               |

## Official sources checked 13 July 2026

• OpenAI: GPT-5.6: [<u>https://openai.com/index/gpt-5-6/</u>](https://openai.com/index/gpt-5-6/)

• OpenAI API: GPT-5.6 Sol model: [<u>https://developers.openai.com/api/docs/models/gpt-5.6-sol</u>](https://developers.openai.com/api/docs/models/gpt-5.6-sol)

• OpenAI Help: ChatGPT and API billing are separate: [<u>https://help.openai.com/en/articles/8156019-how-can-i-move-my-chatgpt-subscription-to-the-api</u>](https://help.openai.com/en/articles/8156019-how-can-i-move-my-chatgpt-subscription-to-the-api)

• OpenAI Agents SDK: [<u>https://openai.github.io/openai-agents-js/</u>](https://openai.github.io/openai-agents-js/)

• OpenAI API: image generation: [<u>https://developers.openai.com/api/docs/guides/image-generation</u>](https://developers.openai.com/api/docs/guides/image-generation)

• Cursor documentation: [<u>https://cursor.com/docs</u>](https://cursor.com/docs)

• Cursor rules: [<u>https://cursor.com/docs/rules</u>](https://cursor.com/docs/rules)

• Cursor subagents: [<u>https://cursor.com/docs/subagents</u>](https://cursor.com/docs/subagents)

• Hermes Agent documentation: [<u>https://hermes-agent.nousresearch.com/docs/</u>](https://hermes-agent.nousresearch.com/docs/)

• Hermes skills: [<u>https://hermes-agent.nousresearch.com/docs/user-guide/features/skills</u>](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills)

• Hermes persistent memory: [<u>https://hermes-agent.nousresearch.com/docs/user-guide/features/memory</u>](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory)

• Hermes prompt/context assembly: [<u>https://hermes-agent.nousresearch.com/docs/developer-guide/prompt-assembly</u>](https://hermes-agent.nousresearch.com/docs/developer-guide/prompt-assembly)

• Ocoya: [<u>https://www.ocoya.com/</u>](https://www.ocoya.com/)

• HighLevel: [<u>https://www.gohighlevel.com/</u>](https://www.gohighlevel.com/)

• HighLevel AI: [<u>https://www.gohighlevel.com/ai</u>](https://www.gohighlevel.com/ai)

• HubSpot Breeze lead capture and qualification: [<u>https://www.hubspot.com/products/artificial-intelligence/use-cases/capture-and-qualify-marketing-leads</u>](https://www.hubspot.com/products/artificial-intelligence/use-cases/capture-and-qualify-marketing-leads)

• HubSpot Breeze AI agents: [<u>https://www.hubspot.com/products/artificial-intelligence/breeze-ai-agents</u>](https://www.hubspot.com/products/artificial-intelligence/breeze-ai-agents)

> Freshness rule for the project
>
> Before implementing an external integration or selecting a model, verify the current official API documentation, permissions, review process, pricing, rate limits, deprecations, regional availability, and policy constraints. Save the verified result and date in docs/research or an ADR.


## Living-document ownership

| **Artifact**           | **Source of truth**                  | **Update trigger**                                                   |
|------------------------|--------------------------------------|----------------------------------------------------------------------|
| **Master brief / PRD** | docs/product/                        | Major product decision or change in target customer/outcome.         |
| **Architecture**       | docs/architecture/ + ADRs            | New service, integration, data boundary, or material tradeoff.       |
| **Execution backlog**  | `docs/planning/BACKLOG.md`            | Approved roadmap, decision, scope, or evidence change; GitHub issues may mirror approved work but do not replace it. |
| **Agent instructions** | AGENTS.md, .cursor/rules, .hermes.md | New development convention, tool boundary, or recurring failure.     |
| **Runbooks**           | docs/runbooks/                       | New operational workflow, incident, integration, or release process. |
| **Research**           | docs/research/                       | Competitor/API/model validation or market interview.                 |

**THE PRODUCT PROMISE**

**We do not help businesses post more content.**

**We help them turn campaigns into qualified customers.**
