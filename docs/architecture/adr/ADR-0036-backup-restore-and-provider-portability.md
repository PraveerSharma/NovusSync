# ADR-0036: Backup, Restore, and Provider Portability

## Status

Accepted under founder-delegated technical direction — 14 July 2026

## Context

The managed pilot will hold tenant configuration, consent and suppression facts, campaign approvals, Lead and booking evidence, audit records, workflow state, and private media. Losing or silently corrupting those records would damage customer trust even at ten Workspaces. At the same time, active-active multi-region infrastructure is disproportionate for a small, human-supervised pilot.

ADR-0025 selects one Mumbai Supabase PostgreSQL system of record and private Supabase Storage. Supabase's managed database backups do not contain Storage objects, so database recovery alone is incomplete. ADR-0030 also makes tenant provider credentials encrypted ciphertext whose recovery depends on controlled AWS KMS access.

This decision sets internal engineering recovery targets, not a contractual uptime or customer SLA. OD-031/OD-032 accept the pilot commercial and budget boundaries; any new customer-facing reliability promise requires a separate founder decision.

## Decision

### 1. Recovery posture

Use one production region and fail closed. Do not build active-active, automatic cross-region failover, or dual writes. During a material outage, pause product-controlled effects, preserve inbound evidence where safely possible, communicate through the incident runbook, and restore deliberately.

Before any paid Workspace processes live Lead data:

- enable seven-day Supabase Point-in-Time Recovery (PITR) for production PostgreSQL;
- create encrypted off-provider logical database backups and object copies in a separate AWS recovery account in `ap-south-1`;
- enable S3 Versioning and Object Lock in governance mode on the recovery bucket;
- ensure the production workload cannot delete, shorten retention, or use the recovery KMS key administratively; and
- complete a successful isolated restore rehearsal with documented evidence.

PITR and its required compute must fit the accepted OD-032 ceiling. If a current provider quote cannot fit that ceiling, OD-036 or the budget must be explicitly reopened; a daily backup cannot be represented as meeting the target below.

### 2. Internal recovery targets

For paid-pilot production, target:

| Recovery surface | Recovery point objective | Recovery time objective |
|---|---:|---:|
| Authoritative PostgreSQL data | no more than 15 minutes of committed data at risk | critical application paths within 8 service hours |
| Private source/render objects | no more than 6 hours of accepted object changes at risk | critical objects within 8 service hours; complete object set within 24 hours |
| Application release | last known schema-compatible release manifest | 2 service hours after a recoverable application-only incident is declared |

These are measured internal targets. Provider outages, large datasets, customer-controlled booking/channel systems, and force-majeure events are not silently converted into contractual guarantees.

### 3. Backup sets and retention

- Supabase PITR supplies the primary seven-day database recovery window.
- Produce one encrypted logical PostgreSQL export at least nightly. Include schema, migration/version metadata, checksums, row counts, and a restore manifest; never include unencrypted secrets.
- Copy new or changed private Storage objects plus a checksummed relational/object inventory to the recovery bucket at least every six hours.
- Retain off-provider backup versions for 35 days by default. Do not create longer monthly archives until OD-027 defines purpose, disclosure, deletion, and legal-hold rules.
- Lifecycle expiry removes versions after the approved retention. Governance-bypass permission belongs only to a separately controlled recovery administrator and is not available to production.
- A legal hold is exceptional, documented, access-controlled, and authorized under the accepted privacy/legal policy; it is not a general retention shortcut.

Customer deletion removes or anonymizes active records according to OD-027. Backups are isolated from normal processing and age out within the disclosed backup window. Every restore reapplies deletion/suppression tombstones and post-backup corrections before the restored system can resume customer processing.

### 4. Restore verification

- Run an automated weekly backup inventory, checksum, decryptability, schema-version, and object/database reconciliation check.
- Perform a full isolated database-and-critical-object restore before the first paid activation, monthly thereafter, and after a material database/storage/backup change.
- Exercise application startup, migrations, tenant isolation, authentication recovery, suppression/deletion replay, workflow/effect reconciliation, signed-object access, and representative campaign-to-outcome reads.
- Record source recovery point, elapsed restore time, missing/corrupt items, RPO/RTO result, actor, environment, and remediation. A failed paid-production drill blocks release or new campaign admission until corrected.

Restored workflows and external effects never resume merely because rows exist. Reconcile outbox, inbox, effect, booking, and Dodo/other payment references against current provider state and accepted campaign/tail policy first.

### 5. Credentials and cryptographic recovery

Back up KMS/IAM/bucket configuration as reviewed infrastructure code and preserve key-policy/runbook evidence; never export plaintext KMS key material or provider secrets into a backup. Recovery access uses separately protected identities, MFA, least privilege, and audited break-glass procedure.

If the credential-encryption KMS key cannot be recovered safely, restore business data but require affected tenants to reconnect provider accounts. Do not weaken envelope encryption or store a plaintext escape copy to improve RTO.

### 6. Provider portability

Keep application-owned interfaces and normalized records at AI, workflow, booking, storage, observability, and future billing boundaries. Portability means a tested exit path, not lowest-common-denominator abstractions everywhere.

Maintain:

- reviewed PostgreSQL migrations plus a logical SQL export that restores to compatible PostgreSQL;
- a tenant-scoped portable export in documented JSON/CSV with stable IDs, timestamps, evidence/verification status, and checksums;
- a private-object manifest and original file formats rather than provider-only URLs;
- versioned provider mappings and normalized receipts separate from domain state; and
- runbooks for credential revocation, webhook shutdown, DNS/config change, and migration to a compatible provider.

Provider-specific infrastructure may remain inside adapters. No migration to another provider is built speculatively; the restore and export contracts are tested with synthetic data.

## Consequences

- PITR plus an independent immutable copy substantially reduces deletion, corruption, and single-provider risk.
- Separate database and object recovery adds jobs, credentials, monitoring, restore drills, and AWS cost.
- Seven-day PITR and a 35-day backup window create a bounded period in which deleted data may remain in isolated backups; OD-027/OD-033 must disclose and legally validate this behavior.
- Recovery remains manual and may involve downtime, which is appropriate for the managed pilot but not an enterprise availability claim.
- Catastrophic KMS loss can require customer reconnection rather than unsafe secret recovery.

## Revisit triggers

Revisit when measured restore time misses the target, datasets make the copy window impractical, a customer requires a contractual SLA or different residency, Supabase/AWS fails OD-027/OD-033, the cohort materially exceeds OD-032 capacity, or an outage history justifies warm standby/multi-region investment.

## Verification

- PITR recovery window and latest recoverable point are monitored.
- Production credentials cannot delete or bypass retention in the recovery account.
- A wrong-tenant export or object restore is rejected.
- An isolated restore proves database, object, deletion/suppression replay, and effect reconciliation.
- Restore evidence demonstrates the RPO/RTO targets before paid activation.
- A compatible PostgreSQL restore and tenant JSON/CSV/object export work without a Supabase-only application path.

## Official references checked

- [Supabase database backups and PITR](https://supabase.com/docs/guides/platform/backups)
- [Amazon S3 Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html)
- [Amazon S3 Versioning](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html)

## Related decisions

- OD-017 / ADR-0017: regional hosting and environment isolation
- OD-025 / ADR-0025: PostgreSQL, Storage, event, and audit authority
- OD-027: privacy, deletion, retention, and residency
- OD-030 / ADR-0030: secrets and credential encryption
- OD-032: provider budget and capacity envelope
- OD-035 / ADR-0035: releases, rollback, and recovery evidence
