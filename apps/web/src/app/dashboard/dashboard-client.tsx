"use client";

import { useMemo, useState } from "react";

import { funnel, metrics, queueLeads, recentActivity, type QueueFilter } from "./dashboard-data";
import styles from "./dashboard.module.css";

const filters: Array<{ id: QueueFilter; label: string }> = [
  { id: "attention", label: "Needs attention" },
  { id: "today", label: "Due today" },
  { id: "approvals", label: "Approvals" },
  { id: "all", label: "All open" },
];

function filterLead(filter: QueueFilter, lead: (typeof queueLeads)[number]) {
  if (filter === "attention") return lead.dueState === "overdue" || lead.priority === "urgent";
  if (filter === "today") return lead.dueState === "today";
  if (filter === "approvals") return Boolean(lead.approval);
  return true;
}

function filterCount(filter: QueueFilter) {
  return queueLeads.filter((lead) => filterLead(filter, lead)).length;
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="M4 10h11M11 6l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <circle cx="8.5" cy="8.5" fill="none" r="5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m12.3 12.3 4 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function OperationsDashboard() {
  const [activeFilter, setActiveFilter] = useState<QueueFilter>("attention");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(queueLeads[0]?.id ?? "");

  const visibleLeads = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return queueLeads.filter((lead) => {
      const matchesFilter = filterLead(activeFilter, lead);
      const matchesQuery =
        !normalized ||
        [lead.name, lead.source, lead.campaign, lead.stage, lead.nextAction]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  const selectedLead =
    visibleLeads.find((lead) => lead.id === selectedId) ?? visibleLeads[0] ?? queueLeads[0];

  return (
    <>
      <section aria-label="Workspace summary" className={styles.metricGrid}>
        {metrics.map((metric) => (
          <article
            className={`${styles.metricCard} ${styles[`metric_${metric.tone}`]}`}
            key={metric.label}
          >
            <div className={styles.metricTopline}>
              <span>{metric.label}</span>
              <strong>{metric.trend}</strong>
            </div>
            <p className={styles.metricValue}>{metric.value}</p>
            <p className={styles.metricDetail}>{metric.detail}</p>
          </article>
        ))}
      </section>

      <div className={styles.workspaceGrid}>
        <section aria-labelledby="queue-heading" className={styles.queuePanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionLabel}>Daily operating queue</p>
              <h2 id="queue-heading">Move the next action, not the spreadsheet.</h2>
            </div>
            <span className={styles.syncStatus}>
              <i aria-hidden="true" /> Updated 2m ago
            </span>
          </div>

          <div className={styles.queueControls}>
            <nav aria-label="Queue filters" className={styles.filterBar}>
              {filters.map((filter) => (
                <button
                  aria-pressed={activeFilter === filter.id}
                  className={activeFilter === filter.id ? styles.filterActive : styles.filterButton}
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  type="button"
                >
                  {filter.label}
                  <span>{filterCount(filter.id)}</span>
                </button>
              ))}
            </nav>
            <label className={styles.searchField}>
              <span className={styles.srOnly}>Search open leads</span>
              <SearchIcon />
              <input
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search queue"
                type="search"
                value={query}
              />
            </label>
          </div>

          <div aria-hidden="true" className={styles.queueHeader}>
            <span>Customer</span>
            <span>Current stage</span>
            <span>Next action</span>
            <span>Owner</span>
          </div>

          <div aria-live="polite" className={styles.queueList}>
            {visibleLeads.length ? (
              visibleLeads.map((lead) => (
                <button
                  aria-pressed={selectedLead?.id === lead.id}
                  className={`${styles.leadRow} ${selectedLead?.id === lead.id ? styles.leadRowSelected : ""}`}
                  key={lead.id}
                  onClick={() => setSelectedId(lead.id)}
                  type="button"
                >
                  <span className={styles.leadIdentity}>
                    <span className={styles.avatar}>{lead.initials}</span>
                    <span>
                      <strong>{lead.name}</strong>
                      <small>{lead.source}</small>
                    </span>
                  </span>
                  <span className={styles.stageCell}>
                    <i aria-hidden="true" />
                    {lead.stage}
                    <small>{lead.campaign}</small>
                  </span>
                  <span className={styles.actionCell}>
                    <strong>{lead.nextAction}</strong>
                    <small className={styles[`due_${lead.dueState}`]}>{lead.dueLabel}</small>
                  </span>
                  <span className={styles.ownerCell}>
                    <span>{lead.assignee}</span>
                    <ArrowIcon />
                  </span>
                </button>
              ))
            ) : (
              <div className={styles.emptyState}>
                <strong>No matching work.</strong>
                <span>Try another queue or clear your search.</span>
              </div>
            )}
          </div>
        </section>

        <aside className={styles.sideRail}>
          <section aria-labelledby="focus-heading" className={styles.focusCard}>
            <div className={styles.focusTopline}>
              <p className={styles.sectionLabel}>Selected handoff</p>
              {selectedLead?.approval ? (
                <span className={styles.approvalBadge}>Approval needed</span>
              ) : (
                <span className={styles.readyBadge}>Rule-approved</span>
              )}
            </div>
            <h2 id="focus-heading">{selectedLead?.name}</h2>
            <p className={styles.focusContext}>{selectedLead?.context}</p>
            <dl className={styles.focusMeta}>
              <div>
                <dt>Stage</dt>
                <dd>{selectedLead?.stage}</dd>
              </div>
              <div>
                <dt>Owner</dt>
                <dd>{selectedLead?.assignee}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{selectedLead?.source}</dd>
              </div>
            </dl>
            <div className={styles.proposalBox}>
              <span>Proposed next action</span>
              <strong>{selectedLead?.nextAction}</strong>
              {selectedLead?.approval ? (
                <small>Decision required: {selectedLead.approval}</small>
              ) : (
                <small>Matches an approved workspace rule</small>
              )}
            </div>
            <button className={styles.primaryAction} type="button">
              Review proposal <ArrowIcon />
            </button>
            <p className={styles.localOnly}>Preview only. No external action is sent.</p>
          </section>

          <section aria-labelledby="funnel-heading" className={styles.funnelCard}>
            <div className={styles.cardTitleRow}>
              <div>
                <p className={styles.sectionLabel}>Four-week flow</p>
                <h2 id="funnel-heading">From interest to outcome</h2>
              </div>
              <span>Synthetic</span>
            </div>
            <div className={styles.funnelList}>
              {funnel.map((step) => (
                <div className={styles.funnelRow} key={step.label}>
                  <span>{step.label}</span>
                  <div>
                    <i style={{ width: `${step.percentage}%` }} />
                  </div>
                  <strong>{step.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="activity-heading" className={styles.activityCard}>
            <p className={styles.sectionLabel}>Audit-friendly activity</p>
            <h2 id="activity-heading">What changed</h2>
            <ol>
              {recentActivity.map((item) => (
                <li key={item.label}>
                  <i aria-hidden="true" />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <time>{item.time}</time>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}
