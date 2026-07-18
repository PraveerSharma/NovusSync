# ADR-0021: Verified Business Brain Sources and Retrieval

## Status

Accepted — founder, 14 July 2026

## Context

The product needs reusable business context for campaign planning, content, private lead-handling drafts, and review. That context may include offers, prices, audiences, locations, services, FAQs, policies, claims, restrictions, and brand voice. If stale website text, an AI extraction, an old document, or an observed conversation silently becomes truth, the product can publish or suggest materially incorrect information.

The initial managed pilot has five design partners, a small fact corpus per Workspace, and human-assisted onboarding. The generic product core must support later verticals, while yoga-specific fields and rules remain versioned configuration. Booking availability, capacity, routing, and conflicts are already assigned to the external booking provider by ADR-0020.

## Options considered

| Option | Benefits | Costs and risks | Appropriate when |
|---|---|---|---|
| Structured owner entry only | Highest clarity and simplest security boundary | More onboarding work; misses useful existing copy | The business has little reusable digital material |
| Guided entry plus bounded website import | Reduces re-entry while keeping the source inspectable | Website may be stale, conflicting, or hostile; extraction can be wrong | Import remains provisional and URL/size/parser controls exist |
| Broad crawl, live web search, or conversation-derived learning | Appears highly automatic and may find more context | Weak authority, unpredictable scope, stale facts, prompt-injection and privacy risk | Not appropriate for externally used MVP truth |
| PDF/document import | Useful for brochures, menus, price lists, and policies | Malware, parser, retention, access, duplicate, and stale-version risk | Repeated partner evidence justifies a governed import path |
| Prompt-stuff all source content | Quick prototype | Token cost, poor authority control, nondeterministic omissions, weak citations | Disposable experiments only |
| Relational facts plus structured/full-text retrieval | Simple, explainable, tenant-safe, and appropriate for a small corpus | Less tolerant of vague semantic queries | Facts are normalized and retrieval contracts are explicit |
| Add pgvector immediately | Better semantic matching for unstructured text | Additional indexing, evaluation, ranking, and authority complexity | A measured corpus and retrieval benchmark demonstrate need |

## Decision

### 1. Allowed MVP inputs

The Business Brain accepts only:

1. guided, structured owner entry using the active versioned vertical template;
2. a bounded import from one owner-approved primary business website/domain, producing provisional suggestions; and
3. normalized descriptive metadata from an owner-approved `BookingRoute`, such as provider resource identifiers and labels needed to map locations, instructors, classes, services, or links.

Arbitrary live-web search, broad autonomous crawling, unrestricted document upload, and facts learned from lead conversations are outside the MVP. A human may manually enter information learned elsewhere, but it follows the same verification and provenance rules.

### 2. Verification and authority

Every ingested or extracted value is a `FactCandidate`; neither extraction confidence nor source type makes it approved truth. Campaign-critical facts require an explicit action from an authorized owner or customer role before they become a current `VerifiedFact`.

Each fact records at least:

- `workspaceId`, generic fact type/key, and vertical-template version;
- structured value and allowed use cases;
- source type, stable source reference/location, capture time, and extractor/version where applicable;
- candidate confidence, conflict state, verification status, verifier, and verification time;
- version/supersession history and freshness/expiry policy where applicable.

Conflicting sources are surfaced for resolution and are never silently merged or selected by confidence. Rejected, disputed, superseded, expired, or unverified candidates cannot support customer-facing content or private lead-handling drafts that may be sent externally.

### 3. Booking boundary

Descriptive booking metadata may propose or label a campaign mapping. The authorized owner approves the route mapping. Live availability, capacity, routing, conflicts, waitlists, rescheduling, and cancellations are not copied into the Business Brain; the provider remains authoritative under ADR-0020.

### 4. Retrieval

MVP retrieval uses Workspace-scoped relational queries and PostgreSQL full-text search where useful. A retrieval request includes the actor/system purpose and use case. It returns only current, verified, permitted facts with their source/version/freshness references. Missing, disputed, expired, restricted, or unauthorized facts produce an explicit machine-readable `unknown` or escalation result.

Raw website pages are not prompt-stuffed as business truth. Generated artifacts record the immutable verified-context snapshot used to create them.

No vector retrieval or standalone vector store is included initially. pgvector may be considered later only when an accepted retrieval evaluation demonstrates material failures that structured/full-text retrieval cannot reasonably solve.

### 5. Generic core

The core owns generic fact, source, verification, conflict, version, expiry, permission, and retrieval contracts. The yoga pack supplies its required fields, labels, validation, claim restrictions, and freshness rules. Adding another business type requires a new governed template and tests, not new yoga-shaped domain tables.

### 6. Deferred document import

PDF/document import requires design-partner evidence, an accepted scope amendment, and controls for access, file type, MIME/signature, size/page limits, malware quarantine, private storage, safe parsing, provenance, retention/deletion, duplicates, and version conflicts. Until then, an owner or operator enters relevant facts through the guided workflow.

## Invariants

- AI confidence never grants fact authority.
- Only an authorized human can verify campaign-critical business truth.
- Every externally usable fact is source-linked, current, versioned, and use-case permitted.
- Unknown or conflicting information remains explicit; the system does not invent a value.
- A lead conversation cannot silently train or update business truth.
- Tenant scope is mandatory for ingestion, verification, retrieval, and generated snapshots.
- Provider operational state is read through the booking boundary, not cached as verified Business Brain truth.

## Consequences

### Positive

- External content and drafts have a clear, auditable truth boundary.
- Website ingestion reduces re-entry without pretending extraction is correct.
- Relational retrieval is explainable and proportionate to the pilot corpus.
- The generic fact model can serve later vertical templates.
- File, vector, and live-web complexity is postponed until evidence supports it.

### Negative

- Owners and operators must review and correct proposed facts during onboarding.
- The product may abstain more often when information is missing or expired.
- Document-heavy partners initially require manual transcription.
- Structured/full-text retrieval may later underperform on larger or less normalized corpora.

### Mitigations

- Ask only for missing, conflicting, expired, or campaign-required facts.
- Show source excerpts and concise diffs during verification.
- Measure owner/operator onboarding time and retrieval misses.
- Keep future document and vector capabilities behind explicit ports and evaluations without implementing them early.

## Revisit triggers

Revisit this ADR when one or more of the following has evidence:

- multiple design partners cannot complete onboarding efficiently without governed document import;
- accepted retrieval evaluations show material misses from structured/full-text retrieval;
- the verified corpus grows enough that current retrieval violates latency or quality targets;
- a new vertical requires a governed source type not expressible through structured entry or the approved domain;
- the product proposes using live external facts, conversation learning, or automated verification.

Any revisit that expands authoritative sources, files, or vector retrieval requires an accepted amendment or successor ADR plus privacy, safety, and evaluation controls.

## Related decisions

- OD-001: generic core with a versioned yoga pilot pack
- OD-010: AI proposes; authorized humans approve exact material
- OD-020 / ADR-0020: external booking provider remains scheduling system of record
- OD-025: PostgreSQL, object storage, audit, and persistence tooling
- OD-026: AI grounding and evaluation thresholds
- OD-027: privacy, retention, deletion, and residency
- OD-029: claims, language, and accessibility obligations
