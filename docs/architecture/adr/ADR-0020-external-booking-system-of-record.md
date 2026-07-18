# ADR-0020: Keep external booking services authoritative and support tiered integration

## Status

Accepted by founder — 14 July 2026

## Context

The initial booking recommendation limited each pilot Workspace to one location, instructor-independent pool, and introductory appointment type. The founder rejected that eligibility restriction: studios with multiple locations, instructors, calendars, classes, resources, and capacity pools must qualify for the first pilot.

Those studios already use booking systems to manage availability, routing, class capacity, instructor conflicts/substitutions, rescheduling, cancellations, waitlists, memberships, and sometimes payments. Rebuilding those rules would add a calendar/operations product outside the campaign-to-attended-outcome wedge. Forcing all partners to migrate to one new provider would also create adoption risk before the product has proven value.

Current official provider documentation demonstrates several viable integration shapes rather than one universal contract:

- Cal.com exposes team/routing-aware booking creation and booking webhooks, including team and seated-event information.
- Calendly exposes team scheduling links and identifies collective/round-robin pooling, with webhook notifications for scheduled/cancelled activity.
- Acuity exposes hosted embeds/dynamic links, availability/appointment APIs, calendar/appointment-type identifiers, and appointment webhooks.
- SimplyBook.me exposes locations, service providers, classes, and booking APIs.
- Google Calendar exposes multi-calendar free/busy and event primitives but is not itself a complete class-capacity/routing system.

The five-partner inventory is not yet complete, so selecting a named deep provider now would be speculation.

## Options considered

| Option | Advantages | Costs and risks | Decision |
|---|---|---|---|
| Build a native calendar/routing engine | Full control and uniform telemetry | Large scope; conflict, capacity, waitlist, resource, payment, and timezone risk | Rejected |
| Force every pilot onto one provider | One integration and uniform experience | Migration burden; excludes otherwise eligible studios; vendor lock-in | Rejected |
| Build deep adapters for every partner provider | Best native experience for all | Integration/support matrix grows before provider demand is known | Rejected |
| One evidence-selected deep adapter plus generic hosted/manual tiers | Broad eligibility; bounded engineering; existing providers retain complexity | Uneven telemetry and more reconciliation | Selected |

## Decision

### Eligibility and campaign boundary

- A pilot Workspace may represent one independent studio business with one or multiple locations, instructors, provider calendars, class schedules, resources, and capacity pools.
- Each `CU-01` still promotes one introductory offer and one attended outcome for comparability.
- The campaign selects one approved `BookingRoute`. That route may expose multiple provider-managed locations, instructors, class times, resources, or pools for the same offer.
- Product code must not assume that one Workspace equals one physical location, one instructor, or one capacity pool.

### System-of-record boundary

The connected/existing booking provider owns:

- operational availability and class capacity;
- location, instructor, room/resource, and pool schedules;
- routing/assignment, substitutions, and conflict rules;
- rescheduling/cancellation and waitlists;
- memberships, packages, and payments where applicable;
- its own customer notifications.

The product owns:

- campaign, creative, Lead, source, consent, offer, and attribution context;
- the approved booking route and mapped provider identifiers;
- normalized booking intent/reference/status/evidence events;
- enforcement that product-offered or product-created slots fall inside the campaign/tail boundary;
- attendance/no-show/cancelled and later won/lost linkage;
- integration tier, evidence confidence, discrepancies, corrections, and manual workload.

### Integration tiers

1. **Deep adapter:** read normalized availability, create/reschedule/cancel where supported, receive verified webhooks, reconcile provider state, and store the provider reference.
2. **Tracked hosted route:** open or embed the provider's hosted booking page with campaign/Lead/source metadata where supported; ingest webhook/export evidence if available and reconcile gaps.
3. **Operator-assisted route:** a named owner/operator uses the provider's official interface and records the booking reference, selected route/resource, actual time, actor, evidence, and verification status.

All three tiers are valid pilot paths. The UI, scorecard, and audit trail must identify the tier and must not report a hosted/manual booking as API-confirmed.

### Provider selection

- Inventory all five design partners before selecting a named deep adapter.
- Build at most one deep booking adapter for the initial pilot.
- Prefer the provider used by at least three partners or covering most expected booking volume, provided its current official API, webhook, access, privacy, plan, sandbox, and India-operability evidence passes.
- If no provider reaches that threshold, do not build several adapters. Use tracked hosted and operator-assisted routes until repetition justifies a deep integration.
- Do not merge availability from multiple providers into one scheduling engine in the MVP.

### Notifications

Provider-native booking notifications may continue as provider behavior and must be disclosed in the route inventory. The product sends no WhatsApp notification under ADR-0019. It may create private notification due work; a named human sends through the official WhatsApp Business app and records evidence.

## Core contract

The provider-neutral booking boundary uses these concepts without reproducing provider rules:

- `BookingConnection`: tenant/provider/account, capabilities, health, credentials reference, and integration tier.
- `BookingRoute`: campaign-approved offer/outcome route plus provider-hosted URL/embed or adapter reference and allowed provider resource identifiers.
- `BookableOption`: provider-supplied time, timezone, location/resource labels, capacity/availability state, freshness, and opaque provider metadata.
- `BookingIntent`: Lead, route, selected option, campaign/tail eligibility, idempotency key where product-controlled, and status.
- `BookingRecord`: provider reference or manual evidence, selected provider resources, occurred/recorded times, status, actor/source, and verification confidence.
- `BookingEvent`: created/rescheduled/cancelled/no-show/attended plus evidence, correction, and discrepancy history.

Provider-specific identifiers and capability metadata remain adapter/integration records. Core domain rules never calculate instructor routing or capacity from them.

## Invariants

1. No slot is represented as available unless it came from a current provider response/hosted route or explicit authorized human observation.
2. Product-controlled booking creation rechecks route, provider health, freshness, campaign/tail eligibility, tenant, and idempotency immediately before dispatch.
3. Hosted/manual tiers never receive fabricated provider-confirmed state.
4. Booking, attendance, and outcome remain distinct events; booking never implies attendance.
5. Corrections append evidence and do not overwrite original source/status invisibly.
6. A provider may route among multiple locations/instructors/resources without the product reproducing that decision.
7. Provider behavior outside product control—including its notifications, payments, waitlists, or policy—must not be described as a product capability.

## Trade-offs and consequences

- Multi-location and multi-instructor studios remain eligible without expanding into calendar software.
- The pilot can use the systems customers already operate, reducing migration friction.
- Booking telemetry, automation depth, and operator labor will vary by tier, so reliability/workload metrics must be segmented and cannot be compared as if evidence quality were uniform.
- One deep-adapter ceiling bounds engineering/support work but may leave some partners on a less integrated flow.
- Hosted-link handoff can weaken conversion continuity and attribution; signed/tracked parameters, webhook/export ingestion, and manual reconciliation mitigate but do not eliminate that loss.
- Manual reconciliation increases labor and error risk; actor-attributed evidence, discrepancy queues, sampling, and OD-014 admission gates apply.

## Revisit triggers

- Three or more active partners require a second common provider and hosted/manual operation materially harms conversion, evidence, or workload.
- A selected provider cannot support required multi-location/class/resource behavior or loses viable API/webhook access.
- Booking-link attribution or attendance evidence repeatedly fails the accepted metric gate.
- Customers require product-owned waitlists, payments, memberships, or scheduling rules, which would require a new product-scope and architecture decision.
- Multi-provider availability aggregation becomes a repeated paid requirement with evidence that provider-hosted routing cannot satisfy it.

## Official capability sources reviewed

- [Cal.com create booking](https://cal.com/docs/api-reference/v2/bookings/create-a-booking)
- [Cal.com webhooks](https://cal.com/docs/developing/guides/automation/webhooks)
- [Calendly team scheduling links](https://developer.calendly.com/how-to-get-scheduling-page-links-for-team-members-across-the-organization)
- [Calendly webhooks](https://calendly.com/help/webhooks-overview)
- [Acuity developer platform](https://developers.acuityscheduling.com/)
- [Acuity webhooks](https://developers.acuityscheduling.com/docs/webhooks)
- [SimplyBook.me API reference](https://simplybook.me/en/api/developer-api/ref)
- [Google Calendar free/busy API](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query)
