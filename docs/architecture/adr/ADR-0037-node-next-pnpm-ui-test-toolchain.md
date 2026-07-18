# ADR-0037: Node, Next.js, pnpm, UI, renderer, and test toolchain

- **Status:** Accepted under founder-delegated technical direction
- **Date:** 14 July 2026
- **Decision:** OD-037

## Context

The modular monolith needs one reproducible TypeScript toolchain for web/API, durable workflows, domain/application packages, the yoga vertical pack, deterministic media rendering, migrations, and tests. Versions must match Vercel, Next.js, Workflow, Drizzle, OpenAI, Sentry, and Playwright rather than follow floating tags.

Node 24 is LTS and Vercel's default supported major. Next.js 16.2 is stable while 16.3 is preview. pnpm 11.4, Vitest 4.1, Playwright 1.61, ESLint 10, and Prettier 3 are stable. TypeScript 7 became stable only six days before this decision and replaces the compiler implementation; its own announcement records remaining integration constraints. Foundation should not absorb that transition.

## Decision

### Runtime and packages

- Use **Node.js 24 LTS**, pinning local/CI bootstrap to **24.18.0**. Declare `engines.node: "24.x"` because Vercel rolls supported patches; record the actual build/runtime version in release evidence.
- Use **pnpm 11.4.0**, pinned in `packageManager`, with one committed lockfile, frozen CI installs, and workspaces. Use `pnpm -r`/filtered scripts; no Turborepo/Nx until measured orchestration need.
- Save exact dependency versions. Package-update PRs require lockfile, verification, and security/release review. Keep pnpm lockfile integrity, release-age/trust protections, exotic-source blocking, and an explicit install/build-script allow-list enabled.

### App and language

- Use **Next.js 16.2.10 App Router**, **React/React DOM 19.2.7**, Node runtime, and stable Turbopack defaults. Authenticated, lead, and operator routes are dynamic/private by default.
- Use **TypeScript 6.0.3** with strict checks, modern ESM/resolution, and explicit package boundaries. TypeScript 7 waits until Next, ESLint/typescript-eslint, Drizzle, tests, and editor workflows pass the repository contract in an upgrade PR.
- Keep provider SDKs in adapters and the yoga pack behind its vertical contract. Do not enable experimental Next/React features, React Compiler, Cache Components, or broad authenticated caching initially.

### UI and renderer

- Use **Tailwind CSS 4.x** with versioned design tokens.
- Use native HTML first and source-owned components, adding **Radix Primitives** only for complex focus/interaction patterns. Copied/registry code becomes repository-owned and must pass OD-029; no opaque full design-system runtime.
- Render OD-022 manifests with source-owned JSX templates through **Satori** to SVG, then **Sharp 0.34.x** for raster composition/crop/PNG. Pin licensed fonts and normalize locale, dimensions, color profile, inputs, and checksums. Reject escaping, overflow, missing-font, contrast, and safe-area failures. Generated decoration is only an input layer. Plain source-owned SVG templates remain the fallback behind the renderer port if Satori fails the spike.

### Verification

- **Vitest 4.1.7** for unit, boundary, component, offline-AI, and integration orchestration tests. Persistence tests use real isolated PostgreSQL, never SQLite.
- **Playwright 1.61.1** for critical browser/accessibility journeys. Chromium smoke runs on pull requests; Chromium/Firefox/WebKit critical paths run before release and on schedule.
- **ESLint 10.7.0**, flat config, **eslint-config-next 16.2.10**, TypeScript/module/security/accessibility rules, and **Prettier 3.9.5**. Run ESLint directly because Next 16 no longer runs lint during build.
- Add axe automation while retaining ADR-0029 keyboard and screen-reader release checks.

The lockfile is the full executable inventory. Other packages are selected and exactly pinned in the scaffold PR only after compatibility and licence/security review.

## Consequences

- One LTS TypeScript/React toolchain fits the selected Vercel platform.
- Exact pins and supply-chain policy improve reproducibility but require deliberate upgrades.
- TypeScript 7 speed is deferred until ecosystem proof.
- Source-owned UI/rendering adds maintenance while preserving accessibility, exact approval, and domain boundaries.
- Sharp/fonts and Playwright browsers increase build/CI size, so the spike must prove them.

## Rejected alternatives

- Node 26 Current: not LTS on the decision date.
- Bun/Deno: no evidenced benefit that offsets selected-SDK compatibility risk.
- TypeScript 7 immediately: six-day-old compiler transition.
- Turborepo/Nx initially: orchestration without measured need.
- Opaque full UI kit: weakens accessibility/source ownership.
- Jest/Cypress: duplicates the selected ESM/unit/cross-browser stacks.
- Browser screenshots or fully generated finished creatives as renderer truth: violates OD-022 determinism.

## Required compatibility spike

Before Gate G1, prove clean frozen install, format, lint, types, Vitest, Next build, Playwright, Workflow, Drizzle/PostgreSQL, adapter compilation, Satori/Sharp/font render parity, and native/Radix accessibility behavior across local, Linux CI, and Vercel. A failure reopens only the failing tool, not the architectural boundary.

## Official references checked

- [Node.js releases](https://nodejs.org/en/about/previous-releases)
- [Vercel Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Next.js 16.2](https://nextjs.org/blog/next-16-2)
- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [pnpm installation](https://pnpm.io/installation)
- [TypeScript 7 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [Tailwind with Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- [Radix accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [Vitest migration](https://vitest.dev/guide/migration)
- [Playwright installation](https://playwright.dev/docs/intro)
- [ESLint 10 migration](https://eslint.org/docs/latest/use/migrate-to-10.0.0)
- [Prettier installation](https://prettier.io/docs/install)

