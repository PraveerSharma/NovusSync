"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";

import styles from "./fact-review-workbench.module.css";

type ReviewMode = "inspect" | "correct" | "reject" | "resolve";
type CandidateStatus = "pending" | "approved" | "rejected";
type ConflictKind = "none" | "source_disagreement" | "stale_source_label";

type CandidateRecord = Readonly<{
  id: string;
  fieldKey: string;
  section: string;
  label: string;
  sourceValue: string;
  currentValue: string | null;
  sourceLocation: string;
  sourceReference: string;
  capturedAt: string;
  extractor: string;
  confidence: number;
  conflict: ConflictKind;
  conflictDetail: string | null;
  status: CandidateStatus;
  approvedValue: string | null;
  version: number | null;
}>;

type HistoryEntry = Readonly<{
  id: string;
  fieldLabel: string;
  action: string;
  result: "Approved" | "Rejected";
  reason: string;
  value: string | null;
}>;

const INITIAL_CANDIDATES: readonly CandidateRecord[] = [
  {
    id: "candidate-business-name",
    fieldKey: "business.name",
    section: "Business",
    label: "Business name",
    sourceValue: "Northstar Collective",
    currentValue: null,
    sourceLocation: "https://northstar.example/about",
    sourceReference: "main#business-name",
    capturedAt: "18 Jul 2026, 1:30 PM IST",
    extractor: "bounded-html-fixture v1.0.0",
    confidence: 94,
    conflict: "none",
    conflictDetail: null,
    status: "pending",
    approvedValue: null,
    version: null,
  },
  {
    id: "candidate-trial-policy",
    fieldKey: "offer.trialPolicy",
    section: "Offer",
    label: "Trial policy",
    sourceValue: "First introductory group class is free",
    currentValue: "Introductory class is ₹299",
    sourceLocation: "https://northstar.example/intro",
    sourceReference: "main#intro-offer",
    capturedAt: "18 Jul 2026, 1:31 PM IST",
    extractor: "bounded-html-fixture v1.0.0",
    confidence: 81,
    conflict: "source_disagreement",
    conflictDetail: "The approved policy and the source proposal disagree on trial pricing.",
    status: "pending",
    approvedValue: null,
    version: null,
  },
  {
    id: "candidate-booking-label",
    fieldKey: "booking.routeLabel",
    section: "Booking",
    label: "Booking route label",
    sourceValue: "Book an introductory class",
    currentValue: "Book an intro trial",
    sourceLocation: "booking-route:intro-class-request",
    sourceReference: "route-label",
    capturedAt: "18 Jul 2026, 1:35 PM IST",
    extractor: "normalized-booking-metadata v1.0.0",
    confidence: 76,
    conflict: "stale_source_label",
    conflictDetail: "The booking provider and current profile use different labels.",
    status: "pending",
    approvedValue: null,
    version: null,
  },
] as const;

const REASONS = [
  { value: "OWNER_CORRECTION", label: "Owner corrected the source wording" },
  { value: "SOURCE_VALUE_CONFIRMED", label: "Source value confirmed as current" },
  { value: "CURRENT_POLICY_CONFIRMED", label: "Current approved policy confirmed" },
  { value: "SOURCE_OUTDATED", label: "Source is outdated or inaccurate" },
] as const;

function displayConflict(kind: ConflictKind): string {
  if (kind === "source_disagreement") return "Source disagreement";
  if (kind === "stale_source_label") return "Stale source label";
  return "Clear proposal";
}

function displayReason(value: string): string {
  return REASONS.find((reason) => reason.value === value)?.label ?? value;
}

export function FactReviewWorkbench() {
  const [candidates, setCandidates] = useState<readonly CandidateRecord[]>(INITIAL_CANDIDATES);
  const [selectedId, setSelectedId] = useState(INITIAL_CANDIDATES[0].id);
  const [mode, setMode] = useState<ReviewMode>("inspect");
  const [reviewedValue, setReviewedValue] = useState(INITIAL_CANDIDATES[0].sourceValue);
  const [resolutionChoice, setResolutionChoice] = useState<"source" | "current" | "custom">(
    "source",
  );
  const [reasonCode, setReasonCode] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("No decision recorded in this browser fixture yet.");
  const [history, setHistory] = useState<readonly HistoryEntry[]>([]);

  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0];
  const pendingCount = candidates.filter((candidate) => candidate.status === "pending").length;
  const conflictCount = candidates.filter(
    (candidate) => candidate.status === "pending" && candidate.conflict !== "none",
  ).length;
  const approvedCount = candidates.filter((candidate) => candidate.status === "approved").length;

  const resolvedValue = useMemo(() => {
    if (resolutionChoice === "source") return selected.sourceValue;
    if (resolutionChoice === "current") return selected.currentValue ?? "";
    return reviewedValue;
  }, [resolutionChoice, reviewedValue, selected.currentValue, selected.sourceValue]);

  function selectCandidate(candidate: CandidateRecord) {
    setSelectedId(candidate.id);
    setMode("inspect");
    setReviewedValue(candidate.sourceValue);
    setResolutionChoice("source");
    setReasonCode("");
    setFormError("");
  }

  function recordDecision(input: {
    status: Exclude<CandidateStatus, "pending">;
    action: string;
    value: string | null;
    reason: string;
  }) {
    const nextVersion = selected.status === "approved" ? (selected.version ?? 0) + 1 : 1;
    setCandidates((current) =>
      current.map((candidate) =>
        candidate.id === selected.id
          ? {
              ...candidate,
              status: input.status,
              approvedValue: input.status === "approved" ? input.value : null,
              version: input.status === "approved" ? nextVersion : null,
            }
          : candidate,
      ),
    );
    setHistory((current) => [
      {
        id: `history-${selected.id}-${current.length + 1}`,
        fieldLabel: selected.label,
        action: input.action,
        result: input.status === "approved" ? "Approved" : "Rejected",
        reason: input.reason,
        value: input.value,
      },
      ...current,
    ]);
    setNotice(
      input.status === "approved"
        ? `${selected.label} is staged as approved version ${nextVersion} in this browser fixture.`
        : `${selected.label} is staged as rejected in this browser fixture.`,
    );
    setMode("inspect");
    setReasonCode("");
    setFormError("");
  }

  function verifySourceValue() {
    if (selected.conflict !== "none") {
      setFormError("Resolve the visible conflict before approving this value.");
      return;
    }
    recordDecision({
      status: "approved",
      action: "Verified source value",
      value: selected.sourceValue,
      reason: "Owner verified the cited source value",
    });
  }

  function submitCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = reviewedValue.trim();
    if (!value || value === selected.sourceValue) {
      setFormError("Enter a corrected value that differs from the source proposal.");
      return;
    }
    if (!reasonCode) {
      setFormError("Choose why the source value was corrected.");
      return;
    }
    recordDecision({
      status: "approved",
      action: "Corrected and verified",
      value,
      reason: displayReason(reasonCode),
    });
  }

  function submitResolution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resolvedValue.trim()) {
      setFormError("Choose or enter the value that should become approved truth.");
      return;
    }
    if (!reasonCode) {
      setFormError("Choose why this conflict was resolved.");
      return;
    }
    recordDecision({
      status: "approved",
      action: "Resolved conflict",
      value: resolvedValue.trim(),
      reason: displayReason(reasonCode),
    });
  }

  function submitRejection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reasonCode) {
      setFormError("Choose why this proposal is being rejected.");
      return;
    }
    recordDecision({
      status: "rejected",
      action: "Rejected proposal",
      value: null,
      reason: displayReason(reasonCode),
    });
  }

  function enterMode(nextMode: ReviewMode) {
    setMode(nextMode);
    setReasonCode("");
    setFormError("");
    setReviewedValue(selected.sourceValue);
    setResolutionChoice("source");
  }

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
        <nav aria-label="Business Profile review navigation" className={styles.breadcrumbs}>
          <Link href="/business-profile">Business Profile</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Fact review</span>
        </nav>
      </header>

      <section className={styles.hero} aria-labelledby="fact-review-title">
        <div>
          <p className={styles.eyebrow}>Business Brain / Owner control</p>
          <h1 id="fact-review-title">Decide what becomes true.</h1>
          <p className={styles.heroCopy}>
            Compare every proposed value with its source and current approved fact. Nothing becomes
            trusted context until an owner records a decision.
          </p>
        </div>
        <dl className={styles.metrics} aria-label="Synthetic review queue summary">
          <div>
            <dt>Needs review</dt>
            <dd>{pendingCount}</dd>
          </div>
          <div>
            <dt>Conflicts</dt>
            <dd>{conflictCount}</dd>
          </div>
          <div>
            <dt>Approved here</dt>
            <dd>{approvedCount}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.fixtureNotice} aria-label="Test boundary">
        <span aria-hidden="true" />
        <div>
          <strong>Synthetic, minimized review fixture</strong>
          <p>
            Decisions remain in this browser. BRN-003A does not write the database or update the
            Business Profile.
          </p>
        </div>
      </section>

      <section className={styles.workbench} aria-label="Fact review workbench">
        <aside className={styles.queue} aria-labelledby="review-queue-title">
          <div className={styles.queueHeading}>
            <div>
              <p className={styles.eyebrow}>Review queue</p>
              <h2 id="review-queue-title">Proposed facts</h2>
            </div>
            <span>{pendingCount} open</span>
          </div>
          <div className={styles.queueList}>
            {candidates.map((candidate, index) => (
              <button
                aria-current={selected.id === candidate.id ? "true" : undefined}
                className={styles.queueItem}
                key={candidate.id}
                onClick={() => selectCandidate(candidate)}
                type="button"
              >
                <span className={styles.queueNumber}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.queueBody}>
                  <strong>{candidate.label}</strong>
                  <small>{candidate.section}</small>
                  <span className={styles.queueMeta}>
                    <i data-status={candidate.status} />
                    {candidate.status === "pending"
                      ? displayConflict(candidate.conflict)
                      : candidate.status === "approved"
                        ? `Approved v${candidate.version}`
                        : "Rejected"}
                  </span>
                </span>
                <span aria-hidden="true" className={styles.queueArrow}>
                  →
                </span>
              </button>
            ))}
          </div>
        </aside>

        <article className={styles.reviewCard} aria-labelledby="selected-fact-title">
          <header className={styles.reviewHeader}>
            <div>
              <p className={styles.eyebrow}>{selected.fieldKey}</p>
              <h2 id="selected-fact-title">{selected.label}</h2>
            </div>
            <span className={styles.confidence}>{selected.confidence}% confidence</span>
          </header>

          <section className={styles.provenance} aria-label="Source provenance">
            <dl>
              <div>
                <dt>Source location</dt>
                <dd>{selected.sourceLocation}</dd>
              </div>
              <div>
                <dt>Reference</dt>
                <dd>{selected.sourceReference}</dd>
              </div>
              <div>
                <dt>Captured</dt>
                <dd>{selected.capturedAt}</dd>
              </div>
              <div>
                <dt>Extractor</dt>
                <dd>{selected.extractor}</dd>
              </div>
            </dl>
          </section>

          {selected.conflict !== "none" ? (
            <section className={styles.conflictBanner} aria-label="Visible conflict">
              <span>{displayConflict(selected.conflict)}</span>
              <p>{selected.conflictDetail}</p>
            </section>
          ) : (
            <section className={styles.clearBanner} aria-label="No detected conflict">
              <span aria-hidden="true">✓</span>
              <p>No conflicting approved value was detected.</p>
            </section>
          )}

          <section className={styles.comparison} aria-labelledby="comparison-title">
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>Side-by-side evidence</p>
              <h3 id="comparison-title">Compare before deciding</h3>
            </div>
            <div className={styles.valueGrid}>
              <article className={styles.valueCard}>
                <span>Current approved value</span>
                <strong>{selected.currentValue ?? "No approved value recorded"}</strong>
                <small>
                  {selected.currentValue ? "Version 1 / owner approved" : "Explicit unknown"}
                </small>
              </article>
              <article className={styles.valueCard} data-proposal="true">
                <span>Source proposal</span>
                <strong>{selected.sourceValue}</strong>
                <small>Provisional / not usable yet</small>
              </article>
            </div>
          </section>

          <section className={styles.decisionArea} aria-labelledby="decision-title">
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>Owner decision</p>
              <h3 id="decision-title">Record one explicit outcome</h3>
            </div>

            {selected.status !== "pending" ? (
              <div className={styles.recordedDecision} data-result={selected.status}>
                <span>
                  {selected.status === "approved"
                    ? "Approved version recorded"
                    : "Proposal rejected"}
                </span>
                <strong>
                  {selected.status === "approved"
                    ? selected.approvedValue
                    : "The prior approved fact remains unchanged."}
                </strong>
                <button type="button" onClick={() => selectCandidate(selected)}>
                  View immutable trail
                </button>
              </div>
            ) : mode === "inspect" ? (
              <div className={styles.primaryActions}>
                {selected.conflict === "none" ? (
                  <button
                    className={styles.approveButton}
                    onClick={verifySourceValue}
                    type="button"
                  >
                    Verify source value
                  </button>
                ) : (
                  <button
                    className={styles.approveButton}
                    onClick={() => enterMode("resolve")}
                    type="button"
                  >
                    Resolve conflict
                  </button>
                )}
                <button
                  className={styles.secondaryButton}
                  disabled={selected.conflict !== "none"}
                  onClick={() => enterMode("correct")}
                  type="button"
                >
                  Correct before verifying
                </button>
                <button
                  className={styles.rejectButton}
                  onClick={() => enterMode("reject")}
                  type="button"
                >
                  Reject proposal
                </button>
              </div>
            ) : null}

            {mode === "correct" ? (
              <form className={styles.decisionForm} onSubmit={submitCorrection}>
                <label htmlFor="corrected-value">Corrected owner-approved value</label>
                <textarea
                  id="corrected-value"
                  onChange={(event) => setReviewedValue(event.target.value)}
                  rows={3}
                  value={reviewedValue}
                />
                <label htmlFor="correction-reason">Correction reason</label>
                <select
                  id="correction-reason"
                  onChange={(event) => setReasonCode(event.target.value)}
                  value={reasonCode}
                >
                  <option value="">Choose a reason</option>
                  {REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
                <DecisionFormFooter
                  error={formError}
                  onCancel={() => enterMode("inspect")}
                  submitLabel="Record corrected fact"
                />
              </form>
            ) : null}

            {mode === "resolve" ? (
              <form className={styles.decisionForm} onSubmit={submitResolution}>
                <fieldset className={styles.resolutionChoices}>
                  <legend>Which value should become approved truth?</legend>
                  <label>
                    <input
                      checked={resolutionChoice === "source"}
                      name="resolution-value"
                      onChange={() => setResolutionChoice("source")}
                      type="radio"
                    />
                    <span>
                      <strong>Use source proposal</strong>
                      <small>{selected.sourceValue}</small>
                    </span>
                  </label>
                  <label>
                    <input
                      checked={resolutionChoice === "current"}
                      disabled={!selected.currentValue}
                      name="resolution-value"
                      onChange={() => setResolutionChoice("current")}
                      type="radio"
                    />
                    <span>
                      <strong>Keep current approved value</strong>
                      <small>{selected.currentValue ?? "No current value"}</small>
                    </span>
                  </label>
                  <label>
                    <input
                      checked={resolutionChoice === "custom"}
                      name="resolution-value"
                      onChange={() => setResolutionChoice("custom")}
                      type="radio"
                    />
                    <span>
                      <strong>Enter a corrected resolution</strong>
                      <small>Record an owner-supplied value</small>
                    </span>
                  </label>
                </fieldset>
                {resolutionChoice === "custom" ? (
                  <>
                    <label htmlFor="resolution-value-custom">Resolved value</label>
                    <textarea
                      id="resolution-value-custom"
                      onChange={(event) => setReviewedValue(event.target.value)}
                      rows={3}
                      value={reviewedValue}
                    />
                  </>
                ) : null}
                <label htmlFor="resolution-reason">Resolution reason</label>
                <select
                  id="resolution-reason"
                  onChange={(event) => setReasonCode(event.target.value)}
                  value={reasonCode}
                >
                  <option value="">Choose a reason</option>
                  {REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
                <DecisionFormFooter
                  error={formError}
                  onCancel={() => enterMode("inspect")}
                  submitLabel="Record resolution"
                />
              </form>
            ) : null}

            {mode === "reject" ? (
              <form className={styles.decisionForm} onSubmit={submitRejection}>
                <div className={styles.rejectionWarning} role="note">
                  <strong>Reject this proposal?</strong>
                  <p>
                    Rejection is appended to history. It does not delete source evidence or replace
                    a current approved fact.
                  </p>
                </div>
                <label htmlFor="rejection-reason">Rejection reason</label>
                <select
                  id="rejection-reason"
                  onChange={(event) => setReasonCode(event.target.value)}
                  value={reasonCode}
                >
                  <option value="">Choose a reason</option>
                  {REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
                <DecisionFormFooter
                  destructive
                  error={formError}
                  onCancel={() => enterMode("inspect")}
                  submitLabel="Confirm rejection"
                />
              </form>
            ) : null}
          </section>

          <p className={styles.liveNotice} aria-live="polite">
            {notice}
          </p>
        </article>
      </section>

      <section className={styles.history} aria-labelledby="review-history-title">
        <div className={styles.historyHeading}>
          <div>
            <p className={styles.eyebrow}>Immutable review trail</p>
            <h2 id="review-history-title">Decision history</h2>
          </div>
          <span>{history.length} browser decisions</span>
        </div>
        {history.length ? (
          <ol className={styles.historyList}>
            {history.map((entry) => (
              <li key={entry.id}>
                <span data-result={entry.result.toLowerCase()}>{entry.result}</span>
                <div>
                  <strong>{entry.fieldLabel}</strong>
                  <p>{entry.action}</p>
                </div>
                <div>
                  <small>Reason</small>
                  <p>{entry.reason}</p>
                </div>
                <div>
                  <small>Recorded value</small>
                  <p>{entry.value ?? "No fact version created"}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className={styles.emptyHistory}>
            <span aria-hidden="true">01</span>
            <div>
              <strong>No owner decisions recorded yet</strong>
              <p>Select a proposal, compare its evidence, and record one explicit outcome.</p>
            </div>
          </div>
        )}
      </section>

      <aside className={styles.boundary} aria-labelledby="control-boundary-title">
        <div>
          <p className={styles.eyebrow}>Deterministic boundary</p>
          <h2 id="control-boundary-title">Approval is evidence, not automation.</h2>
        </div>
        <ul>
          <li>Only a human owner can create approved truth.</li>
          <li>Conflicts require a named resolution and reason.</li>
          <li>Correction creates a new version; history is never overwritten.</li>
          <li>Profile application and external actions remain separate commands.</li>
        </ul>
      </aside>
    </main>
  );
}

function DecisionFormFooter({
  destructive = false,
  error,
  onCancel,
  submitLabel,
}: Readonly<{
  destructive?: boolean;
  error: string;
  onCancel: () => void;
  submitLabel: string;
}>) {
  return (
    <div className={styles.formFooter}>
      {error ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : (
        <p>No profile value changes until a later, separate application command.</p>
      )}
      <div>
        <button className={styles.cancelButton} onClick={onCancel} type="button">
          Cancel
        </button>
        <button className={destructive ? styles.dangerButton : styles.approveButton} type="submit">
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
