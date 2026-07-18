# NovusSync

**Current stage:** R0 implementation kickoff (signed Gate G0 `GO`, synthetic/local foundation)  
**Application status:** Foundation scaffold started; implementation is synthetic/local only  
**Pilot hypothesis:** An invite-only, product-assisted campaign-to-attended-trial workflow for independent yoga studios in Bengaluru, built on a reusable business-agnostic core

## Start here

- [Plain-language discovery steps](docs/discovery/START_HERE.md)
- [Gate G0 outreach and evidence operating pipeline](docs/discovery/G0_OUTREACH_OPERATING_PIPELINE.md)
- [Kommo and outreach-tool research](docs/research/G0_OUTREACH_TOOL_RESEARCH_2026-07-15.md)
- [Founder research and pitching playbook](docs/discovery/FOUNDER_RESEARCH_PLAYBOOK.md)
- [Synthetic operator rehearsal](docs/discovery/SYNTHETIC_REHEARSAL.md)
- [Blind outcome-consistency worksheet](docs/discovery/OUTCOME_CONSISTENCY_WORKSHEET.md)
- [Field-week handoff](docs/discovery/FIELD_WEEK_HANDOFF.md)
- [Offline redacted-handoff checker](scripts/discovery/analyze_handoff.rb)
- [Post-research decision tree](docs/discovery/POST_RESEARCH_DECISION_TREE.md)
- [Gate G0 evidence register](docs/discovery/GATE_G0_EXECUTION.md)
- [Product scope](docs/product/MVP_SCOPE.md)
- [Delivery roadmap](docs/planning/ROADMAP.md)
- [Decision register](docs/decisions/OPEN_DECISIONS.md)
- [System architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)

## What may happen now

- Founder-led owner interviews and design-partner discovery.
- Documentation, synthetic exercises, de-identified analysis, and disposable prototype testing.
- Review of the accepted product decisions and later live-readiness evidence plan.

## What may not happen yet

- Foundation scaffolding now proceeds under Gate G0 `GO` with synthetic/local boundaries.
- No real Lead data, paid/live campaign, production AI/telemetry, or global checkout before the applicable [OD-033 live-readiness evidence](docs/readiness/OD-033_LIVE_READINESS.md) passes.
- No prospect/customer identities, contact details, raw messages, credentials, signed documents, or payment references in Git.

The disposable [synthetic prototype](prototype/README.md) exists only for research. It does not publish, message, book, charge, persist customer data, or contact a real service.

## Foundation commands

Node `24.18.0` and pnpm `11.4.0` are required. `pnpm verify` owns the ordered
repository contract. Unimplemented database, provider-contract, offline-AI, and
browser-smoke stages fail explicitly rather than reporting false success.

The project uses managed Supabase/PostgreSQL. `pnpm db:up` and `pnpm db:down`
therefore do not start a local database; migrations remain guarded and require a
separately authorized non-production target.

`pnpm verify` requires `TEST_DATABASE_URL` for an isolated synthetic Supabase test
project. Database integration tests fail rather than skip when that target is absent.

After the field week, the dependency-free checker can validate and summarize a reviewed redacted export:

```sh
ruby scripts/discovery/analyze_handoff.rb path/to/redacted_handoff.csv
```

Changes to the checker or handoff schema are verified with fictional fixtures only:

```sh
ruby scripts/discovery/test_analyze_handoff.rb
```
