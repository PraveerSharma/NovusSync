# ADR-0019: Defer Meta API integrations and run an evidence-backed manual channel workflow

## Status

Accepted by founder — 14 July 2026

Supersedes [ADR-0018](ADR-0018-direct-meta-publishing.md).

## Context

The yoga trial needs a concrete campaign-to-attendance loop, but it does not yet need API ownership of every channel. Meta integration would introduce business/app verification, permission review, account eligibility, token lifecycle, platform policy, webhooks, provider cost, and another production readiness path before customer value is proven.

The founder chose to continue using Instagram and WhatsApp operationally while deferring every Meta API integration. Facebook is not part of the trial. The product therefore must not imply that it automatically publishes, receives WhatsApp messages, sends messages, detects opt-outs, or reconciles channel state.

The managed operating model already provides two named operators, founder escalation, individual audited access, and measured manual work. The hosted campaign form can retain reliable consent/source capture while manual channel work tests whether campaign assistance and lead operations create attended trials.

## Options considered

| Option | Advantages | Costs and risks | Decision |
|---|---|---|---|
| Direct Meta publishing + WhatsApp Cloud API now | Maximum product automation and telemetry | App Review/verification, token/policy work, platform dependency, and longer path to value | Deferred |
| Unified/BSP APIs now | Faster integration and some review assistance | Monthly cost, extra processor, normalized/hidden failure detail, still subject to Meta policy | Deferred |
| Keep Instagram/WhatsApp, run manual audited operations | Fastest validation; no Meta API/app-review blocker; exposes real service labor | Manual copying/evidence, slower response, incomplete telemetry, not self-serve | Selected |
| Remove all Meta products | Avoids Meta platform concentration | Loses the strongest current discovery/conversation fit and requires a new channel strategy | Rejected |

## Decision

For the initial MVP trial:

- Instagram is the only social discovery channel. Facebook is excluded.
- A customer or explicitly authorized named operator manually publishes an exact approved Instagram asset using the customer's own official account/delegated business access. Password sharing is prohibited.
- The product stores the intended occurrence and later records actual account, actor, content-version/hash, scheduled/actual time, public URL or platform reference, screenshot/receipt evidence, and verification status. Missing or conflicting evidence remains `unverified`; the product cannot report API-confirmed publication.
- The campaign hosted landing/form is the primary lead route and authoritative product-side capture/consent source.
- A tracked click-to-WhatsApp link is secondary. It may include campaign/source context in the URL or prefilled text, but a click is not a Lead, message, consent, or response.
- Owners/operators read and send every WhatsApp message manually through the official WhatsApp Business application. The product has no WhatsApp token, webhook, template, send, status, inbox, or automation capability.
- The product may generate a private, grounded suggested reply or next-step checklist from facts an authorized user manually enters. A human must review/edit, send outside the product, and record the actual action/evidence. A draft is never represented as sent.
- Operators manually create/reconcile WhatsApp-origin Leads, consent/opt-out, qualification answers, booking changes, and conversation outcomes. Unknown/unverified remains explicit.
- Outside the 10:00–20:00 IST service window, the product sends no WhatsApp acknowledgment. Hosted-form submissions are recorded and queued for operator handling; WhatsApp messages remain in the customer's official app until a human sees them. Any native WhatsApp Business greeting/away feature is customer-controlled and outside the product promise/evidence.
- The manual conversation playbook retains the approved consent, qualification, frequency, sensitivity, opt-out, takeover, and bounded-tail rules as operator policy. Software can block new drafts after a recorded opt-out/pause/tail, but cannot guarantee that a human did not act outside the product.

No Meta SDK, app ID/secret, OAuth flow, API permission, webhook, provider/BSP dependency, access token, or automated Meta action is included in the initial MVP repository or production environment.

## Manual channel controls

1. Exact customer approval and occurrence authorization remain required before manual publication.
2. The operator uses delegated business access, never a shared password or customer impersonation.
3. Every material manual action records Workspace, campaign/Lead, individual actor, reason, actual time, duration, exact artifact/draft, external evidence, and product-gap category.
4. The dashboard distinguishes `planned`, `manual_action_due`, `operator_reported`, `evidence_verified`, `unverified`, `failed`, and `cancelled`; it never labels manual evidence as provider-confirmed.
5. Manual publication and WhatsApp handling count in owner/operator workload and unit economics.
6. Response metrics use evidenced human timestamps. During the service window, target a median first substantive response at most 15 minutes and p95 at most 30 minutes; outside-hours work begins at the next service window.
7. Customer/operator pause, opt-out, and takeover state suppress product drafts and due-work reminders immediately after being recorded. Training/runbooks govern off-platform behavior; any later contradictory manual action is a trust incident.
8. The initial admission cap remains 10 live Workspaces. Expansion gates use measured manual channel workload and cannot assume future automation savings.

## Deferred API re-entry gate

Meta publishing and/or WhatsApp automation may be reconsidered independently only after:

- at least two complete manual `CU-01` cycles expose stable inputs, outputs, exception categories, labor, and value;
- at least three design partners demonstrate that the same automation is needed;
- founder-approved cost/benefit shows meaningful response, reliability, workload, or margin improvement;
- dated OD-027/OD-033 evidence passes for the proposed data flow, consent, retention, platform terms, DPA/subprocessors, verification, and incident ownership;
- a current official capability/app-review spike proves exact required permissions, eligible accounts, token/revocation behavior, status/reconciliation, sandbox/test path, and rate/cost limits;
- the product has deterministic approval, policy, idempotency, audit, pause, opt-out, and safe-failure controls for the proposed action.

Re-entry requires a new accepted ADR. Publishing and WhatsApp decisions may return separately; accepting one does not authorize the other or Facebook.

## Rationale

1. The product can validate campaign quality, tracked lead capture, qualification operations, booking, attendance, and learning without waiting for Meta review.
2. The managed pilot already expects visible, measured human work; this is the right stage to discover what deserves automation.
3. Hosted-form-first capture preserves stronger source and consent evidence.
4. Removing Facebook and all Meta API code reduces build, security, privacy, and operational scope.
5. Explicit manual states prevent service work from being misrepresented as product automation.

## Trade-offs and consequences

- The initial MVP is product-assisted managed operations, not automated social publishing or an automated WhatsApp concierge.
- Manual work can be slower, inconsistent, and difficult to verify; operator training, evidence, sampling, and workload gates mitigate but do not eliminate that risk.
- WhatsApp-only inbound cannot be observed automatically, so source/response/outcome completeness depends on operator reconciliation.
- Automated publish reliability, delivery receipts, message quotas, and provider token-health metrics are removed from the MVP success claims.
- The two operators may become the scaling bottleneck; admission must follow OD-014 evidence rather than the intended 50-business ceiling.
- Provider-neutral ports may be specified as future seams, but no speculative Meta adapter implementation or credentials are allowed.

## Revisit triggers

- Manual publication or messaging consumes more labor than the accepted capacity/economics allow.
- Response-time or reconciliation quality fails the pilot gate.
- Three or more design partners require the same automation and the re-entry evidence passes.
- Platform-native restrictions make manual delegated access unsafe or unworkable.
- The founder changes the initial channel strategy.
