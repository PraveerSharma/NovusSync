# Field-Week Evidence Handoff

**Purpose:** Give the product team enough coded information to analyse the founder's research without copying private identities or customer data into Git or chat.  
**Use when:** The founder completes the first week of studio-owner outreach and interviews.  
**This is a checkpoint:** Completing the interview week does not by itself pass Gate G0.

## 1. Information that stays in restricted Google Drive

Do not send or commit:

- owner/studio names, phone numbers, email addresses, or personal social profiles;
- raw interview notes, recordings, transcripts, or private evidence links;
- customer/Lead identities, messages, health details, booking exports, or screenshots;
- passwords, access details, account identifiers, recovery information, or tokens;
- signatures, legal correspondence, invoices, deposit/payment references, or tax records.

Use only codes such as `STU-001` and `INT-001` in the handoff.

## 2. Safe aggregate summary

Copy and complete this block when returning:

```text
Research period:
Prospects approached:
Warm introductions requested:
Owners/decision-makers reached:
Included unique eligible studios/owners:
Eligible rows explicitly excluded:
Ineligible conversations excluded:
Declines/opt-outs:

Pain 1 YES:
Pain 2 YES:
Both pains YES:
Eligible denominator:
Both-pain percentage:

Interviews with usable four-week baseline:
Interviews adding a new material finding:
Last interview that added a material finding:
Findings currently stable: YES / NO / UNCERTAIN

Strong partner candidates:
Prototype-test candidates:
Manual-workflow candidates:
Verbal price interest:
Concrete readiness follow-ups accepted:
Signed commitments: 0 unless properly reviewed and completed
Paid/deposit-backed commitments: 0 unless properly reviewed and completed

Fatal contradictions found:
Unresolved material contradictions:
Founder recommendation: CONTINUE / REWORK / STOP / UNCERTAIN
```

Do not calculate the both-pain percentage using all prospects approached. The denominator is all **included unique eligible studio-owner records**, including eligible owners who have neither pain. One `studio_code` represents one owner-operated business across all locations and may enter the denominator only once. Ineligible contacts and explicitly excluded eligible follow-ups are listed separately.

Never exclude an eligible `NO` merely because it lowers the rate. `denominator_exclusion_reason` is limited to `DUPLICATE_STUDIO_FOLLOW_UP`, `PROTOCOL_DEVIATION`, or `INSUFFICIENT_PRIVATE_EVIDENCE`; the founder must privately substantiate every exclusion.

## 3. Safe coded interview rows

Use [the redacted handoff CSV](templates/redacted_handoff.csv) or provide a table with these fields:

| Field | Allowed content |
|---|---|
| Interview and studio codes | `INT-###` and `STU-###` only |
| Interview sequence | Positive integer in the order conversations were completed; the stability check uses this order |
| Eligibility | `ELIGIBLE` or `INELIGIBLE`; every ineligible row requires a short non-identifying `eligibility_reason_category` token |
| Denominator exclusion | Blank for an included eligible row. Use only `DUPLICATE_STUDIO_FOLLOW_UP`, `PROTOCOL_DEVIATION`, or `INSUFFICIENT_PRIVATE_EVIDENCE` for a reviewed excluded eligible row. Leave blank for ineligible rows. |
| Pain 1 / Pain 2 | `YES` or `NO`, based on behavioral evidence |
| Baseline | `USABLE`, `PARTIAL`, `NONE`, or `UNKNOWN` |
| Willingness stage | `NONE`, `VERBAL_INTEREST`, `CONCRETE_NEXT_STEP`, `SIGNED`, or `PAID_OR_DEPOSIT_BACKED` |
| New material finding | `YES` or `NO` |
| Counter-evidence | Short de-identified summary |
| Contradiction | Supply category, severity, and disposition together, or leave all three blank. Category is `MARKET`, `WORKFLOW`, `PLATFORM`, `PRIVACY`, `COMMERCIAL`, `BOOKING`, or `OUTCOME`. |
| Candidate flags | Partner, prototype test, and manual workflow: `YES`, `NO`, or `MAYBE`; all three are required for every eligible row |

Private evidence references stay in Drive. If the product team needs to audit a classification, the founder can inspect the source privately and provide a de-identified explanation.

## 4. Material findings summary

Report each distinct finding once:

| Finding code | Supports or challenges hypothesis | Studios affected | Behavioral evidence summary | Product implication | Confidence |
|---|---|---:|---|---|---|
| `FNDG-001` | | | | | |

Confidence means strength of the observed evidence, not certainty about the whole market. A small design-partner cohort cannot establish broad market prevalence.

## 5. Contradiction log

Do not bury contradictions inside positive summaries.

| Code | Category | What contradicts the plan | Studios affected | Severity | Status | Proposed disposition |
|---|---|---|---:|---|---|---|
| `CTR-001` | Market / workflow / platform / privacy / commercial / booking / outcome | | | Low / Medium / High / Fatal | Open / Mitigated / Accepted / Rejected | |

A fatal contradiction blocks Gate G0 until the product is reworked or the founder records `NO-GO`. “Later” is not a disposition.

## 6. Analysis performed after handoff

When the coded packet is returned, the product review will:

1. verify interview eligibility, one included row per studio-owner code, explicit exclusions, and denominator integrity;
2. calculate the dual-pain numerator, denominator, and percentage;
3. distinguish behavior from opinion and interest from commitment;
4. check whether findings stabilized after interview 10 or whether interviews should continue toward 20;
5. group current workflows, booking routes, evidence gaps, objections, and access burdens;
6. identify the best partner, prototype-test, and manual-workflow candidates;
7. disposition contradictions or reopen the affected product decision;
8. recommend `CONTINUE`, `REWORK`, or `STOP` for the next discovery stage; and
9. update Gate G0 rows without marking any unearned `PASS`.

The dependency-free [offline handoff checker](../../scripts/discovery/analyze_handoff.rb) validates the redacted schema and performs the first denominator calculation. It rejects duplicate included eligible studio codes, missing ineligible reasons or eligible candidate flags, incomplete/unknown contradiction triples, and malformed CSV. Total and open high/fatal contradictions are reported across all coded rows, including ineligible or explicitly excluded rows:

```sh
ruby scripts/discovery/analyze_handoff.rb path/to/redacted_handoff.csv
```

Its output is a checkpoint recommendation only. A human still reviews behavioral evidence, exclusions, free-text privacy, contradictions, and all remaining Gate G0 rows. A [fictional example](examples/README.md) is available for rehearsal.

Run the synthetic regression suite after changing the checker or handoff schema:

```sh
ruby scripts/discovery/test_analyze_handoff.rb
```

The suite and its fixtures are tooling tests only. They are never customer evidence.

## 7. What happens after a positive interview checkpoint

If the interview evidence passes its threshold and no fatal contradiction appears, the next discovery stage is:

1. confirm five serious design-partner candidates;
2. run five eligible-owner prototype tests;
3. observe two studio-controlled manual workflows;
4. verify baseline/channel/booking/attendance readiness for at least three partners;
5. complete appropriate legal/accounting review before signatures or money;
6. obtain five signed two-cycle commitments and at least two paid or fully credited deposit-backed commitments; and
7. complete the Gate G0 contradiction review and founder decision.

See the [post-research decision tree](POST_RESEARCH_DECISION_TREE.md) for every branch.
