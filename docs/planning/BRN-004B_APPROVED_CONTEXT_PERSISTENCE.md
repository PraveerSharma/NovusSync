# BRN-004B: Approved Context Persistence

**Status:** Implementation candidate  
**Parent story:** BRN-004  
**Boundary:** Synthetic/test PostgreSQL and protected Preview only

## User outcome

Approved Context reads real versioned fact records inside the authenticated tenant boundary and
stores the exact cited context packet as an immutable, content-addressed snapshot. A later campaign
or concierge artifact can reference the snapshot instead of relying on mutable prompt context.

## Persistence boundary

- Current state is computed from append-only approved fact versions; history is retained.
- Governance state, permitted use cases, and optional expiry belong to each immutable fact version.
- Retrieval executes under forced workspace RLS using `SET LOCAL ROLE novussync_app`.
- Snapshot rows permit application `SELECT` and `INSERT` only and reject all updates/deletes.
- Snapshot audit metadata contains counts and use case only, never fact values or raw source text.
- Repeating identical content is idempotent through its SHA-256 snapshot identity.

## Release evidence required

- Schema generation and migration artifact review.
- Domain/application unit and type checks.
- Isolated PostgreSQL tests for current-version selection, governance outcomes, idempotency, RLS,
  least privilege, append-only enforcement, and safe audit metadata.
- Full production build and desktop/mobile browser acceptance.
- GitHub `main` verification and protected Preview deployment/runtime checks.
