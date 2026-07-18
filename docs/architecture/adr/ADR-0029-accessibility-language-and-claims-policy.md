# ADR-0029: Accessibility, language, and claims policy

- **Status:** Accepted under founder-delegated product/technical direction
- **Date:** 14 July 2026
- **Decision:** OD-029

## Context

The first pilot is English-first in Bengaluru and creates web UI, hosted forms, campaign copy, Instagram assets, and private reply drafts. Accessibility defects would exclude owners and leads and become expensive to retrofit. Yoga and wellness language can also drift into medical, body-image, guaranteed-result, credential, price, or misleading scarcity claims. Automated review can catch known patterns but cannot determine legal truth or substantiation.

## Decision

### Accessibility

Target **WCAG 2.2 Level AA** for the product UI and hosted campaign pages/forms. Use semantic HTML and native controls first; complete keyboard operation; visible/non-obscured focus; logical headings/landmarks; accessible names, descriptions, errors, status announcements, and authentication; minimum contrast; 200% text resize and 400%/320-CSS-pixel reflow; target-size compliance; reduced-motion support; no color-only meaning; and no unnecessary time limits.

Generated social templates are not described as WCAG-conformant pages, because the destination platform is outside product control. They must nevertheless enforce readable text sizing, contrast, no color-only meaning, plain-text/caption equivalents, and a reviewed alt-text suggestion. Critical offer, price, date, location, qualification, and CTA information must also exist as real text in the accessible hosted page/caption—not only as pixels.

Automated lint/axe/contrast checks block known failures, but release also requires keyboard-only and screen-reader smoke tests on onboarding, Business Brain verification, campaign review/approval, hosted lead form, lead worklist, booking handoff, pause/takeover, and outcome reporting. Every material accessible-component exception has an owner and expiry; it cannot be waived by an AI score.

### Language

The initial product, generated content, private draft, support, consent, and legal workflow is English-first, with `en-IN`, INR, and `Asia/Kolkata` formatting where applicable. Store language/locale explicitly in generic core records.

The product does not claim automated translation or multilingual quality in the MVP. An owner may supply non-English text, but a named fluent human must review it, it must retain a language tag and approval evidence, and the corresponding consent/offer/price/CTA meaning must be verified. AI must not silently translate legal, consent, safety, price, or health-related text. A future generated language requires its own vertical/locale fixtures, claims review, accessibility QA, and accepted evaluation threshold.

### Claims

Every objective claim must point to an approved Business Brain fact or separately retained substantiation. Price and offer statements must include material conditions. The yoga vertical pack blocks, at minimum:

- diagnosis, prevention, treatment, cure, rehabilitation, pain-relief, mental-health, or other medical/therapeutic claims unless a later regulated policy and legal review explicitly allow them;
- guaranteed attendance, enrollment, fitness, weight, flexibility, pregnancy, injury, recovery, or wellbeing results;
- unsubstantiated superiority, “best/number one,” evidence/research, popularity, accreditation, instructor credential, safety, capacity, urgency, or scarcity claims;
- body shaming, fear/exploitation of illness or inadequacy, unsafe poses/practices, and fabricated before/after or result imagery;
- testimonials, customer/instructor likenesses, premises, or third-party names without recorded permission and accurate context; and
- hidden fees, misleading “free” language, omitted eligibility, fake deadlines, or ambiguity about what the introductory offer includes.

AI and deterministic checks classify each claim as supported, hypothesis/internal-only, prohibited, or requiring owner/legal review. Prohibited and unsubstantiated objective claims block readiness. A named owner approves the exact final artifact and its evidence. Owner approval does not override a mandatory policy failure and does not transfer legal responsibility to the software. The product does not promise that automation alone establishes legal compliance; the accepted OD-033 gate requires counsel-validated terms, disclosures, evidence, and review responsibility before live operation.

The generic core provides versioned claims-policy hooks and evidence types. Yoga rules live only in the first vertical pack. A future regulated vertical requires a separate compliance decision and cannot inherit the yoga rule set as sufficient.

## Consequences

- Accessibility is a release property rather than a cleanup task.
- English-first limits initial reach but avoids unsafe automatic translation claims.
- Conservative health/fitness rules may reject acceptable copy and require human review, but materially reduce misleading or harmful advertising risk.
- The agency and customer retain explicit review responsibilities; the product supplies evidence and blocking controls, not legal certification.

## Rejected alternatives

- **Automated accessibility checks only:** unable to verify focus order, screen-reader meaning, workflow usability, or platform output.
- **English plus automatic Hindi/Kannada generation:** insufficient evaluation and fluent review capacity for the initial pilot.
- **Owner approval as the only claims control:** does not prevent repeatable misleading output and does not remove agency responsibility.
- **One global claims list:** fails the generic-core requirement and cannot safely cover regulated verticals.

## Verification

- CI runs automated accessibility checks on components and critical pages.
- Each release executes the documented keyboard/screen-reader smoke set.
- Template tests enforce contrast, text-safe areas, caption/plain-text equivalents, and alt-text review state.
- Golden/adversarial claim cases meet ADR-0026's zero-tolerance release gate.
- A claim-evidence report shows the exact rule, source/substantiation, reviewer, artifact version, and decision.

## Official references checked

- [W3C Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/)
- [Advertising Standards Council of India Code](https://www.ascionline.in/the-asci-code/)
