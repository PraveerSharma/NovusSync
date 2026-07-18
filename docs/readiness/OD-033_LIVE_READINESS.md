# OD-033 Live-Readiness Checklist

**Policy decision:** Accepted by founder on 14 July 2026  
**Evidence status:** **NOT PASSED — no live-readiness claim is authorized**  
**Gate owner:** Founder  
**Related controls:** OD-014, OD-027, OD-029–OD-032, OD-036; `OPS-003`, `OPS-005`, `OPS-009`, `OPS-010`  
**Legal note:** This is an evidence and approval workflow, not legal advice. Qualified India counsel and an accountant must approve or amend the applicable legal/tax items.

## 1. Gate effect

Until the applicable rows pass for the actual configured stack and pilot partners:

- do not place real Lead personal data in the product;
- do not activate a paid/live campaign or production AI/telemetry;
- do not purchase/enable a production provider merely because it appears in an ADR or Gate G0 passes;
- do not represent the product, operators, channel process, privacy posture, or provider stack as launch-ready; and
- keep global checkout and Dodo disabled.

OD-033 acceptance fixes the rule. It does not prove that an account is accessible, a document is enforceable, a processor is acceptable, an operator is trained, a rehearsal passed, or a country is supported. Synthetic/local foundation work remains separately blocked until Gate G0 passes; a later G0 `GO` does not change this checklist's status or authorize any live path.

The staged gate sequence is:

1. Before Gate G0: research, documentation, de-identified analysis, synthetic exercises, and disposable prototypes only.
2. After a signed Gate G0 `GO`: synthetic/local Phase 0 implementation only, with fake adapters and separately authorized non-customer sandbox tests.
3. Before any real Lead data, paid/live campaign, production provider, or production AI/telemetry: every applicable row below must pass for the actual configuration and the founder must complete §8 with a live-readiness `GO`.

Read-only official terms/provider research may support the evidence plan at any stage. It cannot create a production account, authorize a purchase, or change a row to `PASS` without the required actual configuration, reviewer, dated evidence, and approval.

## 2. Evidence handling

- Record a named owner, reviewer, review date, source/evidence reference, result, expiry/change trigger, and follow-up for every item.
- Keep contracts, identity details, account screenshots, access lists, security evidence, customer/Lead data, and signatures in an approved access-controlled store. Git contains only redacted references and status.
- Review evidence after the actual vendor/account/plan/data flow is selected and again immediately before first live activation.
- Revalidate on any material term, subprocessor, region, purpose, retention, access method, incident route, provider, vertical, country, or checkout change.
- `PASS WITH EXCEPTION` is not a status. A blocking exception is `FAIL` until the accountable reviewer approves a bounded amendment and its evidence is attached.

Allowed statuses: `PENDING`, `IN REVIEW`, `PASS`, `FAIL`, `NOT APPLICABLE`, `DISABLED`.

## 3. Master readiness register

| Evidence ID | Required proof | Accountable reviewer | Initial status |
|---|---|---|---|
| `LR-001` | Legal entity/trading identity, authorized signatory, accountant-approved India invoice/tax treatment, payment/deposit/refund record route | Founder + accountant | **PENDING** |
| `LR-002` | Counsel-reviewed pilot terms, privacy notice, controller/processor allocation, customer DPA where applicable, support/service limits, cancellation/refund/credit, dispute and complaint route | Founder + qualified counsel | **PENDING** |
| `LR-003` | Versioned Lead notice/consent language by purpose/channel, lawful contact basis, WhatsApp disclosure, withdrawal/opt-out/suppression, rights contact, children/non-medical exclusions | Privacy owner + qualified counsel | **PENDING** |
| `LR-004` | Two named operators' confidentiality, data handling, access, work-product/IP, volunteer/engagement, hours, exit/revocation/replacement, incident, and training terms | Founder + qualified counsel | **PENDING** |
| `LR-005` | Each pilot Instagram account's ownership/eligibility, individual delegated/shared access, actor list, MFA/recovery, no password sharing, exact-version publication rehearsal, evidence method, access-loss route | Studio owner + delivery lead | **PENDING** |
| `LR-006` | Each official WhatsApp Business number's ownership, permitted human/device access, app/recovery setup, service coverage, consent/opt-out/takeover playbook, evidence method, account-loss route | Studio owner + delivery lead | **PENDING** |
| `LR-007` | Actual provider register: purpose, data, role, account owner, plan, DPA/terms, subprocessors, regions/transfers, retention/deletion, security/incident route, support, termination/export | Privacy + technical owner | **PENDING** |
| `LR-008` | Final data-flow/field map and OD-027 30/90/365/35 lifecycle; minimization, access, export, deletion/anonymization, suppression, restored-data replay, and no raw Lead data in AI/telemetry | Privacy + technical owner + counsel | **PENDING** |
| `LR-009` | Claims/creative/offer review responsibility, substantiation evidence, testimonial/likeness permissions, price/tax wording, prohibited yoga claims, complaint/takedown path | Founder + qualified reviewer | **PENDING** |
| `LR-010` | Security/access baseline: named production owners, MFA, least privilege, support grants, secrets/KMS/OIDC, environment isolation, audit, leak canaries, escalation contacts | Technical/security reviewer | **PENDING** |
| `LR-011` | Rehearsed withdrawal/opt-out, rights export, deletion and backup expiry, wrong publication, account loss, suspected breach, provider outage/termination, and isolated restore | Founder + privacy/technical/delivery owners | **PENDING** |
| `LR-012` | Production evaluation/recovery/release evidence: AI gate, tenant/privacy tests, cost/admission controls, restore, runbooks, operator rota, second review where required, founder release record | Founder + qualified technical reviewer | **PENDING** |
| `LR-013` | Partner activation sheet: signed terms, baseline, exact accounts/routes, consent, capacity, tier/payment, support, owner/operator authority, open issue disposition | Founder + studio owner | **PENDING** |
| `LR-014` | Country/commerce allow-list: India pilot only; global checkout disabled; any new country/provider/offer gets separate tax/legal/provider/support approval and implementation authorization | Founder + counsel + accountant | **PENDING (India); DISABLED (all other countries)** |

## 4. Provider and subprocessor evidence

Every `PENDING` or later-selected provider must have a dated evidence record sourced from its current official terms and account/plan configuration. Marketing pages or remembered terms are insufficient.

| Provider/category | Intended purpose | Evidence required before enablement | Initial state |
|---|---|---|---|
| Vercel | Mumbai web/API and Workflow hosting | Contract/DPA, subprocessors, primary/backup processing, Mumbai configuration, logs/retention/deletion, incident/support/termination, account ownership, plan/cost | **PENDING — production disabled** |
| Supabase | Mumbai PostgreSQL, private Storage, Auth | Contract/DPA, subprocessors, region and cross-border services, Auth/email behavior, backups/PITR/Storage gap, logs/retention/deletion, incident/support/export/termination, account/plan | **PENDING — production disabled** |
| OpenAI API | Evaluated proposal generation | Business/API terms and DPA, subprocessors/regions, submitted-data/training/retention controls, project/key ownership, abuse/log handling, deletion/incident/support/termination, approved data allow-list | **PENDING — production calls disabled** |
| AWS | Mumbai KMS and independent recovery | Account ownership, DPA/subprocessors, `ap-south-1` configuration, IAM/OIDC/KMS/S3 controls, logs/retention/deletion, incident/support/termination, recovery-account separation and cost | **PENDING — production role disabled** |
| PostHog EU | Allow-listed product analytics projections | DPA/subprocessors/regions, EU project configuration, autocapture/replay disabled, allow-list, retention/deletion, incident/support/export/termination | **PENDING — production sink disabled** |
| Sentry EU/DE | Scrubbed errors/traces | DPA/subprocessors/regions, EU organization configuration, SDK scrubbing and prohibited features, retention/deletion, incident/support/export/termination | **PENDING — production sink disabled** |
| Transactional email / SMTP | Essential invite/passwordless authentication and service email only; no marketing/Lead automation | Named provider and purpose, DPA/subprocessors/regions, sender/domain security, templates, suppression, logs/retention/deletion, incident/support/termination | **PENDING — provider not selected; production disabled** |
| Booking provider(s) | Partner-owned authoritative booking/evidence route | Per-partner provider/plan, owner authorization, privacy/terms, capability/evidence tier, least privilege, data fields, retention/deletion, incident/support/export/termination | **PENDING — partner inventory required; production disabled** |
| Dodo or another payment provider | Future global software checkout | Written offer eligibility, merchant model, countries/currencies/tax/payment/refund coverage, DPA/subprocessors, support/termination, separate approved build story | **DISABLED — deferred** |

If a provider fails review, keep it disabled and change provider, reduce data/purpose, or reopen the affected decision. Do not convert missing evidence into an architectural assumption.

## 5. Manual-channel readiness

### Instagram

- [ ] Studio owner confirms the exact business account and authority to use it.
- [ ] Every owner/operator actor has individual delegated/shared access, MFA where available, and a tested revocation/recovery path.
- [ ] No shared password, product credential, Meta SDK, OAuth token, webhook, API adapter, or automated publishing path exists.
- [ ] A non-customer rehearsal proves exact approved-version handoff, actor/time record, public URL or permitted screenshot evidence, wrong-version stop, and account-loss escalation.
- [ ] Owner/counsel review applicable platform terms, content rights, claims, complaint, and evidence-retention handling.

### WhatsApp Business

- [ ] Studio owner confirms the exact official Business number, devices, permitted humans, recovery, and service-window coverage.
- [ ] The hosted form is primary; a tracked click is never recorded as a Lead, message, consent, or delivery.
- [ ] Human actors review and send all messages in the official app; the product stores only approved minimized evidence/reconciliation.
- [ ] Current notice/consent, purpose, identity, opt-out, suppression, takeover, complaint, and outside-hours playbooks pass counsel/owner review and rehearsal.
- [ ] No Cloud API/BSP SDK, token, template API, webhook, automated receipt, send, inbox, status, or quota claim exists.

Any future Meta automation stops here and triggers ADR-0019 re-entry: a new dated official capability, permission, App Review/verification, terms/DPA/subprocessor, security, incident, cost, and workload spike is mandatory before a new decision.

## 6. Required rehearsals

| Rehearsal | Pass evidence |
|---|---|
| Consent withdrawal / WhatsApp opt-out | Actor records withdrawal, suppression is immediate, later product drafts/reminders stop, humans receive off-platform stop instruction, and no re-contact occurs without valid re-consent |
| Authorized export | Tenant-complete minimized export, identity/authority check, audit record, secure delivery, and missing/third-party data explanation |
| Deletion | Active stores delete/anonymize by policy, audit integrity remains bounded, third-party requests are tracked, backups expire within 35 days, and restored data replays suppression/deletion |
| Instagram/WhatsApp access loss | Revoke actor/device, stop due work, notify owner/founder, preserve safe evidence, recover without shared credentials, and record disposition |
| Wrong/unapproved publication or contradictory message | Pause, contain/takedown where authorized, notify accountable owner, preserve evidence, assess affected people, correct without hiding the event, and prevent recurrence |
| Suspected security/privacy incident | Triage, revoke/isolate, preserve safe logs, assess scope/notification with counsel, contact providers/affected controllers, document timeline and follow-up |
| Provider outage or termination | Fail closed, pause affected work, communicate limits, export/recover through the accepted seam, and avoid silent provider/region/model substitution |
| Database/object recovery | Isolated restore meets applicable internal targets, tenant/object completeness is checked, secrets are rotated where required, and deletion/suppression replay passes |

## 7. Separate spending authorization

OD-032 does not include counsel/legal spend. Before retaining counsel or buying a legal/compliance service, record scope, provider, quote, ceiling, payer, deliverables, confidentiality, and founder approval. Provider plan purchases remain subject to the applicable OD-032 ceiling and this checklist; neither budget alone authorizes purchase.

## 8. Founder live-readiness decision

| Field | Record |
|---|---|
| Evidence snapshot/version and review date | |
| Qualified counsel and accountant review references | |
| Passed evidence IDs / failed or disabled evidence IDs | |
| Approved production providers, accounts, plans, and regions | |
| Approved pilot partner codes and activation sheets | |
| Rehearsal dates and unresolved actions | |
| India pilot go/no-go: `GO`, `NO-GO`, or `REWORK` | |
| Real Lead data authorized: `YES` or `NO` | **NO until signed** |
| Paid/live activation authorized: `YES` or `NO` | **NO until signed** |
| Production AI/telemetry authorized: `YES` or `NO` | **NO until signed** |
| Global checkout authorized: `YES` or `NO` | **NO — separate country/build approval required** |
| Founder name/signature reference and conditions | |

The status at the top changes to `PASSED FOR INDIA PILOT` only after every applicable item passes and this record is completed. Readiness is configuration- and time-specific; it is re-opened by any change trigger in §2.
