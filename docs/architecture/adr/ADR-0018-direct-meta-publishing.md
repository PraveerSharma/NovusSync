# ADR-0018: Direct Meta publishing behind a provider-neutral port

## Status

Superseded by [ADR-0019](ADR-0019-defer-meta-api-integrations.md) after founder review — 14 July 2026. No implementation was authorized or started.

## Context

The accepted MVP publishes only organic Instagram content and optional organic Facebook Page adaptations. `CU-01` requires four single-image posts and two carousels of no more than five slides, with no video, Stories, DMs, comments, social listening, or other networks. Each publication must reference exact customer-approved content and occurrence authorization, publish at most once, expose provider status, and be recoverable without guessing after an ambiguous response.

The product may later support other channels, so Meta-specific concepts must not leak into Campaign, Approval, or Workflow domain contracts. The first pilot starts with 10 Workspaces, making per-profile aggregator cost material.

Official/current sources reviewed on 14 July 2026:

- [Meta's official Instagram Postman collection: publish a container](https://www.postman.com/meta/instagram/request/23987686-299b176b-90aa-4d8a-b6cf-e6028fc69de5)
- [Meta's official Instagram Postman collection: container status](https://www.postman.com/meta/instagram/request/munmruq/get-ig-container-status)
- [Ayrshare post API](https://www.ayrshare.com/docs/apis/post/post)
- [Ayrshare webhook behavior](https://www.ayrshare.com/docs/apis/webhooks/overview)
- [Ayrshare pricing](https://www.ayrshare.com/pricing/)

Meta's developer documentation was not consistently fetchable during this review. Exact current Graph version, permissions, account prerequisites, limits, review requirements, and deprecation dates must therefore be captured from the Meta developer dashboard/documentation during the mandatory feasibility spike before implementation readiness is claimed.

## Options considered

| Option | Advantages | Costs and risks | Decision |
|---|---|---|---|
| Direct Meta Graph APIs | Exact payload/provider IDs and status; no per-profile aggregator margin; only builds the two accepted channels | Meta app/business verification, permission review, token lifecycle, API churn, and more engineering work | Selected |
| Unified provider (Ayrshare baseline) | Faster multi-network integration, hosted linking, webhooks, provider maintenance | $299/month for up to 10 profiles and $599/month for the next tier at review time; extra processor/failure layer; normalized APIs can hide platform detail | Rejected as default; contingency only |
| Manual operator publishing | No app review or API build | Cannot prove scheduled/idempotent product publishing; weak trace/status; ongoing labor | Emergency/temporary recovery only, not MVP completion |
| Provider-first with direct fallback | Faster start if provider passes | Pays aggregator cost and still preserves future direct-integration work | Not justified for two Meta channels |

## Decision

Build a provider-neutral `SocialPublisherPort` and a direct Meta adapter for:

- one connected Instagram Professional account per Workspace;
- one optional connected Facebook Page per Workspace;
- an approved single-image publication;
- an approved Instagram carousel of at most five image children and its optional Facebook Page adaptation;
- connection/account eligibility, token health, revocation, and reauthorization;
- provider IDs, payload fingerprints, status polling/reconciliation, and normalized receipts/errors.

Use the product's durable scheduler rather than a provider's opaque scheduling feature. At the authorized occurrence time, the worker rechecks campaign state, exact content approval, occurrence authorization, pause, connection health, media readiness, quota, and idempotency before making a provider call.

### Publication state and duplicate prevention

Each authorized occurrence has one immutable idempotency key and a state machine such as:

`authorized → due → dispatching → provider_processing → published | failed | ambiguous | cancelled`

Store every attempt, exact request fingerprint, Graph API version, connection/account ID, container/child/media/post IDs, timestamps, normalized error, raw encrypted/redacted receipt reference, and reconciliation result.

Do not assume Meta accepts an application idempotency key. Once an external container/post/media ID exists, retry by reconciling that object rather than recreating it. A timeout with no definitive receipt becomes `ambiguous`, blocks automatic replay, and alerts an operator. The operator may reconcile or explicitly authorize a new attempt after proving no publication exists.

Provider-accessible media URLs are short-lived, unguessable, content-addressed URLs with sufficient processing lifetime; they contain no lead/customer personal data. The published asset remains tied to its internal checksum and approved content version.

### Mandatory feasibility and app-review gate

Before G1 declares the real adapter ready—and before G4 production publication—the owner must record a current Meta capability matrix and prove in a non-customer test business/account:

1. business/app verification prerequisites and current least-privilege permissions;
2. connection of an eligible Instagram Professional account and optional Facebook Page;
3. one single-image Instagram publish;
4. one five-image carousel publish with child/container status reconciliation;
5. one Facebook Page image/adaptation publish;
6. token expiry/revocation and reauthorization behavior;
7. exact external IDs/status lookup after success, failure, timeout, and duplicate-retry simulation;
8. current rate/publishing limits and API-version/deprecation monitoring;
9. app-review submission evidence and approval for the production use case;
10. deletion/disconnect, data-use, privacy-policy, and provider-term obligations under OD-033.

Failure keeps G4 blocked. It does not silently switch to manual publishing or an aggregator. The founder then chooses whether to approve the current unified-provider cost/subprocessor, change the publishing promise, or extend the review timeline.

## Rationale

1. Instagram and Facebook are both Meta channels, so a multi-network abstraction provider contributes limited current scope value.
2. Direct provider IDs and container status better support the 0-duplicate and exact-audit requirements.
3. Avoiding a $299–$599 monthly minimum materially improves pilot unit economics.
4. The port preserves a later unified provider or additional channel without weakening the MVP's canonical contracts.
5. A mandatory real capability/review spike exposes the primary risk before the campaign module depends on an imagined API.

## Trade-offs and consequences

- Engineering owns Meta OAuth, token health, API version upgrades, error normalization, and app-review evidence.
- Meta review delay can block G4 even when product code is complete.
- Customers without eligible professional/Page accounts are not pilot-ready.
- Direct Meta is not a precedent to bypass adapters for other providers.
- Manual publishing can recover an individual incident only when separately authorized/audited; it cannot satisfy publishing acceptance or hide a failed integration.
- Aggregator contingency is a founder/commercial/privacy choice because it adds at least the then-current plan cost and a subprocessor.

## Revisit triggers

- The mandatory spike or App Review fails after the planned remediation window.
- Meta changes permissions/capabilities such that the accepted image/carousel/Page loop cannot run.
- The product accepts two or more non-Meta publishing networks, making unified-provider economics materially different.
- Direct adapter maintenance or incident load exceeds the accepted workload/budget.
- A unified provider demonstrates exact idempotency, receipts, account health, privacy fit, and a better total cost than direct maintenance.
