"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  approveBookingRouteMetadataSource,
  approveBusinessWebsiteSource,
  createFactCandidate,
  createFactCandidateReviewDecision,
  createSourceCapture,
  createSourceProposalBatch,
  type FactCandidate,
  type FactCandidateReviewDecision,
  type SourceProposalBatch,
} from "@novussync/domain";

import styles from "./source-proposal-panel.module.css";

const approvedAt = "2026-07-18T08:00:00.000Z";
const capturedAt = "2026-07-18T08:05:00.000Z";
const ownerApproval = {
  actorId: "synthetic-owner",
  actorRole: "owner" as const,
  approvedAt,
};

function createPreviewBatches(): readonly SourceProposalBatch[] {
  const website = approveBusinessWebsiteSource({
    sourceId: "preview-primary-domain",
    tenantId: "preview-workspace",
    entryUrl: "https://asterhouse.example.com/about",
    approval: ownerApproval,
  });
  const websiteCapture = createSourceCapture({
    source: website,
    captureId: "preview-primary-domain-capture",
    sourceLocation: website.entryUrl,
    sourceReference: "owner-approved primary domain",
    capturedAt,
    extractor: { id: "approved-html-metadata", version: "1.0.0" },
    contentDigest: "sha256:synthetic-primary-domain",
    contentBytes: 3_680,
  });
  const websiteCandidates = [
    createFactCandidate({
      candidateId: "preview-business-summary",
      profileId: "preview-profile",
      source: website,
      capture: websiteCapture,
      fieldKey: "business.summary",
      factTemplateVersion: "business-summary@1",
      playbookVersion: "yoga-studio@1",
      value: "A neighbourhood studio offering small-group movement classes for beginners.",
      allowedUseCases: ["profile_review"],
      confidence: 0.91,
      conflict: { kind: "none", detail: null },
      createdAt: capturedAt,
    }),
    createFactCandidate({
      candidateId: "preview-service-area",
      profileId: "preview-profile",
      source: website,
      capture: websiteCapture,
      fieldKey: "business.serviceArea",
      factTemplateVersion: "service-area@1",
      playbookVersion: "yoga-studio@1",
      value: "Indiranagar, Bengaluru",
      allowedUseCases: ["profile_review"],
      confidence: 0.84,
      conflict: {
        kind: "existing_value",
        detail: "The current profile uses a broader Bengaluru service area.",
      },
      createdAt: capturedAt,
    }),
  ];

  const booking = approveBookingRouteMetadataSource({
    sourceId: "preview-booking-route",
    tenantId: "preview-workspace",
    bookingRouteId: "intro-class-request",
    routeLabel: "Intro class",
    sourceReference: "booking-route:intro-class-request",
    hostedUrl: "https://bookings.example.com/aster-house/intro",
    approval: ownerApproval,
  });
  const bookingCapture = createSourceCapture({
    source: booking,
    captureId: "preview-booking-route-capture",
    sourceLocation: "booking-route:intro-class-request",
    sourceReference: booking.sourceReference,
    capturedAt,
    extractor: { id: "normalized-booking-metadata", version: "1.0.0" },
    contentDigest: "sha256:synthetic-booking-route",
    contentBytes: 640,
  });
  const bookingCandidate = createFactCandidate({
    candidateId: "preview-booking-label",
    profileId: "preview-profile",
    source: booking,
    capture: bookingCapture,
    fieldKey: "booking.routeLabel",
    factTemplateVersion: "booking-route-label@1",
    playbookVersion: "yoga-studio@1",
    value: "Book an introductory class",
    allowedUseCases: ["profile_review"],
    confidence: 0.76,
    conflict: {
      kind: "stale_source_label",
      detail: "The provider route and current profile use different labels.",
    },
    createdAt: capturedAt,
  });

  return Object.freeze([
    createSourceProposalBatch({
      batchId: "preview-primary-domain-batch",
      profileId: "preview-profile",
      source: website,
      capture: websiteCapture,
      candidates: websiteCandidates,
      createdAt: capturedAt,
    }),
    createSourceProposalBatch({
      batchId: "preview-booking-route-batch",
      profileId: "preview-profile",
      source: booking,
      capture: bookingCapture,
      candidates: [bookingCandidate],
      createdAt: capturedAt,
    }),
  ]);
}

const PREVIEW_BATCHES = createPreviewBatches();

function createPreviewDecisionHistory(): readonly FactCandidateReviewDecision[] {
  const websiteBatch = PREVIEW_BATCHES[0];
  const candidate = websiteBatch?.candidates.find(
    (item) => item.fieldKey === "business.serviceArea",
  );
  if (!candidate) return Object.freeze([]);
  return Object.freeze([
    createFactCandidateReviewDecision({
      decisionId: "preview-service-area-decision",
      candidate,
      decisionVersion: 1,
      outcome: "needs_changes",
      reasonCode: "SOURCE_SCOPE_NEEDS_REVIEW",
      decidedByActorId: "synthetic-owner",
      decidedByRole: "owner",
      decidedAt: "2026-07-18T08:12:00.000Z",
    }),
  ]);
}

const PREVIEW_DECISION_HISTORY = createPreviewDecisionHistory();

const FIELD_LABELS: Readonly<Record<string, string>> = {
  "business.summary": "Business summary",
  "business.serviceArea": "Service area",
  "booking.routeLabel": "Booking route label",
};

const CONFLICT_LABELS = {
  none: "No conflict",
  existing_value: "Compare with profile",
  source_disagreement: "Sources disagree",
  stale_source_label: "Stale source label",
  provider_conflict: "Provider-owned fact",
} as const;

const DECISION_LABELS = {
  approved_for_profile_draft: "Approved for profile draft",
  rejected: "Rejected",
  needs_changes: "Needs changes",
} as const;

function sourceName(batch: SourceProposalBatch): string {
  return batch.source.kind === "business_website" ? "Business website" : "Booking route";
}

function displayValue(value: FactCandidate["value"]): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

export function SourceProposalPanel() {
  const titleId = useId();
  const drawerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [queuedIds, setQueuedIds] = useState<ReadonlySet<string>>(new Set());
  const batch = PREVIEW_BATCHES[sourceIndex] ?? PREVIEW_BATCHES[0];
  const totalCandidates = useMemo(
    () => PREVIEW_BATCHES.reduce((total, item) => total + item.candidates.length, 0),
    [],
  );

  useEffect(() => {
    if (!open) return;
    drawerRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  if (batch === undefined) return null;

  const selectSource = (index: number) => {
    setSourceIndex(index);
    setReviewingId(null);
  };

  const queueCandidate = (candidateId: string) => {
    setQueuedIds((current) => {
      const next = new Set(current);
      next.add(candidateId);
      return next;
    });
  };

  return (
    <>
      <button
        className={styles.launcher}
        type="button"
        aria-expanded={open}
        aria-controls="source-proposal-drawer"
        onClick={() => setOpen(true)}
      >
        <span className={styles.launcherMark} aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M4 6.5h10M4 12h16M4 17.5h8" />
            <circle cx="18" cy="6.5" r="2.5" />
          </svg>
        </span>
        <span>
          <strong>Source proposals</strong>
          <small>Owner review required</small>
        </span>
        <span className={styles.count} aria-label={`${totalCandidates} proposals`}>
          {totalCandidates}
        </span>
      </button>

      {open ? (
        <div className={styles.portal}>
          <button
            className={styles.backdrop}
            type="button"
            aria-label="Close source proposals"
            onClick={() => setOpen(false)}
          />
          <aside
            id="source-proposal-drawer"
            className={styles.drawer}
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
          >
            <header className={styles.header}>
              <div>
                <span className={styles.eyebrow}>Business Brain / test fixture</span>
                <h2 id={titleId}>Review source proposals</h2>
                <p>Source values stay provisional until an owner verifies them.</p>
              </div>
              <button
                className={styles.close}
                type="button"
                aria-label="Close source proposals"
                onClick={() => setOpen(false)}
              >
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </header>

            <div className={styles.notice}>
              <span className={styles.noticeDot} aria-hidden="true" />
              <div>
                <strong>Synthetic, minimized data</strong>
                <p>No website is fetched and no value is applied automatically.</p>
              </div>
            </div>

            <div className={styles.sourceTabs} role="tablist" aria-label="Approved sources">
              {PREVIEW_BATCHES.map((item, index) => (
                <button
                  key={item.batchId}
                  type="button"
                  role="tab"
                  aria-selected={sourceIndex === index}
                  className={sourceIndex === index ? styles.sourceTabActive : styles.sourceTab}
                  onClick={() => selectSource(index)}
                >
                  <span>{sourceName(item)}</span>
                  <small>{item.candidates.length} proposed</small>
                </button>
              ))}
            </div>

            <section className={styles.provenance} aria-label="Source provenance">
              <div>
                <span>Source location</span>
                <strong>{batch.capture.sourceLocation}</strong>
              </div>
              <div>
                <span>Captured</span>
                <strong>18 Jul 2026, 1:35 PM IST</strong>
              </div>
              <div>
                <span>Extractor</span>
                <strong>
                  {batch.capture.extractor.id} v{batch.capture.extractor.version}
                </strong>
              </div>
            </section>

            <div className={styles.candidateList} aria-live="polite">
              {batch.candidates.map((candidate) => {
                const reviewing = reviewingId === candidate.candidateId;
                const queued = queuedIds.has(candidate.candidateId);
                return (
                  <article className={styles.candidate} key={candidate.candidateId}>
                    <div className={styles.candidateTopline}>
                      <span className={styles.fieldLabel}>
                        {FIELD_LABELS[candidate.fieldKey] ?? candidate.fieldKey}
                      </span>
                      <span className={styles.confidence}>
                        {Math.round(candidate.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className={styles.value}>{displayValue(candidate.value)}</p>
                    <div className={styles.candidateMeta}>
                      <span
                        className={
                          candidate.conflict.kind === "none"
                            ? styles.clearBadge
                            : styles.conflictBadge
                        }
                      >
                        {CONFLICT_LABELS[candidate.conflict.kind]}
                      </span>
                      <span>Provisional</span>
                    </div>
                    {candidate.conflict.detail ? (
                      <p className={styles.conflictDetail}>{candidate.conflict.detail}</p>
                    ) : null}
                    <button
                      className={styles.reviewButton}
                      type="button"
                      aria-expanded={reviewing}
                      onClick={() => setReviewingId(reviewing ? null : candidate.candidateId)}
                    >
                      {reviewing ? "Close comparison" : "Review proposal"}
                      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                    {reviewing ? (
                      <div className={styles.reviewArea}>
                        <div>
                          <span>Current verified value</span>
                          <strong>No verified value recorded</strong>
                        </div>
                        <div>
                          <span>Source proposal</span>
                          <strong>{displayValue(candidate.value)}</strong>
                        </div>
                        <button
                          type="button"
                          className={queued ? styles.queuedButton : styles.queueButton}
                          disabled={queued}
                          onClick={() => queueCandidate(candidate.candidateId)}
                        >
                          {queued ? "Queued for owner review" : "Queue for owner review"}
                        </button>
                        <small>
                          Queueing does not change the Business Profile or verify this fact.
                        </small>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <section className={styles.history} aria-labelledby="source-decision-history-title">
              <div className={styles.historyHeading}>
                <div>
                  <span className={styles.eyebrow}>Immutable review trail</span>
                  <h3 id="source-decision-history-title">Decision history</h3>
                </div>
                <span>{PREVIEW_DECISION_HISTORY.length} recorded</span>
              </div>
              {PREVIEW_DECISION_HISTORY.map((decision) => (
                <article key={decision.decisionId} className={styles.historyItem}>
                  <div>
                    <strong>{DECISION_LABELS[decision.outcome]}</strong>
                    <span>Owner / version {decision.decisionVersion}</span>
                  </div>
                  <span className={styles.notApplied}>Not applied</span>
                  <p>
                    {decision.reasonCode.replaceAll("_", " ").toLowerCase()} / 18 Jul 2026, 1:42 PM
                    IST
                  </p>
                </article>
              ))}
              <p className={styles.historyNote}>
                Synthetic preview only. A decision record never changes the Business Profile in the
                same operation.
              </p>
            </section>

            <footer className={styles.footer}>
              <span>{batch.status.replaceAll("_", " ")}</span>
              <strong>{batch.candidates.length} values need a decision</strong>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}
