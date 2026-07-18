# BRN-002A: Approved Source Proposal Foundation

**Status:** Implemented locally; GitHub CI and protected Preview verification pending  
**Parent story:** `BRN-002`  
**External effects:** None

## Delivered

- Owner-approved business-website and normalized booking-route source contracts.
- Public HTTPS validation, same-origin redirect enforcement and bounded capture size.
- Immutable capture provenance with source location/reference, capture time, extractor identity/version and digest.
- Provisional fact candidates with confidence, conflict state, playbook/template versions and bounded use cases.
- Tenant and session enforcement before an extractor port can run.
- Fail-closed handling for parser errors, unapproved fields, duplicate output and unsafe redirects.
- Explicit rejection of provider-owned booking availability, capacity, routing, conflicts, waitlists, price and payment state.
- Responsive Business Profile review drawer using minimized synthetic fixtures only.
- Owner-review queue interaction that does not verify or apply a value.

## Verification evidence

- Domain and application tests cover authority, provenance, unsafe URLs, redirects, size, duplicate output, stale labels, provider conflicts and tenant isolation.
- Repository formatting, lint, package boundaries and type checking pass.
- Provider-free contract and offline AI safety tests pass.
- Optimized Next.js production build passes.
- Playwright passes 30 scenarios across desktop, mobile, authentication-enabled and authentication-disabled projects.
- Local PostgreSQL integration execution remains blocked by the unavailable test database credential. This slice contains no database or migration changes; configured GitHub CI remains the required integration authority before deployment.

## Not delivered in this sub-stage

- Live website fetching or broad crawling.
- File, message or conversation ingestion.
- Proposal persistence or approval history.
- Applying a proposal to a verified Business Profile fact.
- Vector retrieval, production AI or autonomous enrichment.
- Automated booking, marketing messages, social publication or ad spend.

## Next sub-stage

`BRN-002B` will add tenant-scoped proposal persistence and an explicit owner decision record after the test database gate is green. It must not grant source extraction authority or add a live provider adapter.
