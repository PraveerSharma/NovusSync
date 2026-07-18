# Phase 1 Verified Business Brain - Execution Evidence

**Evidence date:** 19 July 2026  
**Current story:** `BRN-001` synthetic/test-boundary foundation  
**Next story:** `BRN-002` approved-source proposals  
**Phase status:** IN PROGRESS - NOT PASSED

## Implemented scope

`BRN-001A` defines the generic Business Profile contract, immutable draft revisions, validation and completion rules, an authorization-first application service, and the versioned independent-yoga-studio playbook. Core packages do not import the vertical pack.

`BRN-001B` adds tenant-scoped PostgreSQL persistence, optimistic revisions, idempotent command replay, append-only profile history, safe audit metadata, and a protected eight-section guided editor. The editor covers business, offer, audience, voice, FAQs, claims, restrictions, and booking facts without supplying business defaults.

## Safety boundary

- The web editor uses a synthetic workspace and browser session storage only.
- It cannot publish content, message customers, spend money, approve health claims, or change booking capacity, payments, or authoritative booking state.
- The server persistence contract is implemented and tested, but live customer writes and production activation remain unavailable until the applicable readiness evidence and founder go/no-go pass.
- The first vertical playbook is yoga-specific; the domain and application contracts remain vertical-neutral.

## Database evidence

Migration `phase1e_business_profile_drafts` was applied exactly once to the authorized NovusSync test Supabase project `yqfhhqzmzkafxtwfqeef` as version `20260718183415`.

Verified catalog properties:

- `business_profile_draft` and `business_profile_draft_version` exist.
- Row-level security is enabled and forced on both tables.
- Five tenant policies scope reads and writes by organization and workspace settings.
- `novussync_app` has only `SELECT`, `INSERT`, and `UPDATE` on current drafts.
- `novussync_app` has only `SELECT` and `INSERT` on version history.
- A `BEFORE UPDATE OR DELETE` trigger rejects version-history mutation.

A rollback-only synthetic smoke passed 13 assertions: allowed tenant-A operations, tenant-B invisibility and zero-row update behavior, immutable-history `55000` failures, unchanged history after rejected mutations, and zero residual fixture rows after rollback.

## Verification evidence

The release candidate passed:

- Repository formatting, lint, package-boundary, and TypeScript checks.
- 58 unit, provider-neutral contract, and offline AI-safety tests.
- Optimized Next.js production builds with `/business-profile` included.
- 28 Playwright tests across desktop, mobile, auth-disabled, and auth-enabled projects.
- Business Profile draft entry, validation, progress, section navigation, browser-only save/restore, protected-route redirects, keyboard skip navigation, responsive overflow, and automated WCAG 2.2 A/AA checks.
- Manual desktop and mobile screenshot inspection.

## Remaining Phase 1 work

- `BRN-002`: bounded approved-source fixtures and proposed facts.
- `BRN-003`: explicit owner verification, correction, rejection, and conflict resolution.
- `BRN-004`: approved-fact retrieval with citations and explicit unknown results.
- `BRN-005`: expiry and reverification rules.

This evidence does not pass Phase 1, authorize production providers, or satisfy OD-033 live readiness.
