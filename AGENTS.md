# NovusSync Agent Instructions

## graphify

- On `/graphify`, invoke `~/.Codex/skills/graphify/SKILL.md` before any other action.

## Current Gate

- This repository contains planning documents, a disposable synthetic Gate G0 prototype, and an in-progress synthetic/local Phase 0 application scaffold.
- All current product decisions are classified, but decision closure is not an execution pass; use `docs/decisions/OPEN_DECISIONS.md` rather than assumptions.
- Do not scaffold application code until the founder records Gate G0 as passed in `docs/discovery/GATE_G0_EXECUTION.md`.
- Passing Gate G0 authorizes only synthetic/local Phase 0 foundation work. It does not authorize real Lead data, paid/live operation, production providers, production AI/telemetry, or global checkout.
- OD-033 is accepted policy, not completed evidence. Do not use those live paths until the applicable evidence in `docs/readiness/OD-033_LIVE_READINESS.md` passes and the founder records the live-readiness go/no-go.
- Never infer gate completion from an approved decision, template, unchecked box, local fake, or synthetic test.

## Product Boundaries

- Build a generic campaign-to-outcome core; the first validated pack is independent yoga studios in Bengaluru, English-first.
- Initial delivery is an invite-only, product-assisted managed pilot.
- Instagram publication and WhatsApp Business messaging are human-only through official apps/accounts and individual delegated access.
- No Facebook, Meta SDK/API/OAuth/token/webhook, automated social publishing, automated WhatsApp, automated marketing/Lead email, or software-controlled ad spend. Essential invite/passwordless authentication email is the only initial transactional-email exception and remains production-disabled until its actual provider/configuration passes OD-033.
- AI creates typed proposals only. Deterministic policy and authorized humans own approvals and effects.
- External booking providers own schedules, routing, capacity, conflicts, payments, and authoritative booking state.
- Do not broaden verticals, channels, CRM, commerce countries, or autonomous actions without a recorded decision/change.

## Sources of Truth

- Scope and gates: `docs/product/MVP_SCOPE.md` and `docs/planning/ROADMAP.md`.
- Product/operating decisions: `docs/decisions/OPEN_DECISIONS.md`.
- Technical boundaries: `docs/architecture/SYSTEM_ARCHITECTURE.md` and accepted ADRs.
- Executable work: `docs/planning/BACKLOG.md` and `docs/planning/PHASE_0_FOUNDATION.md`.
- If a proposed change conflicts with these, update the decision/scope record before implementation; never silently reinterpret it.

## Package Manager

- After Gate G0, use Node 24.18.0 and pnpm 11.4.0 per ADR-0037; do not create npm/yarn lockfiles or add Turborepo/Nx.
- The repository verification contract is `pnpm verify` once the scaffold defines it; do not claim it passes before it exists.

## File-Scoped Commands

- Use the nearest package scripts/config and the root `pnpm verify` contract for cross-package changes; never claim the gate passes without running it.

## MCP, Skills, and Plugins

- Use relevant MCP servers, skills, and plugins when they materially improve research, design, implementation, review, or verification. Select them per task; do not add tools speculatively or let tool availability override the locked product/architecture decisions.
- Treat MCPs and interactive design/development tools as operator tooling, not application runtime dependencies or evidence that a provider/account/gate is ready. The repository must remain buildable and verifiable without a contributor's private MCP configuration.
- For accepted platforms, prefer the matching official or provider-maintained integration where available: Supabase/PostgreSQL for the product database, Vercel for deployment/workflows, GitHub for source/CI, Figma and approved UI/accessibility skills for design, and the approved OpenAI/PostHog/Sentry tools for their bounded tasks. Neon is not the product database merely because a Neon MCP is installed.
- Start external MCP access read-only and project-scoped. Do not connect production, run migrations, change environment variables, deploy, purchase a plan, or expose real Lead/customer data until the applicable story, Gate G0/OD-033 evidence, and user authorization permit it.
- Ask the user just in time when login/authorization, account or project creation, project linking, credentials, billing approval, provider-console action, a named human review, or another external approval is required. Never request or print secrets in chat or commit them to Git.
- UI skills/plugins must implement the accepted source-owned, accessible design system and WCAG 2.2 AA boundary. They may accelerate exploration and verification but cannot introduce an opaque design-system runtime, hard-code yoga behavior into the generic core, or bypass exact approval and deterministic policy.
- Invoke the installed `ui-ux-pro-max` skill for UI/UX design, implementation, or review work. Treat its generated recommendations as advisory: accepted NovusSync brand/product decisions, source-owned tokens/components, existing page patterns, WCAG 2.2 AA, reduced-motion, and exact approval boundaries take precedence. Do not persist or force-regenerate its suggested design-system files unless the applicable story explicitly authorizes that source-of-truth change.

## Working Rules

- Inspect `git status` first and preserve unrelated/user changes.
- Use synthetic/minimized fixtures; never place prospect/customer contact details, secrets, raw messages, or access evidence in Git.
- Keep provider SDKs in adapters and yoga behavior in a versioned vertical pack, outside the generic domain core.
- Update affected scope, architecture, roadmap, backlog, and evidence docs with material changes.
- Do not commit, push, purchase services, contact prospects, or activate providers unless the user explicitly requests it.

## Commit Attribution

- AI commits must include its own identity:

```text
Co-Authored-By: <agent/model name> <noreply@example.com>
```
