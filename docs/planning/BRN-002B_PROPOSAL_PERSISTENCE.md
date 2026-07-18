# BRN-002B: Proposal Persistence and Owner Decision History

**Status:** Implemented locally; migration generation and verification pending  
**Parent story:** `BRN-002`  
**External effects:** None

## Persistence model

- Approved source metadata is immutable and tenant scoped.
- Every source capture retains normalized provenance without storing raw page or conversation content.
- Proposal batches and candidates are append-only and remain provisional and unverified.
- Owner decisions use optimistic, append-only versions.
- A decision always records `not_applied`; applying it to a Business Profile requires a separate future command.
- Idempotency and safe audit records cover batch persistence and owner decisions.

## Security model

- Composite organization/workspace RLS is forced on every new table.
- The application role receives only `SELECT` and `INSERT` grants.
- Update, delete and truncate are revoked.
- An immutable trigger rejects mutation even through an administrative database connection.
- Application authorization requires a current human owner before a decision reaches persistence.

## UI boundary

The Business Profile drawer displays a minimized synthetic decision-history fixture with explicit owner, version and `Not applied` state. It does not claim that the Preview is connected to a live source, owner account or production database.
