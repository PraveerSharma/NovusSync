"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type {
  ApprovedContextPageData,
  ApprovedContextReadyPageData,
  ApprovedContextUiUseCase,
} from "../../../lib/approved-context/page-data";
import styles from "./approved-context-workbench.module.css";

const USE_CASE_COPY = {
  campaign: {
    label: "Campaign planning",
    eyebrow: "Publishing boundary",
    summary: "Only facts cleared for public campaign use enter the context packet.",
  },
  concierge: {
    label: "Concierge response",
    eyebrow: "Reply boundary",
    summary: "Operational facts may guide a reply, but restricted claims stay blocked.",
  },
} as const;

function ShieldIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 3 5.5 5.6v5.8c0 4.2 2.6 7.9 6.5 9.6 3.9-1.7 6.5-5.4 6.5-9.6V5.6L12 3Z" />
      <path d="m8.8 12.1 2.1 2.1 4.5-4.7" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 10h11M11 6l4 4-4 4" />
    </svg>
  );
}

function Masthead() {
  return (
    <header className={styles.masthead}>
      <Link className={styles.brand} href="/dashboard" aria-label="NovusSync operations home">
        <span aria-hidden="true" className={styles.brandMark}>
          <i />
          <i />
          <i />
        </span>
        NovusSync
      </Link>
      <nav aria-label="Approved context navigation" className={styles.breadcrumbs}>
        <Link href="/business-profile">Business Profile</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Approved context</span>
      </nav>
      <Link className={styles.reviewLink} href="/business-profile/review">
        Review facts
        <ArrowIcon />
      </Link>
    </header>
  );
}

function Hero({ eyebrow }: { readonly eyebrow: string }) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <p className={styles.kicker} data-testid="context-source">
          {eyebrow}
        </p>
        <h1>
          Use what is true. <em>Block what is not.</em>
        </h1>
        <p className={styles.lede}>
          Every campaign and customer reply starts with an exact packet of owner-approved facts.
          Missing, stale, or restricted information becomes a visible stop, never a guess.
        </p>
      </div>
      <div className={styles.heroSeal} aria-label="Human-approved context boundary">
        <ShieldIcon />
        <span>Human approved</span>
        <strong>Policy enforced</strong>
      </div>
    </section>
  );
}

function shortSnapshotId(snapshotId: string): string {
  const digest = snapshotId.split(":").at(-1) ?? snapshotId;
  return `ctx_${digest.slice(0, 6)}...${digest.slice(-4)}`;
}

function UnavailableWorkspace({
  data,
}: {
  readonly data: Exclude<ApprovedContextPageData, ApprovedContextReadyPageData>;
}) {
  const scopeRequired = data.reason === "scope_required";
  return (
    <main className={styles.page} id="main-content">
      <Masthead />
      <Hero eyebrow="Verified context / Access boundary" />
      <section
        aria-labelledby="context-unavailable-title"
        className={styles.unavailablePanel}
        data-testid="context-unavailable"
        role="alert"
      >
        <span>{scopeRequired ? "SCOPE / REQUIRED" : "CONTEXT / UNAVAILABLE"}</span>
        <h2 id="context-unavailable-title">
          {scopeRequired
            ? "Choose an authorized workspace first."
            : "Verified context is unavailable."}
        </h2>
        <p>
          {scopeRequired
            ? "NovusSync needs an organization, workspace, and profile selection before it can request facts. Membership is checked again before any database read."
            : "No unverified fallback was shown. Return to the workspace and try again after the authenticated data path is available."}
        </p>
        <Link href="/workspaces">
          Return to workspace
          <ArrowIcon />
        </Link>
      </section>
    </main>
  );
}

function ReadyWorkspace({ data }: { readonly data: ApprovedContextReadyPageData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const summary = data.facts.reduce(
    (counts, fact) => {
      counts[fact.state] += 1;
      return counts;
    },
    { usable: 0, blocked: 0, review: 0 },
  );
  const usableFacts = data.facts.filter((fact) => fact.state === "usable");

  function selectUseCase(nextUseCase: ApprovedContextUiUseCase) {
    if (nextUseCase === data.useCase) return;
    startTransition(() => router.replace(data.switchUrls[nextUseCase], { scroll: false }));
  }

  return (
    <main aria-busy={isPending} className={styles.page} id="main-content">
      <Masthead />
      <Hero eyebrow={data.eyebrow} />

      <section className={styles.controlDeck} aria-labelledby="context-mode-title">
        <div>
          <p className={styles.sectionLabel}>01 / Select intended use</p>
          <h2 id="context-mode-title">Build the right context packet</h2>
        </div>
        <div className={styles.tabs} role="tablist" aria-label="Context use case">
          {(Object.keys(USE_CASE_COPY) as ApprovedContextUiUseCase[]).map((key) => (
            <button
              aria-selected={data.useCase === key}
              className={data.useCase === key ? styles.activeTab : undefined}
              disabled={isPending}
              key={key}
              onClick={() => selectUseCase(key)}
              role="tab"
              type="button"
            >
              <span>{key === "campaign" ? "01" : "02"}</span>
              {USE_CASE_COPY[key].label}
            </button>
          ))}
        </div>
        <div className={styles.modeSummary} role="status" aria-live="polite">
          <span>
            {isPending ? "Refreshing verified packet" : USE_CASE_COPY[data.useCase].eyebrow}
          </span>
          <p>
            {isPending
              ? "The current packet stays visible until the next policy result is ready."
              : USE_CASE_COPY[data.useCase].summary}
          </p>
        </div>
      </section>

      <section className={styles.metrics} aria-label="Context summary">
        <article data-testid="metric-usable">
          <span className={styles.metricDot} data-tone="usable" />
          <p>Usable now</p>
          <strong>{summary.usable.toString().padStart(2, "0")}</strong>
        </article>
        <article data-testid="metric-blocked">
          <span className={styles.metricDot} data-tone="blocked" />
          <p>Policy blocked</p>
          <strong>{summary.blocked.toString().padStart(2, "0")}</strong>
        </article>
        <article data-testid="metric-review">
          <span className={styles.metricDot} data-tone="review" />
          <p>Needs review</p>
          <strong>{summary.review.toString().padStart(2, "0")}</strong>
        </article>
        <article className={styles.snapshotMetric}>
          <p>Immutable snapshot</p>
          <code title={data.snapshotId}>{shortSnapshotId(data.snapshotId)}</code>
          <span>Generated from verified versions only</span>
        </article>
      </section>

      <div className={styles.workspace}>
        <section className={styles.factLedger} aria-labelledby="ledger-title">
          <div className={styles.ledgerHeader}>
            <div>
              <p className={styles.sectionLabel}>02 / Inspect evidence</p>
              <h2 id="ledger-title">Approved fact ledger</h2>
            </div>
            <span>{data.facts.length} requested fields</span>
          </div>

          <div className={styles.factList}>
            {data.facts.map((fact, index) => (
              <article
                className={styles.factCard}
                data-context-status={fact.state}
                data-testid={`context-card-${fact.id}`}
                key={fact.fieldKey}
              >
                <div className={styles.factNumber}>{String(index + 1).padStart(2, "0")}</div>
                <div className={styles.factBody}>
                  <div className={styles.factTitleRow}>
                    <div>
                      <span>{fact.group}</span>
                      <h3>{fact.label}</h3>
                      <code>{fact.fieldKey}</code>
                    </div>
                    <span className={styles.statusPill} data-state={fact.state}>
                      {fact.state === "usable"
                        ? "Usable"
                        : fact.state === "blocked"
                          ? "Blocked"
                          : "Review"}
                    </span>
                  </div>

                  {fact.state === "usable" ? (
                    <div className={styles.usableFact}>
                      <p className={styles.factValue}>{fact.value}</p>
                      <dl>
                        <div>
                          <dt>Fact version</dt>
                          <dd>v{fact.version}</dd>
                        </div>
                        <div>
                          <dt>Source</dt>
                          <dd>{fact.source}</dd>
                        </div>
                        <div>
                          <dt>Verified</dt>
                          <dd>{fact.verifiedAt}</dd>
                        </div>
                        <div>
                          <dt>Freshness</dt>
                          <dd>{fact.expiresAt}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : (
                    <div className={styles.blockedFact}>
                      <span aria-hidden="true">!</span>
                      <div>
                        <code>{fact.reason}</code>
                        <p>No assertion returned</p>
                      </div>
                    </div>
                  )}
                  <p className={styles.decisionNote}>{fact.note}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className={styles.sideRail} aria-label="Context packet details">
          <section className={styles.packetCard}>
            <p className={styles.sectionLabel}>03 / Context packet</p>
            <h2>{USE_CASE_COPY[data.useCase].label}</h2>
            <p>Only these cited facts can enter the next workflow step.</p>
            <ol>
              {usableFacts.map((fact) => (
                <li key={fact.fieldKey}>
                  <span>{fact.label}</span>
                  <strong>v{fact.version}</strong>
                </li>
              ))}
            </ol>
            <div className={styles.packetFooter}>
              <ShieldIcon />
              <span>{summary.blocked + summary.review} unsafe assertions removed</span>
            </div>
          </section>

          <section className={styles.boundaryCard}>
            <span className={styles.boundaryIndex}>POLICY / 01</span>
            <h2>Unknown is a valid answer.</h2>
            <p>
              NovusSync never fills missing business facts with generated text. The owner reviews a
              new proposal before it can become approved context.
            </p>
            <Link href="/business-profile/review">
              Open fact review
              <ArrowIcon />
            </Link>
          </section>

          <p className={styles.fixtureNotice}>{data.notice}</p>
        </aside>
      </div>
    </main>
  );
}

export function ApprovedContextWorkbench({ data }: { readonly data: ApprovedContextPageData }) {
  return data.status === "ready" ? (
    <ReadyWorkspace data={data} />
  ) : (
    <UnavailableWorkspace data={data} />
  );
}
