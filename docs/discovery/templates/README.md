# Private Google Sheet Templates

These files contain blank schemas only. Import each CSV into a separate tab in the restricted discovery Google Sheet.

| CSV | Google Sheet tab | Contains private data after use? |
|---|---|---|
| `prospects.csv` | `Prospects` | Yes: business identity, owner, contact route, outreach history |
| `outreach_events.csv` | `Outreach Events` | Yes: human outreach activity, route, outcome, and private evidence links |
| `interviews.csv` | `Interviews` | Yes: coded findings and private evidence links; notes may identify participants |
| `partner_readiness.csv` | `Partner Readiness` | Yes: commitment, baseline, access, legal, and payment references |
| `prototype_tests.csv` | `Prototype Tests` | Yes: participant-coded usability observations |
| `manual_workflows.csv` | `Manual Workflows` | Yes: studio-coded operational observations and private evidence links |
| `g0_summary.csv` | `G0 Summary` | Aggregate/coded only; this is the only tab suitable for a redacted repository summary |
| `redacted_handoff.csv` | `Redacted Handoff` | No direct identity fields by design; review every free-text cell before sharing |

## Import

1. Create the restricted Google Sheet described in the [founder playbook](../FOUNDER_RESEARCH_PLAYBOOK.md#4-private-google-drive-and-sheet-setup).
2. In Google Sheets, choose `File` → `Import` → `Upload`.
3. Import each CSV into a new sheet.
4. Rename the tab using the table above.
5. Freeze the header row and enable a filter.
6. Restrict access to the founder and named operators. Use separate restricted documents/folders for legal agreements, signatures, invoices, deposits, account evidence, and counsel notes.

Then follow the [G0 outreach operating pipeline](../G0_OUTREACH_OPERATING_PIPELINE.md) to add the coded `Action Queue`, dropdown values, internal capture forms, and filter views. `Outreach Events` is an append-only activity log: correct an error with a new correction event rather than deleting a decline, opt-out, or exhausted follow-up.

Use the [Gate G0 outcome rule](../OUTCOME_DEFINITION_AND_EXAMPLES.md) when classifying bookings and attended trials. Do not create a separate spreadsheet-only definition.

## Rules

- Replace no headers unless the repository template is versioned at the same time.
- Use `STU-###`, `INT-###`, `PT-###`, and `MW-###` codes in summaries.
- Treat one `STU-###` as one owner-operated business across all locations. Only one eligible row per studio code may enter the interview denominator.
- Leave `denominator_exclusion_reason` blank for an included eligible row. A reviewed excluded eligible row may use only `DUPLICATE_STUDIO_FOLLOW_UP`, `PROTOCOL_DEVIATION`, or `INSUFFICIENT_PRIVATE_EVIDENCE`; never exclude an eligible `NO` to improve the result.
- Require a non-identifying `eligibility_reason_category` for every ineligible row and all three candidate flags for every eligible row.
- Supply contradiction category, severity, and disposition together or leave all three blank. Allowed categories are `MARKET`, `WORKFLOW`, `PLATFORM`, `PRIVACY`, `COMMERCIAL`, `BOOKING`, and `OUTCOME`.
- Store names, contact details, URLs, notes, signatures, payment references, and evidence links only in the private Sheet/Drive.
- Never paste passwords, recovery codes, tokens, raw customer chats, full Lead exports, or health information.
- Use ISO dates `YYYY-MM-DD` and `Asia/Kolkata` times.
- Allowed status values should be applied through Google Sheet dropdown validation where practical.
- `Prospects.pipeline_stage` uses only the stages in the [operating pipeline](../G0_OUTREACH_OPERATING_PIPELINE.md#3-one-studio-one-state).
- `Outreach Events.channel` uses `REFERRAL`, `EMAIL`, `INSTAGRAM_DM`, `WHATSAPP_BUSINESS_APP`, `PHONE`, or `OTHER_HUMAN`.
- `Outreach Events.event_type` uses `WARM_INTRO_REQUESTED`, `WARM_INTRO_RECEIVED`, `FIRST_CONTACT_SENT`, `FOLLOWUP_1_SENT`, `FOLLOWUP_2_SENT`, `REPLY_RECEIVED`, `INTERVIEW_SCHEDULED`, `DECLINED`, `OPT_OUT_RECORDED`, `NO_RESPONSE_CLOSED`, `BRIEF_SHARED`, `READINESS_CALL_SCHEDULED`, or `CORRECTION_RECORDED`.
- Every outreach event is performed and recorded by a human. A Sheet, Form, notification, formula, CRM, or script must never send the external message.
- Use `redacted_handoff.csv` when returning coded interview results to the product team. Do not copy private evidence links or identifying details into its summary fields.
- Run the [offline handoff checker](../../../scripts/discovery/analyze_handoff.rb) only after reviewing every free-text cell for identifying information.
- After changing the redacted schema or checker, run `ruby scripts/discovery/test_analyze_handoff.rb`; all fixtures are fictional tooling tests and never Gate G0 evidence.
