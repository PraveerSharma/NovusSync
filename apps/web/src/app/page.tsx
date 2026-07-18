const navigation = [
  { label: "Foundation", href: "#overview", current: true },
  { label: "Quality gates", href: "#quality", current: false },
  { label: "System boundary", href: "#boundary", current: false },
] as const;

const metrics = [
  { value: "9", label: "implemented gates green" },
  { value: "10", label: "unit checks passing" },
  { value: "0", label: "live external effects" },
] as const;

const attentionItems = [
  {
    title: "Browser acceptance",
    detail: "Desktop, mobile, keyboard and WCAG coverage",
    state: "Complete",
  },
  {
    title: "Database integration",
    detail: "Requires an isolated authorized Supabase test target",
    state: "Access gated",
  },
  {
    title: "Identity boundary",
    detail: "Invite-only actor and workspace membership seam",
    state: "Next",
  },
] as const;

const safeguards = [
  "No social publication or business messaging",
  "No software-controlled advertising spend",
  "No real Lead or customer information",
  "No production AI, telemetry or checkout",
] as const;

export default function HomePage() {
  return (
    <div className="safe-shell relative min-h-dvh bg-canvas text-ink">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <svg
          className="absolute -right-40 -top-40 size-[36rem] text-accent/10 sm:size-[48rem]"
          viewBox="0 0 640 640"
          fill="none"
        >
          <circle cx="320" cy="320" r="319" stroke="currentColor" />
          <circle cx="320" cy="320" r="224" stroke="currentColor" />
          <path d="M0 320h640M320 0v640" stroke="currentColor" />
        </svg>
      </div>

      <a
        href="#main-content"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-canvas transition-transform duration-150 ease-out focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      >
        Skip to main content
      </a>

      <div className="relative mx-auto grid min-h-dvh max-w-screen-2xl lg:grid-cols-12">
        <aside className="border-b border-line bg-canvas/95 px-5 py-5 lg:col-span-3 lg:flex lg:min-h-dvh lg:flex-col lg:border-b-0 lg:border-r lg:px-8 lg:py-8 xl:col-span-2">
          <div className="flex items-center justify-between gap-4 lg:block">
            <a
              href="#overview"
              className="inline-flex items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-4 focus:ring-offset-canvas"
              aria-label="NovusSync foundation home"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-accent font-display text-xl font-semibold text-white shadow-sm">
                N
              </span>
              <span className="font-display text-2xl font-semibold">NovusSync</span>
            </a>
            <span className="hidden rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted sm:inline-flex lg:hidden">
              Phase 0
            </span>
          </div>

          <nav aria-label="Foundation navigation" className="mt-5 lg:mt-14">
            <ul className="grid grid-cols-3 gap-1 pb-1 lg:block lg:space-y-2">
              {navigation.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={item.current ? "page" : undefined}
                    className="group flex min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-center text-xs font-semibold text-muted transition-colors duration-150 ease-out hover:bg-surface hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent aria-[current=page]:bg-ink aria-[current=page]:text-white lg:justify-start lg:gap-3 lg:px-3 lg:text-left lg:text-sm"
                  >
                    <span
                      aria-hidden="true"
                      className="hidden size-1.5 rounded-full bg-line group-aria-[current=page]:bg-accent lg:block"
                    />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto hidden pt-10 lg:block">
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-xs font-semibold text-muted">Environment</p>
              <div className="mt-3 flex items-center gap-2 text-sm font-semibold">
                <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
                Synthetic foundation
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">External effects remain locked.</p>
            </div>
          </div>
        </aside>

        <main
          id="main-content"
          tabIndex={-1}
          className="px-5 py-8 focus:outline-none sm:px-8 sm:py-10 lg:col-span-9 lg:px-12 lg:py-12 xl:col-span-10 xl:px-16"
        >
          <section id="overview" aria-labelledby="overview-title" className="scroll-mt-8">
            <div className="flex flex-col gap-8 border-b border-line pb-10 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent-strong">
                  <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
                  Foundation is fail-closed
                </div>
                <h1
                  id="overview-title"
                  className="mt-5 max-w-3xl text-balance font-display text-5xl font-medium leading-[0.98] sm:text-6xl lg:text-7xl"
                >
                  Build the operating layer before the automation.
                </h1>
                <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted sm:text-lg sm:leading-8">
                  NovusSync is establishing tenant-safe, approval-controlled foundations before a
                  single live campaign, message, booking or customer record can enter the system.
                </p>
              </div>

              <a
                href="#boundary"
                className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white shadow-sm transition-transform duration-150 ease-out hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-4 focus:ring-offset-canvas"
              >
                Review system boundary
                <span aria-hidden="true">↘</span>
              </a>
            </div>

            <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="bg-surface p-6 sm:p-7">
                  <dt className="text-sm font-semibold leading-5 text-muted">{metric.label}</dt>
                  <dd className="mt-3 font-display text-5xl font-semibold tabular-nums">
                    {metric.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="mt-8 grid gap-8 xl:grid-cols-5">
            <section
              id="quality"
              aria-labelledby="quality-title"
              className="scroll-mt-8 rounded-3xl border border-line bg-surface p-6 sm:p-8 xl:col-span-3"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-bold text-accent-strong">Needs attention</p>
                  <h2
                    id="quality-title"
                    className="mt-2 text-balance font-display text-3xl font-semibold"
                  >
                    The next quality gates
                  </h2>
                </div>
                <span className="rounded-full border border-line bg-canvas px-3 py-1 text-xs font-semibold text-muted">
                  FND-001
                </span>
              </div>

              <ol className="mt-7 divide-y divide-line border-y border-line">
                {attentionItems.map((item, index) => (
                  <li
                    key={item.title}
                    className="grid gap-3 py-5 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center"
                  >
                    <span
                      className="font-display text-xl font-semibold tabular-nums text-muted"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="mt-1 text-pretty text-sm leading-6 text-muted">{item.detail}</p>
                    </div>
                    <span className="w-fit rounded-full border border-line bg-canvas px-3 py-1 text-xs font-semibold text-muted">
                      {item.state}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section
              id="boundary"
              aria-labelledby="boundary-title"
              className="scroll-mt-8 rounded-3xl bg-ink p-6 text-white sm:p-8 xl:col-span-2"
            >
              <div
                className="flex size-11 items-center justify-center rounded-xl bg-accent text-xl"
                aria-hidden="true"
              >
                ✓
              </div>
              <p className="mt-8 text-sm font-bold text-accent-pale">Deterministic policy</p>
              <h2
                id="boundary-title"
                className="mt-2 text-balance font-display text-3xl font-semibold"
              >
                Human authority stays in the loop.
              </h2>
              <p className="mt-4 text-pretty text-sm leading-6 text-white/70">
                Phase 0 can validate structure and safety. It cannot perform a customer-facing
                action or accept production data.
              </p>

              <ul className="mt-7 space-y-4" aria-label="Locked external effects">
                {safeguards.map((safeguard) => (
                  <li key={safeguard} className="flex gap-3 text-sm leading-6">
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                    <span>{safeguard}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <footer className="mt-8 flex flex-col gap-3 border-t border-line py-6 text-xs leading-5 text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>NovusSync development foundation · Synthetic data only</p>
            <p className="tabular-nums">Node 24.18.0 · pnpm 11.4.0</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
