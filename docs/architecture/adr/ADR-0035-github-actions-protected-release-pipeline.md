# ADR-0035: GitHub Actions and protected staged releases

- **Status:** Accepted under founder-delegated technical direction
- **Date:** 14 July 2026
- **Decision:** OD-035

## Context

Tenant isolation, credentials, exact approvals, durable work, and migrations make direct local-to-production deployment unsafe. Previews must never reach real leads/providers, migrations need rehearsal, and production promotion must be deliberate and attributable. GitHub and Vercel are already selected and supply the necessary CI, rules, environments, previews, and rollback controls.

## Decision

### Source and review

- Protect an always-releasable `main`; use short PR branches and squash merges. Prohibit direct/force pushes, deletion, and unrecorded admin bypass.
- Every PR includes risk, migration, test, and rollback/forward-fix notes; resolves review conversations; is current with `main`; and passes all required checks.
- When a second qualified reviewer exists, require one non-last-pusher approval and dismiss it on changes. While the founder is sole reviewer, green checks plus a recorded self-review may merge ordinary work. Before paid production, auth/tenancy, privacy/deletion, KMS/IAM/credentials, billing, destructive migration, and external-effect-policy changes require a second qualified technical/security review.
- Apply rules to administrators where the GitHub plan supports it. Emergency bypass creates an incident/change record and immediately reruns the complete gate.

### Workflow security

- Use GitHub-hosted ephemeral runners initially, read-only default permissions, narrow job grants, OIDC/short-lived cloud identity, and no avoidable long-lived deployment/AWS keys.
- Pin every third-party Action to a reviewed full commit SHA. Never interpolate untrusted PR/branch/issue/commit text into shell commands.
- Untrusted/fork PRs get no secrets and cannot run provider/deployment work. Fixtures/artifacts are synthetic, minimized, scanned, and governed by OD-027 retention.

### Required PR gate

One canonical `pnpm verify` contract, or an explicitly equivalent required job graph, covers:

1. frozen install, lockfile and package/script policy;
2. secret canaries and dependency/licence/security policy;
3. formatting, lint, types, import/module/vertical boundaries;
4. unit, component, policy, offline-AI and adapter-contract tests;
5. real isolated PostgreSQL migration-from-empty/current, transaction/outbox/inbox/idempotency/concurrency, RLS/role and two-tenant tests;
6. Next and Workflow builds plus typed configuration;
7. Chromium critical smoke and axe checks against an isolated preview; and
8. proof that no required stage is omitted and no real channel/payment/provider action occurs.

Flakes fail closed. A non-critical flaky test may only be quarantined outside the gate with owner/expiry; critical tests cannot.

### Environments and release

- **Preview:** per PR, isolated data, fake adapters, synthetic fixtures, no production secrets or external effects.
- **Staging:** persistent Vercel custom environment, separate Supabase/provider sandboxes; rehearse migrations, all-browser critical E2E, contracts/evals, applicable restore smoke, and one synthetic campaign-to-outcome loop.
- **Production:** deploy only an exact staged commit/release manifest after manual founder go/no-go and all current launch gates. Use a protected GitHub environment where available; otherwise use restricted Vercel promotion plus stored named approval. Serialize production and never auto-promote merely because `main` changed.

The manifest records commit/lockfile/runtime, app/workflow/schema/template/prompt/policy/eval versions, migrations, deployment IDs, checks, approval, risks, and rollback/forward-fix.

Use expand/migrate/contract database changes. Roll back the app by promoting the last schema-compatible Vercel deployment and pausing affected workflows/effects; fix database schema forward unless a tested reverse is demonstrably safe. Run post-deploy synthetic/read-only checks and stop/pause on critical failure. Active-active/canary infrastructure is unnecessary for the managed pilot.

## Consequences

- Releases take longer but become reproducible and attributable.
- Solo development cannot independently review every PR, so high-risk paid-production changes require external/second review.
- Full database/browser/eval checks cost CI time; caching/parallelism may optimize without weakening the contract.
- Preview/staging services cost more but prevent customer/provider contamination.

## Rejected alternatives

- Direct push/deploy or local-plus-production only.
- Auto-production on merge.
- Self-hosted runners initially.
- Floating Action tags.
- Destructive schema rollback as the default.

## Verification

- Version ruleset configuration/required-check names in operations docs.
- A synthetic malicious PR proves no secret/provider/deploy path.
- Failed migration/check cannot merge or promote.
- Rehearse staging-to-production and application rollback/DB forward-fix before first paid activation.
- Every production deployment maps to one manifest and named approval.

## Official references checked

- [GitHub ruleset rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [GitHub deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/reference/security/oidc)

