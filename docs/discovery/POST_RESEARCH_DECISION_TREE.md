# Post-Research Decision Tree

**Purpose:** Make the next action obvious when the founder returns from the one-week owner-research sprint.  
**Core rule:** Do not start the application because time passed or interviews were completed. Start it only after every Gate G0 requirement passes and the founder records `GO`.

## 1. Simple flow

```text
Founder returns with coded evidence
              |
              v
Are there at least 10 unique included eligible studio-owner records?
       | NO                         | YES
       v                            v
Continue interviews        Are findings stable and both pains >=70%?
                                 | NO                  | YES
                                 v                     v
                         Continue / rework      Any fatal contradiction?
                                                   | YES       | NO
                                                   v           v
                                             REWORK/STOP   Qualify partners,
                                                           workflows and prototype
                                                                  |
                                                                  v
                                                    Do all G0 rows pass?
                                                       | NO       | YES
                                                       v          v
                                                  Finish gaps   Founder signs GO
                                                                  |
                                                                  v
                                                        Start Phase 0 foundation
```

## 2. Checkpoint A — Interview completeness

Choose `CONTINUE RESEARCH` when any of these is true:

- fewer than 10 unique eligible owner-operated studios completed the same core interview;
- the participant was an instructor/manager without final authority and no owner evidence exists;
- pain classifications rely mainly on opinions or interviewer-led agreement;
- eligible `NO` responses were omitted from the denominator;
- recent interviews still produce new material workflows, objections, segments, or contradictions; or
- private evidence cannot support the coded classification.

Action: fix the sampling or interview problem and continue toward 20. Do not lower the denominator or rewrite a `NO` as a `YES`.

## 3. Checkpoint B — Problem evidence

### Continue to partner validation

Recommend this branch when:

- at least 70% of included unique eligible studio-owner records provide behavioral evidence of **both** approved pains;
- findings are stable enough to describe the recurring workflow;
- owners can identify a verifiable attended-trial outcome;
- no fatal market, workflow, platform, privacy, or commercial contradiction is unresolved; and
- multiple owners accept a concrete next step rather than offering compliments only.

This does not yet authorize development. It authorizes the remaining Gate G0 validation work.

### Rework

Recommend `REWORK` when owners have a meaningful problem but the accepted solution boundary is wrong—for example:

- the real pain occurs after attendance rather than during campaign-to-attendance;
- the selected booking or channel route cannot be operated or evidenced consistently;
- the qualification rule is ambiguous or depends on unsafe sensitive judgment;
- the manual workload, access burden, or pricing is not credible; or
- the Bengaluru yoga segment is too narrow or structurally different from the hypothesis.

Action: reopen the affected decision, update scope and tests, then repeat only the evidence invalidated by that material change.

### Stop / no-go

Recommend `STOP` or Gate G0 `NO-GO` when:

- fewer than 70% show both pains after a credible stable sample;
- owners already solve the workflow well and have no switching reason;
- attended outcomes cannot be verified honestly;
- five serious partners or two monetary commitments cannot be obtained without guarantees or inappropriate pressure;
- a fatal privacy, platform, operational, legal, or commercial contradiction cannot be mitigated within the MVP; or
- solving the problem requires the very broad CRM, automation, medical, multi-channel, or scheduling scope deliberately excluded from the MVP.

Stopping is a successful discovery result when it prevents an unsupported build.

## 4. Checkpoint C — Remaining Gate G0 validation

After positive interview evidence, complete these without changing their thresholds:

| Workstream | Required result | Founder decision involved |
|---|---|---|
| Design partners | Five eligible studios sign for two intended `CU-01` cycles | Approve final participation route after review |
| Baseline/readiness | At least three prove usable four-week baseline and channel/booking/outcome readiness | Accept gaps or reject candidate; do not waive silently |
| Monetary commitment | At least two pay the cycle or INR 1,000 fully credited deposit without a result guarantee | Approve accountant/counsel-reviewed payment route first |
| Manual workflow | Two eligible studios complete an observed campaign-to-attendance workflow | Approve any use of governed non-synthetic data |
| Prototype | Five eligible owners complete the five core tasks | Accept, fix, or explicitly defer every material issue |
| Outcome rule | Founder and product lead classify at least three examples consistently | Approve the final rule version |
| Feasibility | All five have workable Instagram, WhatsApp, and booking evidence routes | Reject any route that needs shared passwords or unsupported automation |
| Contradictions | Every material contradiction has a real disposition | Choose `GO`, `REWORK`, or `NO-GO` |

## 5. Checkpoint D — Founder Gate G0 decision

### `GO`

Record `GO` only when every `G0-01` through `G0-12` row is `PASS`. The signed decision authorizes only R1/Phase 0 repository and secure-foundation work. It does not authorize real Lead data or live operation.

First engineering sequence after `GO`:

1. confirm the signed evidence snapshot and accepted ADR baseline;
2. verify the current approved Node/pnpm/framework compatibility using official sources;
3. create repository metadata, pinned toolchain, and import boundaries;
4. scaffold only the modular-monolith foundation and deterministic fake seams;
5. establish typed configuration, tenant context, database/migrations, audit/outbox/idempotency, and test fixtures;
6. add verification, CI, synthetic end-to-end smoke, and contributor runbooks; and
7. review Gate G1 before starting Business Brain feature work.

The authoritative detail remains [Phase 0 Foundation](../planning/PHASE_0_FOUNDATION.md).

### `REWORK`

Record the failed rows, affected decisions, changes required, owner, and retest evidence. Application scaffolding remains unauthorized.

### `NO-GO`

Record the evidence and rationale, preserve the research safely, and stop product implementation. Decide separately whether to test a materially different problem or segment; do not silently transform this scope.

## 6. Work that can safely continue during the founder's week

- founder/operator synthetic rehearsal;
- research and objection-handling training;
- prototype walkthrough using fictional data;
- review of the outcome-counting examples;
- preparation of coded evidence handoff and contradiction categories;
- documentation consistency and Gate G0 status checks; and
- preparation of counsel/accountant questions without using a draft as legal advice.

The application scaffold, production accounts, provider purchases, real Lead processing, and live integrations remain intentionally paused.
