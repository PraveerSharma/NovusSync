import type { FactReverificationPageData } from "../../../lib/fact-reverification/page-data";

import { reverifyFactAction } from "./actions";
import styles from "./fact-reverification.module.css";

export function FactReverificationWorkbench({
  data,
}: Readonly<{ data: FactReverificationPageData }>) {
  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/dashboard" aria-label="NovusSync dashboard">
          <span className={styles.brandMark}>N</span>
          <span>NovusSync</span>
        </a>
        <nav className={styles.nav} aria-label="Business profile">
          <a href="/workspaces">Workspaces</a>
          <a href="/business-profile/context">Approved context</a>
        </nav>
      </header>

      {data.status === "unavailable" ? (
        <section className={styles.unavailable} aria-labelledby="freshness-unavailable">
          <p className={styles.eyebrow}>Business Brain / Fact freshness</p>
          <h1 id="freshness-unavailable">No business context was assumed.</h1>
          <p>
            {data.reason === "scope_required"
              ? "Choose a verified business profile before opening its freshness queue."
              : "The protected freshness queue is temporarily unavailable. No unverified fact was shown."}
          </p>
          <a href="/workspaces">Choose a workspace</a>
        </section>
      ) : (
        <>
          <section className={styles.hero} aria-labelledby="freshness-title">
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Business Brain / Fact freshness</p>
              <h1 id="freshness-title">Keep every promise current.</h1>
              <p className={styles.lede}>
                Prices, offers, policies, claims, and booking routes expire after 30 days. An owner
                must confirm them again before NovusSync can reuse them externally.
              </p>
            </div>
            <div className={styles.policyStamp} aria-label="Freshness policy">
              <span>Policy</span>
              <strong>30</strong>
              <small>days</small>
            </div>
          </section>

          {data.notice ? (
            <div
              className={data.notice === "reverified" ? styles.successNotice : styles.errorNotice}
              role="status"
            >
              {data.notice === "reverified"
                ? "Fact reverified. A new immutable version is now current."
                : "Reverification was not saved. Refresh the queue and review the current version."}
            </div>
          ) : null}

          <section className={styles.metrics} aria-label="Freshness summary">
            <Metric value={data.expiredCount} label="Expired" tone="critical" />
            <Metric value={data.dueSoonCount} label="Due in 7 days" tone="warning" />
            <Metric value={data.currentCount} label="Current" tone="safe" />
            <div className={styles.modeMetric}>
              <span>Evidence mode</span>
              <strong>{data.mode === "verified" ? "Live workspace" : "Synthetic Preview"}</strong>
            </div>
          </section>

          <div className={styles.contentGrid}>
            <section className={styles.queue} aria-labelledby="attention-title">
              <header className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionIndex}>01 / Owner queue</p>
                  <h2 id="attention-title">Needs a decision</h2>
                </div>
                <p>Checked {formatDate(data.asOf)}</p>
              </header>

              {data.items.length === 0 ? (
                <div className={styles.empty}>
                  <h3>Every time-sensitive fact is current.</h3>
                  <p>Return to approved context to prepare the next campaign or customer reply.</p>
                  <a href="/business-profile/context">Open approved context</a>
                </div>
              ) : (
                <div className={styles.cardList}>
                  {data.items.map((item, index) => (
                    <article
                      className={styles.factCard}
                      data-freshness-status={item.status}
                      data-testid={"freshness-card-" + item.status}
                      key={item.factVersionId}
                    >
                      <div className={styles.cardRail} aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className={styles.cardBody}>
                        <header className={styles.cardHeader}>
                          <div>
                            <p>{item.categoryLabel}</p>
                            <h3>{item.fieldLabel}</h3>
                          </div>
                          <span className={styles.statusBadge}>{item.statusLabel}</span>
                        </header>
                        <blockquote>{item.valueText}</blockquote>
                        <dl className={styles.factMeta}>
                          <div>
                            <dt>Verified</dt>
                            <dd>{formatDate(item.verifiedAt)}</dd>
                          </div>
                          <div>
                            <dt>Expires</dt>
                            <dd>{formatDate(item.expiresAt)}</dd>
                          </div>
                          <div>
                            <dt>Source</dt>
                            <dd title={item.sourceReference}>{item.sourceLabel}</dd>
                          </div>
                          <div>
                            <dt>Version</dt>
                            <dd>v{item.version}</dd>
                          </div>
                        </dl>
                        {item.canReverify ? (
                          <form action={reverifyFactAction} className={styles.actionRow}>
                            <input
                              type="hidden"
                              name="organizationId"
                              value={data.scope.organizationId}
                            />
                            <input
                              type="hidden"
                              name="workspaceId"
                              value={data.scope.workspaceId}
                            />
                            <input type="hidden" name="profileId" value={data.scope.profileId} />
                            <input type="hidden" name="factVersionId" value={item.factVersionId} />
                            <input type="hidden" name="expectedVersion" value={item.version} />
                            <input
                              type="hidden"
                              name="idempotencyKey"
                              value={
                                "fact-reverification:" + item.factVersionId + ":" + item.version
                              }
                            />
                            <p>Confirm only if the approved value and source are still accurate.</p>
                            <button type="submit" disabled={data.mode !== "verified"}>
                              {data.mode === "verified"
                                ? "Confirm still accurate"
                                : "Owner action in live workspace"}
                            </button>
                          </form>
                        ) : (
                          <p className={styles.currentNote}>No action required yet.</p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className={styles.guardrail} aria-labelledby="guardrail-title">
              <p className={styles.sectionIndex}>02 / Guardrail</p>
              <h2 id="guardrail-title">What reverification does</h2>
              <ol>
                <li>Checks direct owner authority and an active session.</li>
                <li>Confirms the selected version is still current.</li>
                <li>Creates a new immutable version with the same approved evidence.</li>
                <li>Records actor, policy, expiry, and request in the audit log.</li>
              </ol>
              <div className={styles.guardrailCallout}>
                <strong>Expired means blocked.</strong>
                <p>History remains visible, but external-use retrieval cannot assert the value.</p>
              </div>
              <p className={styles.policyVersion}>{data.policyVersion}</p>
            </aside>
          </div>
        </>
      )}

      <footer className={styles.footer}>
        <p>Owner approval remains the final authority.</p>
        <p>No campaign or customer action is triggered here.</p>
      </footer>
    </main>
  );
}

function Metric({
  value,
  label,
  tone,
}: Readonly<{ value: number; label: string; tone: "critical" | "warning" | "safe" }>) {
  return (
    <div className={styles.metric} data-tone={tone} data-testid={"metric-" + tone}>
      <strong>{String(value).padStart(2, "0")}</strong>
      <span>{label}</span>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
