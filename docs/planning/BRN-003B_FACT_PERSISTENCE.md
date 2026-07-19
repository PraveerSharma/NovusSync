# BRN-003B Approved Fact Persistence

**Status:** Implementation candidate; release verification pending  
**Boundary:** Isolated synthetic/test PostgreSQL only; no profile mutation, provider call, live customer data, or Production deployment

## Purpose

`BRN-003B` makes owner fact-review evidence durable without turning review into an automatic Business Profile or provider effect.

## Persistence contract

- Identical authorized commands can replay before changed fact state causes a false stale-version failure.
- The transactional repository repeats the idempotency claim to close concurrent retry races.
- A field-scoped PostgreSQL advisory lock serializes competing candidate approvals.
- Optimistic decision and approved-fact versions reject stale writes.
- Approved versions retain candidate and source provenance and point to the fact version they supersede.
- Rejections create immutable decision evidence while leaving the approved fact unchanged.
- Every decision remains `profile_application_status = not_applied`.
- Safe audit metadata records the decision category without storing proposed or approved business values.

## Database controls

- `approved_fact_version` is append-only and uniquely versions each tenant/profile/field.
- `fact_review_decision` is append-only and uniquely versions each tenant/candidate decision history.
- Both tables force row-level security by organization and workspace.
- The application role receives only `SELECT` and `INSERT`.
- Database triggers reject `UPDATE` and `DELETE`, including privileged accidental mutation.
- Foreign keys bind versions and decisions to immutable source candidates, captures, actors, and superseded versions.

## Release gate

The release must pass unit, type, lint, boundary, migration, isolated PostgreSQL integration, production build, complete browser, GitHub CI, immutable Preview, stable Preview, accessibility, runtime, and Vercel error-log checks before `BRN-003` is marked complete.
