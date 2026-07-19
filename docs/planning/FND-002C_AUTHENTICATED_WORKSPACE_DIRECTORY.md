# FND-002C: Authenticated workspace directory

## Outcome

A signed-in customer can see only the active organizations, workspaces, and business profiles
granted through their direct owner or staff memberships, then open the selected profile's governed
campaign context.

## Security boundary

- Supabase verifies the cookie-backed access token before any directory query.
- The provider subject is derived server-side and is never accepted from browser parameters.
- PostgreSQL exposes the directory through a constrained, least-privilege security-definer function.
- Revoked memberships, disabled actors, internal operators, inactive workspaces, and other tenants
  are excluded.
- Database rows are validated again at the application boundary before they reach page data.
- Retrieval failures return a safe unavailable state and never fall back to guessed live data.
- The synthetic directory exists only when authentication is explicitly disabled for Preview tests.

## User flow

1. Open the protected workspace directory.
2. Choose an active workspace and business profile.
3. Open the profile's campaign-planning Approved Context packet.
4. Continue to proposal and approval work without re-entering tenant identifiers.

## Verification contract

- Application tests cover session-first ordering, expiry, safe errors, and malformed responses.
- PostgreSQL integration tests cover owner access, cross-tenant isolation, revoked access,
  operator exclusion, profile projection, and application-role execution.
- Browser tests cover desktop and mobile selection, scoped navigation, and horizontal overflow.
- The existing authenticated browser suite verifies anonymous users are redirected to sign-in.

## Readiness boundary

This feature is permitted in synthetic/local and protected Preview environments. It does not
activate production providers, automated publishing, messaging, ad spend, or real Lead data.
Production remains blocked until OD-033 is passed and the founder records the live-readiness GO.
