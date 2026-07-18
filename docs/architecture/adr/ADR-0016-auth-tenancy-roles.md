# ADR-0016: Supabase Auth with application-owned tenancy and authorization

## Status

Accepted under founder-delegated technical direction — 14 July 2026

## Context

The product is a multi-tenant managed SaaS pilot with business owners, optional customer staff, two internal operators, and founder escalation. External publishing, messaging, booking, approvals, support access, and customer data make authentication and tenant isolation safety boundaries rather than UI conveniences.

The pilot starts with 10 live Workspaces and may grow toward 50. It is Bengaluru/India-first, while final privacy/residency terms remain OD-027. The team should not build or store passwords. Provider-native organizations are useful but cannot replace application authorization, because internal operator grants, customer approval authority, and audited temporary support access are product-domain rules.

Official documentation reviewed on 14 July 2026:

- [Supabase Auth overview](https://supabase.com/docs/guides/auth)
- [Supabase project regions](https://supabase.com/docs/guides/platform/regions)
- [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa)
- [Supabase passwordless email](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Supabase production SMTP requirements](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase pricing](https://supabase.com/pricing)
- [Clerk Organizations](https://clerk.com/docs/guides/organizations/overview) and [pricing](https://clerk.com/pricing)
- [WorkOS AuthKit users and organizations](https://workos.com/docs/authkit/users-organizations) and [pricing](https://workos.com/pricing)

## Options considered

| Option | Advantages | Costs and risks | Decision |
|---|---|---|---|
| Clerk Organizations | Fast B2B UI, invitations, active-organization context, basic roles, pilot-scale free allowance | Separate US-hosted identity processor with no region selection; provider roles still cannot express our support-access rules | Not selected for MVP |
| WorkOS AuthKit | First-class organizations/RBAC and strong enterprise path; generous user allowance | Enterprise-oriented surface exceeds MVP needs; separate identity processor and regional posture needs additional diligence | Defer as future enterprise option |
| Supabase Auth plus application-owned memberships | Managed sessions/passwordless/MFA; can colocate identity with Mumbai Postgres; simple pilot economics; authorization stays in our domain | We must build/test invitations, memberships, roles, and tenant guards; auth is coupled to a Supabase project | Selected |
| Auth.js/custom credential stack | Maximum control and provider portability | More session, email, account-linking, recovery, security, and operational ownership | Rejected for MVP |
| Single-tenant pilot | Minimal tenant model | Unsafe support access and expensive migration; does not test the product being sold | Rejected |

## Decision

Use Supabase Auth as the managed identity/session provider. Use invitation-only passwordless email (OTP or magic link) as the required pilot method, with verified Google OAuth optionally enabled after callback/identity-linking tests. Disable public self-sign-up. Configure a production SMTP provider before any real invitation; Supabase's default email service is development-only.

The application relational database owns:

- `UserIdentity` mapping from immutable Supabase user ID to local actor;
- `Organization`, `Workspace`, and `Membership`;
- the fixed MVP customer roles `owner` and `staff`;
- the internal system role `internal_operator`;
- time-bounded, reasoned `SupportAccessGrant` records assigning an operator to one or more Workspaces;
- actor-attributed grant/revoke, invitation, membership, role, and sensitive-action audit events.

Provider identity proves who the person is; it never independently proves what customer data or action they may access.

Authorization invariants:

1. Every authenticated command derives the provider subject from a server-verified session and resolves a local actor.
2. Every customer-owned record has a non-null Workspace tenant key; Organization alone is not sufficient context for a data command.
3. Every command/query validates current Workspace membership or active support grant server-side. A client-supplied Workspace ID is only a selector, never authority.
4. Internal operators do not impersonate customers and cannot approve customer materials. Their individual identity remains visible in audit.
5. Cross-tenant and expired/revoked-grant access fails closed at application and data-access layers, with Postgres RLS on exposed schemas as defense in depth.
6. Business data is accessed through the server application; no broad browser-to-database CRUD API or Supabase service-role key is exposed.
7. Internal operators must use MFA (`aal2`). Sensitive owner actions—membership/role changes, integration connect/reconnect, support-grant approval where applicable, data export/deletion, and emergency resume—require recent authentication and step-up MFA once that flow is enabled. General pilot use remains possible at `aal1` until the owner enrolls.
8. Preview/test use isolated Supabase projects or local Auth with synthetic identities. Production identities, keys, and callbacks never enter preview.

Use a Mumbai (`ap-south-1`) Supabase project if OD-017/OD-025/OD-027 accept the combined regional data stack. If those decisions select an incompatible database or residency posture, reopen only the provider portion of this ADR; retain the application-owned identity/tenancy contract.

## Rationale

1. Managed passwordless sessions avoid building a credential system.
2. Mumbai availability is a better starting posture for the India-first pilot than a provider with no region selection.
3. Application-owned authorization is required for exact approval authority, operator assignment, revocation, and tenant-safe audit regardless of identity vendor.
4. The pilot's small user count does not justify enterprise SSO/SCIM or a separate fine-grained authorization service.
5. The local identity mapping and provider-neutral session principal limit the domain's dependency on Supabase-specific objects.

## Trade-offs and consequences

- Invitations, membership UI, support grants, and authorization tests are product work rather than prebuilt provider features.
- Production email authentication adds a separate SMTP provider and deliverability responsibility.
- Supabase Auth data resides in its project Postgres, so choosing a different operational database later would create a two-store identity relationship or require an auth migration.
- MFA enrollment and step-up create user friction; the MVP applies mandatory MFA first to the higher-risk operator role.
- Provider outages block new sign-ins/session refresh but must not relax existing authorization or allow unauthenticated actions.

## Revisit triggers

- OD-027 requires a residency or subprocessor posture Supabase cannot meet.
- Enterprise customers require SAML/SCIM, domain discovery, or customer-managed identity administration at meaningful volume.
- Authentication incidents, deliverability, support burden, or availability fail the pilot targets.
- The primary data platform moves away from Supabase and operating a separate auth project creates unjustified cost/complexity.
- A provider migration is proposed; it must preserve immutable local actors, Workspace memberships, grants, and audit history.
