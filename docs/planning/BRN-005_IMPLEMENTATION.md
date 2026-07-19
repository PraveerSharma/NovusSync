# BRN-005 fact freshness and owner reverification

## Status

Implemented on the BRN-005 feature branch. Release evidence is recorded by the pull request and CI run before merge.

## Product behavior

- Price, offer, descriptive booking-route, policy, and claim facts use the versioned fact-freshness@1 policy.
- The initial conservative freshness window is 30 days, with an owner warning during the final 7 days.
- Expired facts remain in immutable history but approved-context retrieval cannot use them externally.
- A directly authorized owner can reverify an expired or due-soon fact without changing its approved value.
- Reverification creates a new immutable approved-fact version, refreshes expiry, preserves provenance and governance, and writes minimized audit evidence.
- Stable facts are not given an arbitrary expiry.
- Provider-owned live availability remains outside Business Brain truth.

## Security and failure boundaries

- Owner role, direct membership, active session, tenant scope, current fact identity, and expected version are checked before the write.
- Tenant RLS remains active for reads and writes.
- Idempotency prevents duplicate immutable versions during retries.
- Audit metadata excludes the approved fact value and customer data.
- The workflow creates no campaign, message, booking, payment, or provider effect.
- Synthetic Preview mode demonstrates the queue but disables the owner write action.

## Verification contract

- Domain tests cover rule matching, stable fields, exact expiry, warning windows, and malformed input.
- Application tests cover owner authorization, session/version gates, legacy expiry, due-state enforcement, immutable version creation, and replay.
- PostgreSQL integration covers persisted expiry, RLS-scoped reads, atomic version creation, idempotency, provenance-preserving values, and audit evidence.
- Web and Playwright tests cover scoped routing, synthetic write denial, responsive containment, runtime errors, and WCAG 2.2 AA automation.

This implementation does not change Gate G0 or OD-033. It is local/synthetic foundation functionality until live-readiness evidence is accepted.
