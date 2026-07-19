# BRN-004A: Approved Context Projection

**Status:** Implementation candidate  
**Parent story:** BRN-004  
**Boundary:** Synthetic/test data and protected Preview only

## User outcome

Campaign and concierge workflows receive either a current, cited, owner-approved fact or an
explicit machine-readable reason that no assertion is permitted. The application never fills a
missing, expired, restricted, disputed, cross-scope, or inconsistent fact with generated text.

## Delivered in this slice

- Deterministic domain projection for campaign-planning and concierge-response use cases.
- Tenant/profile scope defense and explicit unavailable reason codes.
- Source version, verification, and freshness citations for every usable fact.
- Authorization-before-read application contract.
- Content-addressed immutable verified-context snapshots.
- Responsive, accessible Approved Context workspace at `/business-profile/context`.
- Unit and Playwright acceptance coverage.

## Safety boundary

- This slice does not publish content, send messages, launch ads, or alter bookings.
- This slice does not use Meta, WhatsApp, email, booking, AI, or telemetry production providers.
- The protected Preview uses minimized synthetic facts only.
- AI may consume a verified-context snapshot in a later story, but it cannot approve facts or
  override an unavailable result.

## BRN-004B handoff

Replace the UI fixture repository with tenant-scoped PostgreSQL retrieval of current approved fact
versions and persist immutable snapshot metadata. PostgreSQL integration must prove RLS isolation,
current-version uniqueness, expiry/restriction/dispute behavior, and no raw source prompt stuffing.
