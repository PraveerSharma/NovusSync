# ADR-0022: Template-First Creative and Media Pipeline

## Status

Accepted — founder, 14 July 2026

## Context

Each accepted `CU-01` campaign produces four Instagram single-image posts and two carousels, plus related landing/form and manual WhatsApp material. Customer approval under OD-010 applies to an exact material version, so the visual pipeline must reproduce the same pixels and factual content after review. It must also remain generic across future vertical packs.

Fully generated finished images may misspell text, alter prices, distort logos, invent people or premises, depict unsafe anatomy, or imply unsupported results. A Canva integration or embedded free-form editor would add permission, synchronization, version, and approval-authority problems before design workflow demand is known. Video would expand the campaign unit into scripting, footage, audio/music rights, captions, rendering, storage, and substantially harder review.

## Options considered

| Option | Benefits | Costs and risks | Appropriate when |
|---|---|---|---|
| Copy-only output | Smallest implementation | Does not deliver the accepted visual campaign unit | Visual production remains entirely a service |
| Deterministic template rendering | Exact text, dimensions, branding, reproducibility, and testability | Narrower visual variety; template-design work | Approval and factual correctness matter |
| Fully AI-generated finished creative | High apparent variety and low manual layout effort | Text/logo/fact hallucination, visual misrepresentation, weak reproducibility | Non-factual exploratory concepts only |
| Templates plus approved photos/decorative generation | Reliable facts with controlled visual variety | Media rights, provenance, review, and crop handling | The pipeline can separate factual overlays from imagery |
| Canva integration or free-form editor | Familiar rich editing | OAuth/permissions, external state, version drift, sync, and large editor scope | Repeated partner/operator demand justifies it |
| Video pipeline | Richer channel formats | Production, rights, storage, rendering, accessibility, and review complexity | Static campaign evidence has already validated the loop |

## Decision

### 1. Typed creative proposal

AI produces a typed proposal containing copy fields, caption, CTA, layout/template intent, media brief, and source references. It does not directly authorize or publish a finished asset. Every factual assertion must resolve to the verified Business Brain snapshot accepted by ADR-0021.

### 2. Deterministic renderer

A versioned deterministic template renders all authoritative elements:

- headline, body, offer, price, date, location, CTA, and disclaimer;
- business name, approved logo, colours, typography tokens, and dimensions;
- slide order, safe areas, text fitting, contrast metadata, and output format.

The render input is a canonical manifest. The output stores the renderer/template versions, source-media references, dimensions, checksum, and immutable content/Business-Brain versions. The same manifest and pinned renderer assets must reproduce the approved output.

The UI permits controlled changes such as choosing an allowed template, editing structured copy, selecting approved colour/type tokens, choosing or replacing media, and adjusting crop/focal point. It does not include a general drag-and-drop or vector-design editor.

### 3. Media sources

The MVP may use:

1. customer-supplied media explicitly approved for the campaign;
2. licensed media with source and rights metadata; and
3. optional AI-generated non-factual backgrounds, textures, patterns, or illustrations that pass human review.

Generated media cannot carry authoritative text or logos and cannot be presented as an actual studio, location, instructor, customer, result, testimonial, or documented event. For the yoga pack, realistic generated people or technically meaningful poses are excluded initially because anatomical or instructional errors can create false representation and safety risk.

Uploaded and generated media records source, owner/licence or model/provider/prompt/version details where available, capture/generation time, restrictions, checksum, review status, and supersession history. Metadata does not substitute for legal rights review under OD-029/OD-033.

### 4. Exact approval and manual publication

Every change to copy, template, style token, crop, source media, generated media, renderer version, or output produces a new material version. Approval and manual Instagram occurrence authorization bind to the exact canonical manifest and output checksum under OD-010/ADR-0019. An externally modified asset must be re-imported as a new version and re-approved; it never silently replaces the approved output.

### 5. Generic core and vertical packs

The core owns generic `CreativeProposal`, `Template`, `BrandTokenSet`, `MediaAsset`, `RenderManifest`, `RenderedAsset`, `MaterialVersion`, provenance, and approval contracts. A vertical pack supplies themes, layouts, vocabulary, content constraints, prohibited depictions, and evaluation fixtures. Yoga-specific layout or claim behavior cannot enter the generic rendering domain.

### 6. Deferred scope

Canva or another external editor, a free-form design editor, and video generation/rendering are outside the MVP. The exact HTML/SVG/React/browser/image-processing implementation is selected with OD-037, subject to the deterministic manifest and reproducibility contract here.

## Invariants

- Authoritative text, prices, dates, locations, logos, CTAs, and disclaimers are deterministic overlays, never trusted from generated pixels.
- A rendered asset cannot use unverified campaign-critical facts.
- Generated media cannot impersonate or document a real customer, employee, premises, event, or result.
- Every source and output asset has provenance, version, checksum, review status, and Workspace scope.
- Any pixel-affecting change creates a new version and invalidates prior occurrence authorization.
- The product never represents an external edit or manual publication as the exact approved output without matching evidence.

## Consequences

### Positive

- Factual and brand-critical elements remain exact and reproducible.
- Approval fingerprints and manual-publication evidence have a stable target.
- Curated templates make accessibility and dimension checks testable.
- Approved photography and optional decorative generation provide controlled variety.
- The generic renderer can support later vertical theme packs.

### Negative

- Early output may look more templated than bespoke agency design.
- Templates, responsive text fitting, and brand-token QA require design/engineering work.
- Media rights and generated-asset review remain human responsibilities.
- Excluding Canva and video may disappoint partners expecting a full creative suite.

### Mitigations

- Ship several curated layout families and compose variety through approved media, typography, palette, and crop choices.
- Measure operator correction time, rejection reasons, and out-of-product editing.
- Treat externally corrected assets as governed new versions.
- Revisit richer editing only after repeated demand and workflow evidence.

## Revisit triggers

Revisit this ADR when:

- design-partner rejection or operator work shows the curated templates cannot meet acceptable campaign quality;
- several partners require Canva or another editor and exact-version synchronization can be designed safely;
- video becomes necessary for a validated channel/outcome experiment rather than a feature-parity goal;
- deterministic reproduction cannot be maintained by the selected OD-037 renderer;
- legal, platform, accessibility, or generated-media rules materially change the permitted asset boundary.

Any expansion requires an accepted amendment or successor ADR and preserves exact-version approval.

## Related decisions

- OD-010: typed proposals and exact customer approval
- OD-011: `CU-01` content quantity and lifecycle
- OD-018/OD-019 / ADR-0019: manual Instagram and WhatsApp execution
- OD-021 / ADR-0021: verified Business Brain grounding
- OD-026: AI safety and evaluations
- OD-029: accessibility, language, and claims
- OD-033: platform, legal, and subprocessor readiness
- OD-037: exact rendering and engineering toolchain
