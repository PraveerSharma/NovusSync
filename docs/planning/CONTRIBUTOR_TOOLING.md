# Contributor MCP, Skill, and Plugin Inventory

**Status:** Development-tooling inventory — 19 July 2026

**Scope:** Private contributor/operator tooling only; never an application runtime dependency or provider-readiness claim

**Authority:** [Phase 0 foundation](PHASE_0_FOUNDATION.md), [system architecture](../architecture/SYSTEM_ARCHITECTURE.md), and [OD-033 live readiness](../readiness/OD-033_LIVE_READINESS.md)

## Operating boundary

- Keep MCP authentication and private connector configuration outside Git and outside `pnpm verify`.
- Use only dedicated NovusSync development/test projects, folders, repositories, and files. Never rename, repurpose, query, migrate, or mutate an unrelated provider resource.
- Full tool availability does not authorize production access, real Lead/customer data, billing, deployment, environment changes, provider activation, or a destructive action.
- Start diagnosis read-only. Use write tools only for an approved story against a verified NovusSync non-production target, with a target/state check immediately before the action.
- OD-033 remains `NOT PASSED`; PostHog, Sentry, OpenAI, email, and every other live sink/effect remain production-disabled.

## Core development MCPs

| Capability | Approved tool path | NovusSync target | Connection state | Use boundary |
|---|---|---|---|---|
| Source and CI | Official GitHub connector/plugin; CLI-backed GitHub MCP is a secondary path | `PraveerSharma/NovusSync` | Official connector verified; secondary CLI authentication requires repair | Repository/PR/Actions work only; no commit, push, merge, rule change, or workflow rerun without the applicable task authorization |
| Database and auth | Official Supabase MCP | Dedicated `novussync-test`; dedicated `novussync-development` to be created in Mumbai | Test project verified and action-capable; development project pending | Synthetic/test data only; project-scoped connection preferred; never use a similarly named non-NovusSync project |
| Hosting and workflows | Official Vercel plugin/MCP | `novus-sync` | Project link and read access verified | Preview/development diagnosis only until the applicable story and gate authorize env changes or deployment; no purchase or production promotion |
| Product design | Official Figma MCP/plugin | Dedicated NovusSync Figma project/folder and files | Account/write tools verified; dedicated project/folder pending | Source-owned tokens/components and WCAG 2.2 AA remain authoritative; never repurpose an unrelated file |
| Product analytics | Official PostHog MCP/plugin | New PostHog Cloud EU NovusSync development project | Existing connector reaches an unrelated US project and is quarantined; EU setup pending | No SDK/sink activation or real data; explicit allow-list only after OD-033 evidence passes |
| Error/performance telemetry | Official Sentry MCP/plugin | New NovusSync project in the approved EU/DE region | OAuth completed; dedicated project verification/creation pending | No SDK/sink activation or real data; privacy scrubbing and canaries must pass first |
| Current library docs | Context7 | None | Verified | Public documentation queries only; never include proprietary code, credentials, or personal data |
| OpenAI docs | Official OpenAI Developer Docs MCP | None | Registered/callable | Documentation only; application model access remains production-disabled |
| Browser verification | Playwright MCP/plugin | Local/approved NovusSync URLs | Registered/callable | Synthetic sessions only; do not enter or expose secrets through chat or committed artifacts |
| Security review | Codex security plugin/MCP | Repository workspace | Registered/callable | Review/diagnosis only unless a separate task authorizes changes |
| Web extraction/research | Firecrawl MCP | None | Keyless/limited connector present; authenticated full account not required for the current foundation | Public-source research only; do not spend credits or ingest personal/customer data without separate approval |

Unrelated globally installed infrastructure connectors, including Neon and Cloudflare, are not NovusSync provider selections and must not be linked to this repository's product resources.

## Design skills and plugins

| Tool | State | NovusSync use |
|---|---|---|
| `ui-ux-pro-max` | Installed, data validated, bundled tests passing, and required by `AGENTS.md` | Invoke for UI/UX design, implementation, and review. Recommendations are advisory to accepted brand/product decisions, existing page patterns, source-owned tokens/components, accessibility, and approval boundaries. |
| Figma skills | Installed with the official Figma plugin | Design-to-code, code-to-design, Code Connect, design-system/library work, FigJam, Slides, diagrams, and motion; use the matching Figma skill before its governed tool flow. |
| `frontend-design` | Installed/enabled | UI composition and refinement within the repository's accepted system. |
| `imagegen` | Available | Synthetic/source-approved visual generation; no unreviewed customer claims or finished campaign effects. |
| `shadcn` | Installed/enabled | Component guidance only; source ownership, Radix/native accessibility, and dependency boundaries remain controlling. |
| Accessibility audit and `baseline-ui` | Available | WCAG 2.2 AA, keyboard, focus, contrast, responsive, and interaction-quality review. |
| Sites design picker and `visualize` | Installed/enabled | Exploration and explanatory visuals only; Sites hosting is not a substitute for the accepted Vercel architecture. |
| Canva skills/plugin | Installed/enabled, but no callable Canva connector is currently exposed | Optional contributor design work only after a dedicated NovusSync folder exists; ADR-0022 still defers Canva as an application integration. |
| Remotion skill/plugin | Installed/enabled | Not used in the current MVP because the broad video pipeline is deferred. |

## Connection completion rule

A provider row is `connected` only when authentication succeeds, the exact dedicated NovusSync target and region are verified read-only, the granted tool surface matches the intended scope, and a harmless read check succeeds. Registration, an OAuth success message, or a globally available write tool alone is not sufficient.
