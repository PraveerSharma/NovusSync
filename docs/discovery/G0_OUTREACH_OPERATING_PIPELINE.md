# Gate G0 Outreach and Evidence Operating Pipeline

**Status:** Ready for founder setup and field execution  
**Owner:** Founder  
**System of record:** Founder-approved restricted Google Drive and Google Sheet  
**Tool decision:** Use the Google workspace for Gate G0; do not activate Kommo or another CRM integration for this gate  
**Evidence status:** This pipeline organizes work. It does not itself pass any Gate G0 row.

## 1. Outcome and hard boundary

Use one private operating pipeline to move a studio from a sourced candidate to an honestly dispositioned Gate G0 record. Automate capture, validation, coded queues, internal notifications, scheduling after a reply, and aggregate calculations. Keep these actions human-owned:

- deciding whether a studio is eligible;
- sending every first message and follow-up through Gmail, Instagram, WhatsApp Business, or another approved human-operated route;
- conducting the owner interview and asking neutral follow-up questions;
- classifying behavioral evidence, counter-evidence, and contradictions;
- approving a prototype issue disposition or readiness decision;
- requesting a signature or payment after the required review;
- verifying evidence; and
- recording the founder's Gate G0 decision.

A self-completed survey can screen and schedule an owner. It cannot replace the behavioral interview, manual-workflow observation, prototype test, signed commitment, payment evidence, or founder review.

## 2. Recommended operator stack

| Need | Gate G0 tool | Rule |
|---|---|---|
| Private identity and evidence register | Restricted Google Drive and Sheet | Canonical private source; founder and two named operators only |
| Owner interest and availability | One minimal Google Form | Use after a warm introduction or include as an optional route in a human-sent message |
| Consistent operator capture | Internal Google Forms or direct Sheet entry | Operators complete these; owners do not self-score the two pains |
| Scheduling | Google Calendar/Meet or a manually agreed call | Share a booking route only after the owner replies or opts in |
| Email | Gmail templates | A human reviews, personalizes, and clicks send every time |
| Instagram and WhatsApp | Official apps/accounts | Human-only; no API, bot, bulk send, auto-DM, or shared password |
| Daily work queue | Coded `Action Queue` Sheet tab | Formula-driven; never sends an external message |
| Interview checkpoint | `scripts/discovery/analyze_handoff.rb` | Runs locally on a redacted coded export |
| Final evidence audit | `G0 Summary` plus human evidence review | Every `G0-01`–`G0-12` row must pass before founder `GO` |

The [current tool research](../research/G0_OUTREACH_TOOL_RESEARCH_2026-07-15.md) explains why Kommo and the alternatives are not the default for this gate.

## 3. One studio, one state

The `Prospects.pipeline_stage` field uses exactly one of these values:

| Stage | Entry evidence | Required next action | Exit |
|---|---|---|---|
| `RESEARCH` | Candidate found | Verify public eligibility indicators and decision-maker route | `READY_TO_CONTACT` or `INELIGIBLE` |
| `READY_TO_CONTACT` | Route and owner hypothesis recorded | Founder/operator reviews the correct message | `CONTACTED` |
| `CONTACTED` | Human sent first message | Wait for reply or due date | `REPLIED`, `DECLINED`, `OPTED_OUT`, or `FOLLOWUP_DUE` |
| `FOLLOWUP_DUE` | No reply and approved date reached | Human sends follow-up 1 or final follow-up | `CONTACTED`, `REPLIED`, `OPTED_OUT`, or `CLOSED_NO_RESPONSE` |
| `REPLIED` | Owner or authorized contact replied | Confirm authority/eligibility and agree a time | `SCHEDULED`, `INELIGIBLE`, or `DECLINED` |
| `SCHEDULED` | Calendar record exists | Conduct the behavioral interview | `INTERVIEWED` or reschedule/close honestly |
| `INTERVIEWED` | Complete private interview row exists | Score immediately from behavior; record counter-evidence | `SCORED` |
| `SCORED` | Eligibility and all required coded fields complete | Choose the evidence-backed branch | `CLOSED_RESEARCH`, `PROTOTYPE_CANDIDATE`, `WORKFLOW_CANDIDATE`, or `PARTNER_CANDIDATE` |
| `PROTOTYPE_CANDIDATE` | Eligible owner agrees to a test | Complete the five-task synthetic test | `PROTOTYPE_TESTED` |
| `WORKFLOW_CANDIDATE` | Eligible studio agrees to observation | Complete governed studio-controlled workflow observation | `WORKFLOW_OBSERVED` |
| `PARTNER_CANDIDATE` | Strong interview and concrete next step | Share brief, then complete readiness review | `READINESS_REVIEW` or `CLOSED_RESEARCH` |
| `READINESS_REVIEW` | Candidate is reviewing exact requirements | Verify baseline, channels, booking, outcome, capacity, support, and blockers | `COMMITMENT_READY` or `NOT_READY` |
| `COMMITMENT_READY` | Required review route exists and candidate remains eligible | Complete approved participation and payment steps | `SIGNED`, then `PAID_OR_DEPOSIT_BACKED` when earned |
| `PROTOTYPE_TESTED` | Complete prototype-test record exists | Disposition material issues and choose the next evidence branch | Another active branch or `CLOSED_RESEARCH` |
| `WORKFLOW_OBSERVED` | Complete manual-workflow record exists | Review failures, workload, evidence, and contradictions | Another active branch or `CLOSED_RESEARCH` |
| `SIGNED` | Approved two-cycle participation commitment exists | Finish readiness and approved payment/deposit step | `PAID_OR_DEPOSIT_BACKED`, `NOT_READY`, or another active branch |
| `PAID_OR_DEPOSIT_BACKED` | Approved payment/deposit evidence exists | Finish any remaining readiness, prototype, or workflow evidence | Another active branch or `CLOSED_RESEARCH` |
| `NOT_READY` | Candidate fails a current readiness requirement | Record the specific blocker and close this candidacy | Terminal unless new evidence justifies a reviewed reopen |
| `CLOSED_RESEARCH` | No agreed next research step remains | Retain only approved records for the required period | Terminal |
| `INELIGIBLE` | Eligibility failure recorded | Close; do not include in denominator | Terminal |
| `DECLINED` | Decline recorded | Stop contact immediately | Terminal |
| `OPTED_OUT` | Opt-out recorded | Stop contact immediately | Terminal |
| `CLOSED_NO_RESPONSE` | Two follow-ups exhausted | Stop contact | Terminal |

Prototype, workflow, and partner work are parallel evidence branches, not a single sales funnel. A studio can hold candidate flags for more than one branch while `pipeline_stage` reflects the next immediate owner action.

## 4. Automate the work around judgment

### Allowed now

- Generate the next `STU-###`, `INT-###`, `PT-###`, and `MW-###` code.
- Apply dropdown validation and reject invalid statuses.
- Show coded rows with `next_action_date <= TODAY()` in an internal action queue.
- Notify the internal team that an owner submitted the interest form; a human decides what to do.
- Create a Calendar event or allow an opted-in owner to choose an interview time.
- Calculate funnel totals, the dual-pain numerator/denominator, and finding stability flags.
- Flag missing fields, duplicate included studio codes, overdue actions, exhausted follow-ups, and open contradictions.
- Produce a coded/redacted handoff for offline checking after a human privacy review.

### Never automate for Gate G0

- Scraping or enriching private owner contact details.
- Cold bulk email, mail merge, sequences, automated follow-ups, or engagement tracking.
- Instagram comment/DM automation, Meta OAuth/API, or Salesbot behavior.
- WhatsApp API/BSP, templates, broadcasts, bot replies, or automated marketing.
- AI deciding whether an interview proves a pain, whether a contradiction is acceptable, or whether a gate passes.
- Copying owner identities, raw messages, signatures, payment records, or customer/Lead data into Git, ordinary chat, analytics, or AI tools.

## 5. Google Form blueprints

### Form A — owner interest and scheduling

**Title:** `Bengaluru Yoga Studio Owner Research — 25–30 minutes`

**Opening copy:**

> We are researching how independent Bengaluru yoga studios handle Instagram or WhatsApp enquiries, trial booking, and attendance before building a product. This is not a sales demo and there is no promise of Leads or results. Please do not share customer names, messages, health information, passwords, or account details. We use your response only to check fit and arrange the research conversation. [Insert founder contact, privacy/withdrawal route, retention statement, and reviewed notice link before publishing.]

Questions:

1. Your name — short answer, required.
2. Studio/business name — short answer, required.
3. Bengaluru area — short answer, required.
4. Are you the owner or final decision-maker for marketing and customer follow-up? — `YES`, `NO`, `SHARED AUTHORITY`, required.
5. Does the studio offer a trial class, introductory pass, consultation, or another attended first experience? — `YES`, `NO`, required.
6. How are trial bookings handled today? — `BOOKING LINK/PROVIDER`, `PHONE/WHATSAPP`, `MANUAL REGISTER`, `OTHER`, required.
7. Preferred contact route for arranging the conversation — `EMAIL`, `INSTAGRAM`, `WHATSAPP BUSINESS`, `PHONE`, required.
8. Contact detail for that route — short answer, required.
9. Two or three suitable 25–30 minute windows in Asia/Kolkata — paragraph, required.
10. May we use these details to contact you about this research conversation and its directly related follow-up? — `YES`, required to submit.
11. Any communication or scheduling preference, such as phone rather than video? — paragraph, optional; instruct respondents not to include medical, health, or customer data.

Settings:

- Do not request file uploads.
- Do not ask for customer counts, screenshots, exports, raw messages, or passwords.
- Do not expose the response summary to respondents.
- Do not add product marketing consent to this form.
- Use one neutral confirmation message: `Thank you. A human will review the fit and contact you through your chosen route. This submission is not a pilot commitment.`
- Send no CRM sequence, bulk reply, or automated external follow-up.

This form is a convenience, not the primary evidence instrument. A personal reply with a scheduling choice is also valid and may be lower friction.

### Form B — internal interview capture

Create an operator-only form whose fields map one-for-one to `templates/interviews.csv`. Use sections for eligibility, recent campaign/enquiry behavior, both-pain evidence, baseline, willingness, counter-evidence, contradictions, and next action. The operator completes it immediately after the conversation. Keep evidence links private.

Required logic:

- if `eligibility_result = INELIGIBLE`, require the reason and stop before pain scoring;
- if `eligibility_result = ELIGIBLE`, require both pain results, baseline status, willingness stage, all candidate flags, and next action;
- never let the form compute `YES` from a rating or keyword;
- require a contradiction disposition when `fatal_contradiction = YES`; and
- record the script version used.

### Forms C and D — internal prototype and workflow capture

Create operator-only forms from `prototype_tests.csv` and `manual_workflows.csv`. Use the existing field order. Require every task result for a prototype test and every timing/evidence/failure field for a completed workflow. No owner identity is required in these forms beyond the private code.

## 6. Google Sheet setup

Import all CSVs in [the template guide](templates/README.md), including `Outreach Events`. Add a private `Action Queue` tab with this formula in `A1` after the expanded `Prospects` schema is imported:

```gs
={"studio_code","pipeline_stage","next_action","next_action_owner","next_action_date";
  SORT(
    FILTER(
      {Prospects!A2:A,Prospects!P2:P,Prospects!AA2:AC},
      Prospects!AC2:AC<>"",
      Prospects!AC2:AC<=TODAY(),
      Prospects!V2:V="",
      Prospects!P2:P<>"DECLINED",
      Prospects!P2:P<>"INELIGIBLE",
      Prospects!P2:P<>"CLOSED_NO_RESPONSE",
      Prospects!P2:P<>"OPTED_OUT"
    ),
    5,TRUE
  )}
```

The queue shows codes only. Operators open the matching private `Prospects` row to see contact details. If no rows are due, `FILTER` may display `#N/A`; that means the queue is empty, not that outreach should be sent automatically.

Apply dropdown validation for all enumerated values. Create these private filter views:

- `Due today` — next action due, not terminal, no opt-out;
- `Needs eligibility review` — `RESEARCH` or missing eligibility;
- `Interview capture incomplete` — interviewed without a complete `INT-###` row;
- `Prototype candidates` — eligible and candidate flag `YES`/`MAYBE`;
- `Workflow candidates` — eligible and candidate flag `YES`/`MAYBE`;
- `Partner readiness gaps` — candidate with a missing baseline/channel/booking/outcome field;
- `Open contradictions` — material or fatal item without a completed disposition; and
- `Follow-up limit audit` — more than two follow-ups, any post-opt-out activity, or a missing activity event.

Use Google Sheet notifications only for internal form submissions or operator changes. Notifications never contact a studio owner.

## 7. Human outreach cadence

| Trigger | Human action | Next due date |
|---|---|---|
| Warm introduction received | Founder sends personal first message | Wait for reply; review in about 3 days |
| Public route approved | Founder/operator sends direct research message | Wait for reply; review in about 3 days |
| No reply after first contact | Human sends follow-up one after rechecking fit and opt-out state | Final review about 4 days later |
| Still no reply | Human sends final follow-up | Close if there is no reply |
| Any decline or opt-out | Record event and stop | None |
| Positive reply | Confirm owner authority and agree time | Interview |
| Completed interview | Score immediately, then send only the agreed next step | Owner and due date required |

Do not use read receipts, open tracking, or engagement scores to manufacture urgency. Low response is evidence about founder access and recruiting cost.

## 8. Fast execution sequence

### Setup and rehearsal

1. Create the restricted Drive/Sheet and import the templates.
2. Create Form A and the internal capture forms from the blueprints.
3. Save the approved outreach messages as Gmail templates without filters or auto-replies.
4. Complete the synthetic rehearsal and all five prototype tasks.
5. Founder and product lead complete the blind outcome worksheet; this can close `G0-09` before field scheduling if results are consistent.
6. Start counsel/accountant selection and review in parallel. No signature or money request proceeds on the recruitment brief alone.

### Candidate and interview batch

1. Build 25–30 candidates, warm sources first.
2. Human-review eligibility and send personal messages.
3. Target at least 15 scheduled conversations to absorb refusals, no-shows, and ineligible contacts.
4. Complete and score the first five interviews with the founder leading.
5. Continue to at least 10 included unique eligible studio-owner records.
6. Run the redacted checkpoint. Continue toward 20 while new material findings remain unstable.

### Parallel remaining evidence

After each eligible interview, route only evidence-backed candidates:

- five owners complete the synthetic prototype test;
- two eligible studios complete governed manual-workflow observations;
- serious candidates receive the design-partner brief and readiness review;
- five complete approved two-cycle commitments;
- at least three prove usable baseline plus channel/outcome/booking readiness;
- at least two complete the approved first-cycle payment or INR 1,000 credited deposit; and
- all five prove a workable manual Instagram, WhatsApp Business, and booking route.

### Gate audit

1. Review every included/excluded denominator row and free-text classification.
2. Calculate dual-pain evidence and finding stability.
3. Verify commitment, readiness, payment, workflow, prototype, outcome-rule, and feasibility evidence.
4. Disposition every material contradiction; an unresolved fatal contradiction blocks the gate.
5. Update `G0 Summary` and the repository only with coded/aggregate evidence.
6. Founder records `GO`, `REWORK`, or `NO-GO`. Only a fully passed, dated, signed `GO` authorizes synthetic/local Phase 0 scaffolding.

## 9. Daily control metrics

Review these for 15 minutes each day:

- candidates researched and eligibility-reviewed;
- warm introductions requested/received;
- first contacts and follow-ups sent by a human;
- replies, declines, opt-outs, scheduled calls, no-shows, and interviews;
- included unique eligible interviews and both-pain numerator/denominator;
- new material findings and counter-evidence;
- prototype/workflow/partner candidates and completed steps;
- signed, baseline-ready, and paid/deposit-backed counts;
- overdue actions, missing fields, follow-up-limit exceptions; and
- open privacy, platform, access, legal, payment, or commercial contradictions.

The numbers manage the work; they do not lower the evidence thresholds.

## 10. Completion truth

This pipeline is complete when it is set up and rehearsed. Gate G0 is complete only after real founder-led evidence passes all twelve rows in [the Gate G0 register](GATE_G0_EXECUTION.md), including the signed founder decision. No CRM trial, form response, scheduled interview, synthetic test, unsigned brief, unchecked box, or automated calculation can substitute for that evidence.
