# ADR-0030: Vercel sensitive environment secrets and AWS KMS credential envelopes

- **Status:** Accepted under founder-delegated technical direction
- **Date:** 14 July 2026
- **Decision:** OD-030

## Context

The application has two different secret classes. Deployment-level keys such as OpenAI, Supabase server access, PostHog/Sentry server configuration, and billing webhook secrets are shared by one environment. Future deep booking adapters may instead hold a separate OAuth refresh token or API credential for each Workspace. Storing those tenant credentials in normal environment variables does not scale; storing readable tokens in PostgreSQL gives a database compromise or broad application role an unnecessary blast radius.

The runtime is Vercel in Mumbai and the data project is Supabase Mumbai. Vercel supports non-readable sensitive environment variables and workload OIDC federation; AWS KMS supports Mumbai, envelope encryption, authenticated encryption context, IAM conditions, and key audit events.

## Decision

### Deployment-level secrets

Store shared application keys as **Vercel Sensitive Environment Variables**, scoped separately to preview/staging/production and only to the project/runtime that needs them. Never use production secrets in preview, expose server secrets through `NEXT_PUBLIC_*`, share one provider key between environments, or commit a populated `.env`. Local development uses ignored local files or the approved local secret mechanism; tests use synthetic values/fakes.

Configuration is typed and validated at process startup. Missing, malformed, client-exposed, or wrong-environment secret configuration fails closed before work is accepted. `.env.example` contains names and safe placeholders only.

### Tenant integration credentials

Use a customer-managed symmetric **AWS KMS key in `ap-south-1`** and envelope encryption for Workspace-owned provider credentials:

1. Vercel workloads obtain short-lived AWS credentials through **Vercel OIDC federation** into environment- and execution-unit-specific IAM roles; no long-lived AWS access key is stored in Vercel.
2. Generate a per-credential data key, encrypt the token locally using an authenticated encryption construction supplied by the AWS Encryption SDK, erase plaintext/data-key buffers as soon as practical, and store only the encrypted message/encrypted data key plus non-secret metadata in PostgreSQL.
3. Bind decryption to a non-secret KMS encryption context containing application, environment, Workspace ID, provider, connection ID, and credential-version identifiers. IAM/key policies require expected context fields. Encryption context must never contain contact data, tokens, or other sensitive values because it is visible in CloudTrail.
4. Only the narrowly scoped integration execution path may decrypt a credential for an immediate provider call. General web rendering, analytics, models, support UI, and unrelated workflows cannot decrypt it. Authorized UI may show provider, scopes, owner, status, expiry, last-used/rotated/revoked times, and masked hints—never plaintext.

Provider access/refresh tokens, client secrets, webhook secrets, and signing keys are separate typed credential kinds. Do not put raw credentials in domain rows, browser storage, URLs, logs, errors, traces, analytics, prompts/model inputs, workflow journals, support screenshots, fixtures, or audit metadata.

### Lifecycle and operations

- Prefer least scopes, customer-delegated accounts, provider OAuth, short expiry, and provider-side revocation. Password sharing and shared agency customer credentials are prohibited.
- Rotation creates a new version, tests it, changes active reference atomically, preserves only safe history, and revokes/retire the old version after a bounded overlap. Provider/webhook rotation supports dual verification only for the documented overlap.
- Credential reads/decrypt attempts, rotations, failures, and revocations create safe audit/security events; ordinary successful provider calls record the credential version, not the secret.
- Suspected disclosure immediately pauses the affected connection, revokes provider credentials, rotates dependent secrets/keys where needed, and follows the incident runbook.
- KMS administration, application decrypt, and break-glass roles are separate; production decrypt is denied to developer/local/preview identities. Root/administrator credentials are hardware-MFA protected.
- Never delete a KMS key on an operational shortcut. Key rotation/re-encryption and disaster recovery are rehearsed before production; scheduled deletion requires founder/security approval and verified data retirement.

No Meta credential exists in the initial MVP. Dodo or another billing provider uses deployment-level API/webhook secrets unless a later multi-merchant model requires a separate design.

## Consequences

- Tenant credentials remain recoverable only through scoped workload identity plus KMS, reducing database and operator blast radius.
- AWS becomes one additional infrastructure/security provider and requires IAM, CloudTrail, cost, and incident ownership.
- OIDC removes static AWS access keys but federation and policy configuration must be tested for Vercel Workflow execution as well as web/API functions.
- The database can still lose ciphertext; backup/restore must preserve encryption metadata and KMS availability.

## Rejected alternatives

- **All secrets in ordinary Vercel environment variables:** readable to project users and unsuitable for per-Workspace credentials.
- **Plain or application-key-encrypted database columns:** a broadly available application key collapses separation between data and key compromise.
- **Supabase Vault as the only tenant-token boundary:** fewer providers, but database/service-role compromise has a wider combined data/decryption blast radius for this use case.
- **Long-lived AWS access keys:** unnecessary with Vercel OIDC and harder to rotate safely.
- **Shared agency accounts/passwords:** breaks attribution, revocation, least privilege, and customer control.

## Verification

- Automated config tests catch missing, malformed, wrong-environment, and client-bundled secrets.
- Seeded secret canaries never appear in logs, Sentry, PostHog, model payloads, workflows, errors, or snapshots.
- IAM tests prove preview, web-only, analytics, and cross-Workspace contexts cannot decrypt production credentials.
- Rotation, revocation, wrong-context failure, provider expiry, KMS outage, and incident pause are rehearsed with synthetic credentials.
- A restored database can decrypt synthetic credentials only with the correct environment key/context and authorized role.

## Official references checked

- [Vercel Sensitive Environment Variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- [Vercel OIDC federation reference](https://vercel.com/docs/oidc/reference)
- [AWS KMS envelope encryption](https://docs.aws.amazon.com/kms/latest/developerguide/kms-cryptography.html)
- [AWS KMS encryption context](https://docs.aws.amazon.com/kms/latest/developerguide/encrypt_context.html)
- [AWS KMS Mumbai endpoint](https://docs.aws.amazon.com/general/latest/gr/kms.html)

