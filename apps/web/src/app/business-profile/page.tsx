import type { Metadata } from "next";

import { BusinessProfileClient } from "./profile-client";
import styles from "./profile.module.css";

export const metadata: Metadata = {
  title: "Business profile | NovusSync",
  description: "Teach NovusSync the approved facts, boundaries, and booking route for a business.",
};

export default function BusinessProfilePage() {
  return (
    <div className={styles.pageShell}>
      <a className={styles.skipLink} href="#profile-main">
        Skip to profile editor
      </a>
      <header className={styles.topbar}>
        <a aria-label="NovusSync operations" className={styles.brand} href="/dashboard">
          <span aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          NovusSync
        </a>
        <p>
          <strong>Northstar Collective</strong>
          <span>Synthetic workspace</span>
        </p>
        <a className={styles.backLink} href="/dashboard">
          Back to operations
        </a>
      </header>
      <BusinessProfileClient />
    </div>
  );
}
