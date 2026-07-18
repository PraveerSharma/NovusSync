# ADR-0027: Privacy, Consent, Retention, and Cross-Border Processing

## Status

Accepted by founder — 14 July 2026

## Context

The Bengaluru managed pilot will process identifiable prospect and customer data across a hosted form, manually reconciled WhatsApp evidence, booking systems, product records, AI-assisted private drafts, analytics, observability, and backups. The product must minimize harm and meet India-focused privacy obligations while retaining enough evidence to deliver and evaluate the campaign-to-attendance loop.

The accepted infrastructure deliberately places the primary PostgreSQL database, private objects, KMS, and independent recovery copies in Mumbai. Vercel, OpenAI, PostHog EU, Sentry EU/DE, email, booking, and future payment providers may still process limited data outside India. The founder accepts a global-ready product rather than an India-only architecture.

India's notified DPDP commencement schedule phases most operational duties eighteen months after 13 November 2025. The product will implement the target safeguards before handling live Lead data rather than defer them until the statutory date. OD-033 still requires qualified counsel to validate actual contractual roles, notices, subprocessors, and applicable transition obligations before launch.

## Decision drivers

- Minimize Lead exposure and the consequences of an incident.
- Preserve consent, suppression, attribution, booking, outcome, and correction evidence.
- Avoid falsely claiming India-only processing.
- Keep the initial yoga campaign away from child-directed and health/medical processing.
- Support export, correction, deletion, provider replacement, and bounded backup expiry.
- Keep the generic product configurable for later approved jurisdictions without pretending one privacy policy fits the world.

## Options considered

### Strict India-only processing

This provides a simple residency message but conflicts with accepted Vercel and managed AI/telemetry providers, materially reduces provider choice, and would reopen OD-017, OD-023, OD-024, OD-028, and parts of OD-035.

### Unrestricted global managed processing

This maximizes convenience but spreads identifiers, conversations, and business facts across providers without sufficient purpose, retention, or deletion control.

### Mumbai primary stores plus controlled cross-border processors

This preserves the regional system of record while allowing vetted managed services to receive only purpose-required, classified data under contracts, allow-lists, and deletion rules.

## Decision

### 1. Residency and processor posture

Use Mumbai for the production database, private object storage, KMS credential envelopes, and independent recovery account. Permit vetted cross-border processing only for an approved purpose and data class, with a current DPA/terms review, subprocessor register, region/transfer record, least-data payload, retention/deletion behavior, incident contact, and replacement plan.

Do not advertise the product as India-only. Customer notices and contracts disclose that limited data may be processed internationally. A later country launch must pass a jurisdiction-specific privacy, tax, language, claims, and provider review; global-ready configuration is not automatic global legal approval.

Until OD-033 counsel review, use this contractual starting position:

- the studio determines the purpose of processing its prospect/Lead data and is the customer-side Data Fiduciary/controller;
- the product company processes that Lead data to deliver the contracted service and is its processor/service provider; and
- the product company independently determines necessary processing for its own business-customer accounts, security, fraud prevention, legal compliance, and billing.

Contracts must describe instructions, confidentiality, subprocessors, security, assistance, deletion/return, incident notification, and audit evidence. The application cannot decide the final legal classification.

### 2. Data minimization and exclusions

The hosted-form/manual-reconciliation path may store only the fields needed for the accepted campaign:

- name;
- mobile/WhatsApp contact;
- campaign, creative, route, source, and consent evidence;
- preferred provider-managed location/class/time or comparable booking preference;
- no more than three approved qualification answers;
- booking reference/status and verified attendance/no-show/cancellation; and
- separately verified won/lost/value evidence where supplied.

Use stable internal IDs instead of contact identifiers in jobs, analytics, alerts, and model calls wherever possible.

The initial pilot excludes government identifiers, card/payment credentials, precise date of birth, biometric data, medical diagnosis/treatment history, open-ended health notes, and child-directed offers. Campaigns target adults. An answer suggesting a health/safety concern is minimized, kept out of AI/telemetry, and handed to an authorized human; the product does not provide medical advice.

### 3. Notice, consent, and suppression

Before form submission, present a clear, versioned notice naming the studio, collected field categories, specific introductory-offer/booking/follow-up purpose, manual WhatsApp use, relevant privacy link, withdrawal/rights route, and the product's service role. Required consent is unbundled from optional marketing.

An inbound WhatsApp request permits a human to respond to that request; it does not silently create permission for open-ended marketing. Reminders and later campaign follow-up require recorded purpose/channel permission or another counsel-approved lawful basis.

Store consent purpose, channel, notice/version, source, evidence, actor where manually reconciled, and occurred/recorded timestamps. Withdrawal or opt-out updates central suppression immediately, cancels product drafts/due work, and cannot be casually overridden. The product explicitly cannot prevent a human from contradicting suppression outside the system; such a contradiction is a severe trust incident.

### 4. AI, telemetry, and provider payloads

- Campaign/content generation uses verified business facts, not Lead records.
- Qualification or reply assistance receives the minimum structured answer/context needed, a pseudonymous Lead reference, and no phone number, raw screenshot, unnecessary full transcript, medical detail, or unrelated history.
- Raw customer data cannot become a training, evaluation, analytics, or debugging corpus by default.
- PostHog receives only accepted pseudonymous product-event projections. Sentry/Vercel/OpenTelemetry receive scrubbed structured operational fields and safe correlation IDs.
- Session replay, broad autocapture, raw prompt/message capture, feedback attachments, and secret-bearing workflow payloads remain disabled.

### 5. Default retention schedule

| Data class | Default maximum | End-of-period action |
|---|---:|---|
| Raw WhatsApp screenshots or raw conversation evidence | 30 days after structured reconciliation, and never beyond campaign close + 30 days without a documented incident/legal hold | Delete object and direct copies; retain only approved structured facts/evidence hash where needed |
| Identifiable Lead, consent, booking, and outcome operational records | 90 days after the campaign outcome window closes | Delete direct identifiers or irreversibly anonymize the record; retain de-identified aggregates |
| Approved/published campaign artifacts and minimized approval/audit evidence | 365 days after campaign close | Delete or anonymize unless an active contractual/dispute/legal need is recorded |
| Raw operational error/trace data | 30 days | Expire at source; preserve only a scrubbed incident record when required |
| Pseudonymous product analytics | 12 months | Aggregate/anonymize or delete |
| Off-provider recovery backups | 35 days | Lifecycle expiry under ADR-0036 |
| Customer account, contract, invoice, tax, dispute, and legally required records | Applicable documented statutory/contractual period | Delete/anonymize when the obligation ends |

No Workspace may configure a longer period merely for convenience. A longer legal or dispute hold must name purpose, scope, authority, owner, review/expiry date, and access restriction. A customer may select a shorter period if it does not break an active legal obligation or product-safety invariant.

De-identified aggregate campaign metrics may be retained for long-term product learning only when the re-identification key and free-text evidence are removed and the result no longer identifies a person.

### 6. Rights, export, correction, and deletion

Provide authenticated Workspace export plus a documented Lead rights-request route. Suppression is immediate. Target active-system access, correction, export, or deletion completion within 30 calendar days, subject to verified identity/authority and documented legal exceptions.

Deletion propagates through active PostgreSQL rows, private objects, provider records where applicable, and future processing queues. Append-only audit records are minimized and may retain a non-identifying action/reason reference rather than forbidden content. Backup copies remain isolated from ordinary processing and expire within 35 days; a restore must replay deletion/suppression tombstones before resuming.

### 7. Security and incident controls

Encrypt data in transit and at rest, enforce tenant-safe authorization and least privilege, require individual operator accounts/MFA, redact exports/logs, use signed short-lived object access, and record access to sensitive exports/support grants. Every approved processor has an incident contact and response obligation.

A suspected personal-data incident pauses the affected processing path, preserves minimal forensic evidence, invokes the incident/counsel runbook, and evaluates required studio, individual, provider, insurer, authority, and Board notifications. Product code does not hard-code a notification deadline without the current jurisdictional/legal policy.

## Consequences

### Positive

- Limited identifiers leave the Mumbai system of record.
- Consent, opt-out, deletion, and correction behavior becomes testable rather than contractual prose only.
- Short raw-evidence and Lead retention reduces breach impact.
- The accepted Vercel/OpenAI/telemetry architecture can proceed without an inaccurate residency claim.
- Jurisdiction and retention become configurable policy rather than yoga- or India-hard-coded domain behavior.

### Negative

- Short retention limits long-term conversation history and some debugging.
- Data-rights workflows, provider deletion, tombstone replay, and retention jobs add engineering and operating work.
- Cross-border processors require continuing DPA/subprocessor monitoring.
- A global-ready product still needs country-by-country launch review and cannot truthfully sell into every jurisdiction on day one.

## Required verification before live Lead data

- Counsel accepts or amends roles, notice/consent copy, cross-border disclosure, processor terms, children's exclusion, and the retention schedule under OD-033.
- A field-level data-flow and subprocessor register names purpose, role, location, payload, retention, deletion, and incident owner.
- Automated tests prove minimization, notice/version evidence, immediate suppression, role/tenant denial, AI/telemetry redaction canaries, retention expiry, provider-deletion jobs, export authorization, and backup tombstone replay.
- A synthetic rights request completes export, correction, active deletion, provider propagation, and bounded-backup explanation.
- Each new country, language, regulated vertical, Lead field, processor, or materially longer retention requires policy/legal review and, when material, a successor decision.

## Official references checked

- [DPDP Act commencement notification, 13 November 2025](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf)
- [Digital Personal Data Protection Act, 2023](https://www.indiacode.nic.in/handle/123456789/22037)
- [Digital Personal Data Protection Rules, 2025](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf)
- [Information Technology SPDI Rules clarification](https://www.meity.gov.in/writereaddata/files/PressNote_25811.pdf)

## Related decisions

- OD-002: Bengaluru/India pilot geography
- OD-007/OD-019: hosted-form and manual WhatsApp boundary
- OD-016/ADR-0016: identity, tenancy, and operator access
- OD-017/ADR-0017: Mumbai compute and cross-border provider reality
- OD-023/ADR-0023: AI payload boundary
- OD-025/ADR-0025: system of record and private Storage
- OD-028/ADR-0028: pseudonymous analytics and scrubbed observability
- OD-030/ADR-0030: secrets and credential encryption
- OD-033: legal, platform, DPA, and subprocessor readiness
- OD-036/ADR-0036: backup retention, deletion replay, and restore

