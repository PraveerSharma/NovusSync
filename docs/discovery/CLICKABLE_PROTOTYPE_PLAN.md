# Clickable-Prototype Plan

**Status:** [Synthetic prototype built](../../prototype/README.md); five eligible-owner tests still pending.  
**Purpose:** Test whether five eligible owners understand and trust the core workflow before application scaffolding.  
**Boundary:** Disposable prototype only. No backend, authentication, provider account, real Lead data, analytics, AI call, or production code.

## 1. Questions the prototype must answer

1. Can an owner understand what the product does in under two minutes?
2. Can the owner verify business facts without feeling that the system is inventing them?
3. Is exact content approval clear, including what changes require reapproval?
4. Is the manual Instagram/WhatsApp boundary honest and usable?
5. Can the owner follow one Lead from campaign source through booking to verified attendance?
6. Can the owner see uncertainty, missing evidence, operator work, pause, opt-out, and takeover?
7. Does the weekly summary lead to a credible next action rather than vanity metrics?

## 2. Synthetic scenario

Use a clearly fictional business, `Nila Yoga Studio`, with two Bengaluru locations, three instructors, one introductory three-class pass, one external hosted booking route, and invented aggregate data. Use fictional names and `example.com` contact details only.

## 3. Minimum screens

| Screen | What the owner must be able to do |
|---|---|
| Start / campaign overview | Understand the 28-day cycle, one offer, one outcome, current readiness, owner actions, and operator actions |
| Verified Business Brain | Review source-labelled facts, correct a fact, and see that unsupported facts are not used |
| Campaign proposal | Review audience, offer, CTA, qualification rules, six content items, hosted form, WhatsApp playbook, and limitations |
| Exact approval | Compare versions, see blocking claim/fact issues, approve one exact version, or request a change |
| Manual publication queue | See what a named human must publish, on which Instagram account, when, and what evidence is still missing |
| Lead and qualification | See source/consent, response timing, qualification evidence, manual WhatsApp state, opt-out/takeover, and uncertainty |
| Booking and attendance | Open the authoritative external booking route, record/reconcile booked state, and verify attended/no-show without inference |
| Weekly learning | See funnel numbers, missing evidence, owner/operator time, trust incidents, limitations, and one proposed experiment |

## 4. Five test tasks

1. Find and correct an incorrect introductory-offer fact before it reaches content.
2. Review a changed Instagram carousel and explain which exact version is approved.
3. Explain how the first publication and WhatsApp reply will happen, including who performs them.
4. Find why one Lead is marked `uncertain`, record an opt-out, and explain how that differs from owner takeover and a campaign-wide pause.
5. Verify one attended trial, inspect the no-show/cancelled correction choices, and choose whether to accept, reject, or defer the proposed next experiment.

## 5. Test record

For each owner, capture participant code, task completion, time, wrong turn, requested assistance, expectation mismatch, trust concern, missing step, objection, severity, and whether the issue requires design change, scope change, explanation, or explicit acceptance.

Do not coach the interface. If the participant asks what a label means, record the confusion before answering.

## 6. Prototype pass rule

- Five eligible owners complete the test.
- Material confusion, missing steps, and assistance are recorded, not averaged away.
- No unresolved issue makes exact approval, manual-channel responsibility, consent/opt-out, attendance evidence, or owner control misleading.
- A polished look cannot compensate for a misunderstood workflow.

## 7. Build recommendation

The static, keyboard-usable [prototype](../../prototype/README.md) now lives under `prototype/` with local CSS/JavaScript and synthetic fixtures. It uses native controls, visible focus, no animation, one accent color, explicit manual/provider boundaries, owner takeover/campaign-pause controls, and separate attended/no-show/cancelled evidence with superseding corrections. Five eligible-owner tests, issue capture, and disposition remain required before `G0-08` can pass.
