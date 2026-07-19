# BRN-004C Authenticated Context Retrieval

## Delivered boundary

- The protected Approved Context page supports a real invite-only server path.
- Requested organization, workspace, and profile UUIDs are treated only as scope requests.
- Supabase verifies the current session before PostgreSQL workspace membership is resolved.
- Tenant RLS and the Approved Context repository execute before any UI-safe snapshot is returned.
- Blocked values are removed before server data crosses into client props.
- Use-case changes rebuild a content-addressed immutable snapshot.
- Authentication-disabled environments retain minimized synthetic fixtures for Preview acceptance.

## Safety behavior

- Missing or malformed scope fails before database access.
- Authentication, membership, persistence, or projection failures return no factual fallback.
- The page is dynamic and non-cacheable to prevent cross-tenant response reuse.
- The feature does not publish, message, spend, book, charge, or invoke production AI.

## Remaining dependency

An authenticated workspace selector must create the scoped route for real pilot operators. Production
activation remains blocked by `docs/readiness/OD-033_LIVE_READINESS.md`.
