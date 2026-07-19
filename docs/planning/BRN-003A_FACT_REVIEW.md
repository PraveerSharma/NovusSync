# BRN-003A Owner Fact Review

**Status:** Released to the protected Preview from main commit `d34f0c6`
**Boundary:** Synthetic/test only; no database effect, profile mutation, provider call, or real customer data

## Purpose

`BRN-003A` establishes the deterministic contract and protected interaction model for owner review before database persistence is added in `BRN-003B`.

## Implemented contract

- Only a current human workspace owner can review a candidate.
- Only provisional, unverified candidates are reviewable.
- A clear candidate may be verified as proposed or corrected with a reason.
- A conflicting candidate cannot use ordinary verification; it requires explicit conflict resolution and a reason.
- Rejection creates a decision but never an approved fact version.
- Correction and conflict resolution create a new immutable approved version that points to the version it supersedes.
- Every result retains candidate and source provenance.
- Every decision remains `profileApplicationStatus: not_applied`; profile mutation is a separate future command.
- Optimistic fact and decision versions reject stale reviews.
- Application authorization happens before tenant-scoped candidate or fact lookup.
- Idempotency is required at the repository boundary.

## UI fixture

The protected `/business-profile/review` route provides synthetic examples for:

- Clean source verification.
- Correct-and-verify.
- Source-versus-current conflict resolution.
- Stale booking-label rejection.
- Immutable browser decision history.
- Clear disclosure that no database or Business Profile write occurs in this sub-stage.

## BRN-003B handoff

`BRN-003B` must add an atomic PostgreSQL repository and migration for owner decisions, approved fact versions, supersession, audit events, idempotent replay, forced tenant RLS, and append-only mutation rejection. Only after that release passes may the backlog mark `BRN-003` complete.
