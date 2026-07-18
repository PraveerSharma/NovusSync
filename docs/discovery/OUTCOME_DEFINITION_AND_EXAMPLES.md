# Gate G0 Outcome Definition and Classification Examples

**Rule ID:** `G0-OUTCOME-v1`  
**Status:** Draft complete; founder/product-lead consistency review pending  
**Pilot timezone:** `Asia/Kolkata`  
**Primary outcome:** One qualified Lead who attends the campaign's introductory yoga trial, with attendance verified by an authorized studio user or an approved source  
**Important:** A Lead, message, booking, compliment, enrollment, or payment is not proof of attendance.

## 1. Plain-language rule

Count one qualified attended introductory trial for a campaign only when all of the following are true:

1. A real person became a campaign-specific Lead through the hosted form or through an actual WhatsApp conversation that a named operator reconciled with source and consent evidence. A tracked click alone is not a Lead.
2. The Lead satisfied every mandatory criterion in the campaign's approved three-to-five-criterion qualification rule. The result is recorded as `qualified` under the exact rule version used at that time.
3. The Lead made one real booking through the studio's approved external booking route while the Lead remained inside the eligible booking window.
4. The booked appointment was scheduled no later than 14 calendar days after campaign close.
5. The prospect attended that appointment, and an authorized studio user or approved normalized provider source verified the attendance.
6. The Lead, booking, and attendance event are linked to the same campaign and introductory offer without an unresolved duplicate, source conflict, correction, or dispute.

The outcome counts once per unique campaign Lead. Enrollment, loss, revenue, and supplied value are reported separately and never redefine attendance.

## 2. Qualification rule

Each design partner must approve one transparent rule containing three to five mandatory criteria before a campaign can activate. The product cannot invent or silently change them during the campaign.

Use this default draft for field review:

| Criterion | A Lead satisfies it when | Does not satisfy it when |
|---|---|---|
| Exact-offer intent | The person is genuinely asking about or trying to book the campaign's one introductory trial offer | The request concerns another service, a job, partnership, general support, or spam |
| Serviceable route | At least one location/class/resource inside the approved provider-managed route is relevant to the person's stated need | The person needs a location, format, or service outside the approved route |
| Near-term booking intent | The person wants to take the introductory trial within the campaign's permitted booking and appointment window | The person is only browsing for an unspecified later period |
| Studio-specific fit, if needed | The person satisfies a clear, owner-approved, non-sensitive eligibility boundary that is necessary for this exact offer | The criterion is not met or its evidence is unknown |
| Safety review, if triggered | An authorized studio person has resolved any sensitive health, safety, or suitability question and recorded the decision | A sensitive answer is unresolved or requires professional judgment |

The owner may use only three or four rows when the additional rows are unnecessary. A criterion must be clear enough that two trained reviewers reach the same result from the same evidence.

The only decision states are:

- `unknown`: required answers are still missing.
- `qualified`: every mandatory criterion is satisfied.
- `unqualified`: at least one mandatory criterion is clearly not satisfied.
- `human_review_required`: a sensitive, conflicting, exceptional, or unsafe answer needs an authorized studio decision.

`unknown` and `human_review_required` do not count as qualified. An authorized owner may resolve or override a result only with a reason, actor, time, and audit record. Sensitive medical or safety judgment always stays with a qualified human; the product does not provide medical advice.

## 3. Time and eligibility rules

All deadlines use calendar days and `Asia/Kolkata`. Store the actual timestamp and timezone, not a date label alone.

| Event | Counting rule |
|---|---|
| Lead capture | Must occur before the campaign closes. A pre-close Lead keeps only the remainder of its original seven-day qualification/booking window. |
| Booking | Must occur while that Lead remains eligible: no later than seven calendar days after capture and never later than campaign close plus seven calendar days. |
| Appointment | Must be scheduled for and occur no later than campaign close plus 14 calendar days. No new appointment slot outside that boundary qualifies. |
| Attendance recording | May be entered later, but `occurred_at` determines whether the appointment was in the window. Keep `recorded_at` separately and label late evidence. |
| Natural campaign close | Stops new promotion and enrollment. It does not erase an already eligible Lead or an existing booked appointment inside the accepted tail. |
| Customer cancellation | Stops new unbooked work. An existing booked appointment may continue inside close+14. |
| Emergency stop | Suppresses all product due work and drafts. Authorized humans handle any existing appointment under the incident process; later evidence can still be recorded honestly. |

Example: if a Lead is captured on 27 July and the campaign closes on 28 July, its booking deadline is 3 August—not 4 August—because capture+7 occurs first. The appointment must still occur by 11 August, which is close+14.

## 4. Source and attribution

- The first known in-scope campaign, content, offer, route, and consent origin is immutable.
- Later form submissions, messages, clicks, or campaign touches are stored as later touches; they do not overwrite the first source.
- A tracked WhatsApp click proves a click only. It becomes a Lead only after a named human reconciles an actual conversation with sufficient source and consent evidence.
- Manual evidence may improve confidence but cannot replace an observed source with a more convenient one.
- Missing source stays `unknown`; conflicting source stays `uncertain` or `disputed` until resolved.
- Unknown or uncertain attribution is reported in a separate bucket and does not enter the verified campaign-attributed outcome count.
- The report may describe an association between the campaign and outcomes. It must not claim the campaign caused attendance or revenue.

## 5. Attendance evidence

Accepted attendance evidence is either:

1. an attendance event from the approved normalized booking/provider source with a stable appointment reference; or
2. an explicit attended/no-show/cancelled action by an authorized studio user, linked to the appointment and supported by the studio's normal attendance record or direct observation.

Every outcome event records the state, evidence source/reference, actor, `occurred_at`, `recorded_at`, rule version, appointment, Lead, and campaign.

The following do **not** prove attendance by themselves:

- booking creation or confirmation;
- reminder delivery or a WhatsApp message;
- a tracked link click;
- the prospect saying they intend to attend;
- an internal operator's assumption;
- enrollment or payment without a linked attendance record.

An authorized, reasoned correction may supersede provider or prior studio evidence. The older event remains visible.

## 6. Duplicate rule

- Repeated form submissions, messages, or clicks from the same Contact for the same campaign remain one campaign Lead with multiple touch events.
- The same Contact may have separate Leads in separate campaigns, but a later touch cannot steal the earlier Lead's source or create a second count for the same attendance.
- One appointment counts at most once, even when it appears through webhook, export, screenshot, and manual reconciliation.
- Use the provider appointment ID where available. For hosted/manual routes, use the studio reference plus person, offer, location, and start time to detect likely duplicates.
- If two records may represent the same person or appointment but the evidence is insufficient, mark them `possible_duplicate` and exclude the uncertain extra count until reviewed.
- Multiple locations, instructors, calendars, or resources do not create multiple outcomes for one appointment.

## 7. Cancellation, no-show, and reschedule rule

- `cancelled` is not attended.
- `no_show` is not attended.
- A cancelled or missed appointment may be rescheduled. If the replacement appointment is inside close+14 and attendance is verified, the Lead counts once as attended.
- A replacement appointment outside close+14 is a real business outcome but is reported outside the campaign's primary window.
- Booking changes append events and cancel obsolete reminders; they never delete the old appointment history.
- Campaign cancellation does not turn an existing booking into attendance and does not erase a valid later attendance inside the accepted tail.

## 8. Corrections and disputes

Corrections are append-only:

1. Only an authorized user may correct an outcome.
2. The correction records the prior event, replacement state, reason, actor, time, and evidence.
3. The prior event stays auditable and is marked superseded rather than overwritten.
4. Funnel totals recompute from the newest valid, non-disputed event.
5. Conflicting evidence becomes `disputed`. A disputed appointment is excluded from the verified attended count until an authorized resolution is recorded.
6. A late entry keeps both the true occurrence time and later recording time. It may update the final outcome total but remains visible as late evidence and may still fail the separate seven-day outcome-completeness target.

## 9. Exact metric

For one campaign and its accepted tails:

```text
verified qualified attended trials
= unique campaign Leads
  with qualification_state = qualified
  and one eligible booking
  and one verified attended appointment inside close+14
  and resolved campaign attribution
  and no unresolved duplicate or dispute
```

Useful rates use separate denominators:

- Qualification rate = unique qualified Leads / unique captured Leads.
- Booking rate = unique booked qualified Leads / unique qualified Leads.
- Attendance rate = unique verified attended Leads / unique booked qualified Leads.
- Enrollment rate = unique verified won enrollments / unique verified attended Leads.

Always show numerator, denominator, unknowns, exclusions, and late evidence. Never turn missing values into zero or infer attendance from another funnel stage.

## 10. Classification examples

For the consistency exercise, cover the last two columns, classify each example independently, and then compare with the answer key.

| ID | Scenario | Expected primary count | Reason |
|---|---|---:|---|
| `EX-01` | A hosted-form Lead satisfies the approved three criteria, books two days later, attends before campaign close, and the authorized owner marks the linked appointment attended. | 1 | Qualified, valid booking, in-window appointment, known source, and accepted attendance evidence. |
| `EX-02` | The same person submits the form twice and then messages through the campaign WhatsApp link. The records are reconciled to one Contact and one campaign Lead; one linked trial is verified attended. | 1 | Multiple touches do not create multiple Leads or outcomes. |
| `EX-03` | A person clicks the tracked WhatsApp link, but no actual conversation, source/consent reconciliation, or campaign Lead is recorded. The owner later says someone with a similar name attended. | 0 | A click is not a Lead, and the attendance cannot be linked to a qualified campaign Lead. Report it as unknown/uncertain, not attributed attendance. |
| `EX-04` | A Lead is captured 27 July; the campaign closes 28 July. The person books 2 August, misses the first appointment, rebooks, and is verified attended on 10 August. | 1 | Booking occurred before the 3 August Lead deadline; the replacement appointment occurred before close+14 on 11 August; the no-show remains in history. |
| `EX-05` | A qualified Lead books inside the valid booking tail, but the only appointment offered is 12 August when close+14 was 11 August. The person attends. | 0 | It is a real later business outcome, but it is outside the campaign's primary attribution window. Report it separately. |
| `EX-06` | An owner initially records `attended`, then submits an authorized correction with attendance-register evidence showing `no_show`. | 0 | The correction supersedes the earlier event without deleting it; the current verified state is no-show. |
| `EX-07` | Campaign A closes while one Lead remains in its valid tail. Campaign B starts and the same Contact clicks its link, but the person books through the still-active Campaign A workflow and attends. | 1 for Campaign A; 0 for Campaign B | First-known origin remains Campaign A. The Campaign B click is a later touch and cannot steal attribution. |
| `EX-08` | A verified in-window attendance is entered nine days after the appointment. | 1 in the final reconciled total | `occurred_at` is in-window, so it counts after verification. It is also labelled late and fails the separate seven-day completeness target for that appointment. |
| `EX-09` | The provider says `attended`; an authorized owner says `no_show`, but no correction reason or resolution is yet recorded. | 0 while disputed | Conflicting evidence is not silently resolved. Exclude it from verified attendance until an authorized resolution exists. |

## 11. Founder/product-lead consistency check

Gate `G0-09` does not pass merely because this draft exists.

Use the separate [blind outcome-consistency worksheet](OUTCOME_CONSISTENCY_WORKSHEET.md) so each reviewer receives fresh scenarios without an adjacent answer key.

1. Founder and product lead each classify at least three blind examples without looking at the other response or this document's answer key.
2. Compare the results with each other and this rule.
3. If any classification differs, clarify the rule and repeat with three examples.
4. Confirm the default qualification criteria with field evidence; revise them if owners expose a safer, clearer boundary.
5. Record the final rule version and review below.

| Review field | Record |
|---|---|
| Examples tested | |
| Founder classification matched | |
| Product-lead classification matched | |
| Differences and amendment made | |
| Final rule version | |
| Review date | |
| Founder name/signature reference | |
| Product-lead name/signature reference | |

`G0-09` becomes `PASS` only after three examples classify consistently under the final recorded rule. Field research may still reopen the qualification rubric; any material change creates a new version rather than silently editing the accepted one.
