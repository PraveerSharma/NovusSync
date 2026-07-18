# ADR-0028: Product-owned metrics with privacy-filtered PostHog, Sentry, and OpenTelemetry

- **Status:** Accepted under founder-delegated technical direction
- **Date:** 14 July 2026
- **Decision:** OD-028

## Context

Campaign, lead, booking, attendance, approval, manual-work, and operator-effort metrics affect customer trust and pilot go/no-go decisions. A third-party analytics event can be delayed, duplicated, sampled, dropped, or reprocessed, so it cannot be the system of record. The team nevertheless needs fast product-behavior analysis, error diagnosis, traces, and alerts without putting lead messages, prompts, secrets, or direct identifiers into additional vendor stores.

## Decision

### Canonical truth

Keep immutable domain events, audit events, effect/provider receipts, usage records, and metric definitions in Supabase PostgreSQL. Version every funnel formula and denominator. Customer reports and commercial/pilot gates query product-owned normalized records; corrections append superseding evidence.

Define one typed internal telemetry envelope with `event_id`, schema version, occurred/recorded time, environment, release, opaque Organization/Workspace/actor/entity identifiers where needed, correlation/causation IDs, event name, verification/confidence state, and allow-listed scalar properties. A transactional outbox exports only approved projections. Analytics delivery is at-least-once and deduplicated by `event_id` where the sink supports it.

### Product analytics

Use **PostHog Cloud EU** initially, behind a product-owned `ProductAnalyticsPort`, for pseudonymous behavior and funnel exploration only. Capture explicit allow-listed server/client events; disable broad autocapture, session replay, surveys, user feedback, and LLM/prompt capture initially. Do not send names, email addresses, phone numbers, message/body text, form answers, URLs containing query values, Business Brain facts, booking notes, raw provider IDs, or secrets. Use opaque product IDs and suppress IP collection where supported.

PostHog never defines attendance, revenue, attribution, billing, consent, approval, audit, or SLA truth. Its EU cloud is still cross-border processing from India. The OD-027/OD-033 policy is accepted, but production enablement remains blocked until dated evidence validates the purpose, DPA, subprocessors, region, retention, deletion, and configured payload allow-list.

### Errors, logs, traces, and alerts

Use **Sentry's EU/DE data region** for application exceptions and sampled performance traces, behind a `TelemetryPort`. Configure `sendDefaultPii: false`, IP scrubbing, SDK `beforeSend`/`beforeSendTransaction` filtering, server-side scrubbing, and explicit deny-lists for authorization/cookie headers, request/response bodies, query strings, form data, lead/contact fields, prompts/model output, provider payloads, and secrets. Disable session replay and user-feedback attachments initially.

Emit structured JSON logs to Vercel runtime logs with stable event/error codes, severity, release/environment, correlation IDs, duration/count, opaque scoped identifiers, and safe reason codes. Never log raw bodies or credentials. Use OpenTelemetry conventions inside the application so traces can later move to a different sink. Sentry receives scrubbed exceptions/traces; Vercel supplies short-lived infrastructure/runtime visibility. Do not add a warehouse or a separate log vendor in the MVP.

Alert on the accepted critical classes: suspected privacy/security exposure, unauthorized or wrong-version action, opt-out/takeover/pause contradiction, duplicate external effect, tenant-isolation denial anomaly, sustained error/latency failure, workflow/outbox backlog, provider outage/credential failure, and cost/quota breach. Alerts carry safe IDs and link authorized operators back to the product record; they do not embed sensitive content.

## Metric contract

The repository owns a metric catalogue containing name, purpose, source event/version, eligibility filters, numerator, denominator, time window/timezone, late/correction behavior, verification requirements, uncertainty treatment, owner, and tests. In particular:

- a click/draft is not a Lead, consent, or sent message;
- a booking is not attendance;
- `unknown` and `uncertain` remain visible rather than being assigned;
- operator/manual effort includes off-platform work and is not hidden as product automation; and
- correlation is not labelled causation.

## Consequences

- Product reports remain reproducible if PostHog or Sentry is unavailable or replaced.
- Two managed telemetry processors improve speed of learning and diagnosis but add cross-border, DPA, retention, deletion, and cost work.
- Privacy-safe allow-lists reduce debugging detail; authorized product records, not telemetry payloads, supply sensitive context.
- Vendor sinks can be disabled without breaking core application transitions.

## Rejected alternatives

- **PostHog as event truth:** delivery semantics and mutable analytics definitions are unsuitable for audit or customer outcomes.
- **Database reports only:** insufficient product-behavior exploration and production error diagnosis.
- **Warehouse from day one:** unjustified at 10–50 Workspaces.
- **Full capture/session replay:** unnecessary privacy and credential-exposure risk for the pilot.
- **One vendor for every signal:** convenient but increases lock-in and may encourage mixing product truth with sampled telemetry.

## Verification

- Contract tests reject unknown telemetry properties and seeded PII/secret canaries.
- Two-tenant tests prove no payload carries another Workspace's identifier or data.
- Duplicate/out-of-order analytics delivery does not alter product reports.
- Synthetic exceptions and traces arrive with correlation/release data and without bodies, tokens, direct identifiers, prompts, or messages.
- Dashboard formulas are reconciled against database fixtures for every accepted MVP metric.

## Official references checked

- [PostHog privacy controls and EU Cloud](https://posthog.com/docs/privacy)
- [Sentry organization data-scrubbing controls](https://docs.sentry.io/api/organizations/update-an-organization/)
- [Sentry region-aware API domains](https://docs.sentry.io/api/)
- [Vercel Observability and OpenTelemetry](https://vercel.com/products/observability)
- [Vercel runtime logs and Log Drains](https://examples.vercel.com/docs/logs)
