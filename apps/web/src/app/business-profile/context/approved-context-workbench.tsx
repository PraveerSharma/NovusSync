"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import styles from "./approved-context-workbench.module.css";

type UseCase = "campaign" | "concierge";
type ContextState = "usable" | "blocked" | "review";

interface ContextFact {
  readonly id: string;
  readonly fieldKey: string;
  readonly label: string;
  readonly group: string;
  readonly value?: string;
  readonly version?: number;
  readonly source?: string;
  readonly verifiedAt?: string;
  readonly expiresAt?: string;
  readonly states: Record<
    UseCase,
    {
      readonly state: ContextState;
      readonly reason?: string;
      readonly note: string;
    }
  >;
}

const CONTEXT_FACTS: readonly ContextFact[] = [
  {
    id: "business-name",
    fieldKey: "business.name",
    label: "Business name",
    group: "Identity",
    value: "Northstar Yoga Studio",
    version: 3,
    source: "Owner review · INT-002",
    verifiedAt: "18 Jul 2026, 2:30 PM",
    expiresAt: "No scheduled expiry",
    states: {
      campaign: {
        state: "usable",
        note: "Approved for campaign planning and customer-facing copy.",
      },
      concierge: {
        state: "usable",
        note: "Approved for direct replies and booking guidance.",
      },
    },
  },
  {
    id: "trial-policy",
    fieldKey: "offer.trialPolicy",
    label: "Introductory trial",
    group: "Offer",
    value: "One complimentary beginner group class",
    version: 2,
    source: "Offer sheet · owner confirmed",
    verifiedAt: "02 Jun 2026, 10:15 AM",
    expiresAt: "Expired 16 Jul 2026",
    states: {
      campaign: {
        state: "blocked",
        reason: "APPROVED_CONTEXT_EXPIRED",
        note: "The offer must be reviewed before it appears in a campaign.",
      },
      concierge: {
        state: "blocked",
        reason: "APPROVED_CONTEXT_EXPIRED",
        note: "Do not promise this trial until an owner approves a new version.",
      },
    },
  },
  {
    id: "booking-route",
    fieldKey: "booking.routeLabel",
    label: "Booking route",
    group: "Operations",
    value: "Share the approved external booking link",
    version: 5,
    source: "Operating guide · owner confirmed",
    verifiedAt: "19 Jul 2026, 9:05 AM",
    expiresAt: "Review due 19 Aug 2026",
    states: {
      campaign: {
        state: "blocked",
        reason: "APPROVED_CONTEXT_RESTRICTED",
        note: "This instruction is operational and cannot be published in campaign copy.",
      },
      concierge: {
        state: "usable",
        note: "Approved for one-to-one booking guidance after qualification.",
      },
    },
  },
  {
    id: "therapy-claim",
    fieldKey: "claims.therapy",
    label: "Therapeutic claim",
    group: "Safety",
    value: "Supports injury recovery",
    version: 1,
    source: "Draft intake note",
    verifiedAt: "17 Jul 2026, 4:40 PM",
    expiresAt: "Under active review",
    states: {
      campaign: {
        state: "blocked",
        reason: "APPROVED_CONTEXT_DISPUTED",
        note: "Health and therapeutic claims require explicit qualified review.",
      },
      concierge: {
        state: "blocked",
        reason: "APPROVED_CONTEXT_DISPUTED",
        note: "Escalate health questions to the studio; no assertion is allowed.",
      },
    },
  },
  {
    id: "primary-audience",
    fieldKey: "audience.primary",
    label: "Primary audience",
    group: "Audience",
    states: {
      campaign: {
        state: "review",
        reason: "APPROVED_CONTEXT_MISSING",
        note: "No approved audience fact exists for this campaign brief.",
      },
      concierge: {
        state: "review",
        reason: "APPROVED_CONTEXT_MISSING",
        note: "Ask a qualifying question instead of assuming customer intent.",
      },
    },
  },
];

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

export function ApprovedContextWorkbench() {
  const [useCase, setUseCase] = useState<UseCase>("campaign");
  const summary = useMemo(
    () =>
      CONTEXT_FACTS.reduce(
        (counts, fact) => {
          counts[fact.states[useCase].state] += 1;
          return counts;
        },
        { usable: 0, blocked: 0, review: 0 },
      ),
    [useCase],
  );
  const usableFacts = CONTEXT_FACTS.filter((fact) => fact.states[useCase].state === "usable");

  return (
    <main className={styles.page} id="main-content">
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

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Verified context · Synthetic workspace</p>
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

      <section className={styles.controlDeck} aria-labelledby="context-mode-title">
        <div>
          <p className={styles.sectionLabel}>01 · Select intended use</p>
          <h2 id="context-mode-title">Build the right context packet</h2>
        </div>
        <div className={styles.tabs} role="tablist" aria-label="Context use case">
          {(Object.keys(USE_CASE_COPY) as UseCase[]).map((key) => (
            <button
              aria-selected={useCase === key}
              className={useCase === key ? styles.activeTab : undefined}
              key={key}
              onClick={() => setUseCase(key)}
              role="tab"
              type="button"
            >
              <span>{key === "campaign" ? "01" : "02"}</span>
              {USE_CASE_COPY[key].label}
            </button>
          ))}
        </div>
        <div className={styles.modeSummary} role="status" aria-live="polite">
          <span>{USE_CASE_COPY[useCase].eyebrow}</span>
          <p>{USE_CASE_COPY[useCase].summary}</p>
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
          <code>ctx_7f2a…91c4</code>
          <span>Generated from verified versions only</span>
        </article>
      </section>

      <div className={styles.workspace}>
        <section className={styles.factLedger} aria-labelledby="ledger-title">
          <div className={styles.ledgerHeader}>
            <div>
              <p className={styles.sectionLabel}>02 · Inspect evidence</p>
              <h2 id="ledger-title">Approved fact ledger</h2>
            </div>
            <span>{CONTEXT_FACTS.length} requested fields</span>
          </div>

          <div className={styles.factList}>
            {CONTEXT_FACTS.map((fact, index) => {
              const decision = fact.states[useCase];
              return (
                <article
                  className={styles.factCard}
                  data-context-status={decision.state}
                  data-testid={`context-card-${fact.id}`}
                  key={fact.id}
                >
                  <div className={styles.factNumber}>{String(index + 1).padStart(2, "0")}</div>
                  <div className={styles.factBody}>
                    <div className={styles.factTitleRow}>
                      <div>
                        <span>{fact.group}</span>
                        <h3>{fact.label}</h3>
                        <code>{fact.fieldKey}</code>
                      </div>
                      <span className={styles.statusPill} data-state={decision.state}>
                        {decision.state === "usable"
                          ? "Usable"
                          : decision.state === "blocked"
                            ? "Blocked"
                            : "Review"}
                      </span>
                    </div>

                    {decision.state === "usable" ? (
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
                          <code>{decision.reason}</code>
                          <p>No assertion returned</p>
                        </div>
                      </div>
                    )}
                    <p className={styles.decisionNote}>{decision.note}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className={styles.sideRail} aria-label="Context packet details">
          <section className={styles.packetCard}>
            <p className={styles.sectionLabel}>03 · Context packet</p>
            <h2>{USE_CASE_COPY[useCase].label}</h2>
            <p>Only these cited facts can enter the next workflow step.</p>
            <ol>
              {usableFacts.map((fact) => (
                <li key={fact.id}>
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

          <p className={styles.fixtureNotice}>
            This protected Preview uses minimized synthetic records. BRN-004B replaces the fixture
            with tenant-scoped PostgreSQL retrieval without changing this policy boundary.
          </p>
        </aside>
      </div>
    </main>
  );
}
