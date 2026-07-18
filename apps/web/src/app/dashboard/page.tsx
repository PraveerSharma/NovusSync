import type { Metadata } from "next";

import { OperationsDashboard } from "./dashboard-client";
import styles from "./dashboard.module.css";

export const metadata: Metadata = {
  title: "Operations | NovusSync",
  description: "A synthetic campaign-to-outcome operating workspace for NovusSync.",
};

export default function DashboardPage() {
  return (
    <div className={styles.pageShell}>
      <header className={styles.topbar}>
        <a aria-label="NovusSync home" className={styles.brand} href="/">
          <span aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          NovusSync
        </a>
        <div className={styles.workspaceIdentity}>
          <span className={styles.workspaceMark}>NC</span>
          <span>
            <strong>Northstar Collective</strong>
            <small>Synthetic workspace</small>
          </span>
        </div>
        <div className={styles.topbarActions}>
          <span className={styles.guardrailPill}>
            <i aria-hidden="true" /> External effects denied
          </span>
          <button aria-label="Open command menu" className={styles.commandButton} type="button">
            <kbd>Cmd</kbd>
            <kbd>K</kbd>
          </button>
          <span aria-label="Signed in as preview operator" className={styles.operatorAvatar}>
            PS
          </span>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>
              <span>Operations</span> Saturday, 18 July
            </p>
            <h1>Keep every customer handoff moving.</h1>
            <p className={styles.heroCopy}>
              One accountable queue from campaign response to verified outcome. Your team keeps
              control; NovusSync keeps the next action visible.
            </p>
          </div>
          <div className={styles.heroNote}>
            <span aria-hidden="true">01</span>
            <p>
              <strong>Today&apos;s operating signal</strong>
              Two overdue follow-ups create more immediate risk than launching another campaign.
            </p>
          </div>
        </section>

        <div
          aria-label="Synthetic workspace with external effects denied"
          className={styles.safetyStrip}
        >
          <span>
            <i aria-hidden="true" /> Synthetic workspace
          </span>
          <span>External effects denied</span>
        </div>

        <OperationsDashboard />
      </main>
    </div>
  );
}
