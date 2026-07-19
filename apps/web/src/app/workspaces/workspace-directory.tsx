import type { WorkspaceDirectoryPageData } from "../../lib/workspaces/page-data";

import styles from "./workspace-directory.module.css";

type WorkspaceDirectoryProps = Readonly<{
  data: WorkspaceDirectoryPageData;
}>;

export function WorkspaceDirectory({ data }: WorkspaceDirectoryProps) {
  return (
    <main className={styles.shell}>
      <div className={styles.orbit} aria-hidden="true" />
      <header className={styles.topbar}>
        <a className={styles.brand} href="/dashboard" aria-label="NovusSync dashboard">
          <span className={styles.brandMark}>N</span>
          <span>NovusSync</span>
        </a>
        <a className={styles.dashboardLink} href="/dashboard">
          Dashboard
        </a>
      </header>

      <section className={styles.intro} aria-labelledby="directory-title">
        <div>
          <p className={styles.eyebrow}>Workspace directory</p>
          <h1 id="directory-title">Choose where the work happens.</h1>
          <p className={styles.lede}>
            Every campaign, approval, and outcome stays inside one verified business workspace.
            Select a profile to continue with its approved context.
          </p>
        </div>
        {data.status === "ready" ? (
          <div className={styles.trustNote}>
            <span className={styles.trustDot} aria-hidden="true" />
            <span>
              {data.mode === "verified" ? "Identity verified" : "Synthetic Preview fixture"}
            </span>
          </div>
        ) : null}
      </section>

      {data.status === "unavailable" ? (
        <section className={styles.unavailable} aria-labelledby="directory-unavailable">
          <p className={styles.statusLabel}>Protected data unavailable</p>
          <h2 id="directory-unavailable">We did not guess your workspace.</h2>
          <p>{data.reason}</p>
          <a href="/dashboard">Return to dashboard</a>
        </section>
      ) : (
        <section className={styles.directory} aria-label="Accessible workspaces">
          <div className={styles.directoryMeta}>
            <p>
              <strong>{data.workspaces.length}</strong>{" "}
              {data.workspaces.length === 1 ? "workspace" : "workspaces"} available
            </p>
            <p>Least-privilege access</p>
          </div>

          {data.workspaces.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.statusLabel}>No active memberships</p>
              <h2>Your account is verified, but no workspace is assigned.</h2>
              <p>Ask the business owner to add your account before continuing.</p>
              <a href="/dashboard">Return to dashboard</a>
            </div>
          ) : (
            <div className={styles.workspaceGrid}>
              {data.workspaces.map((workspace, workspaceIndex) => (
                <article
                  className={styles.workspaceCard}
                  key={workspace.organizationId + ":" + workspace.workspaceId}
                  data-testid="workspace-card"
                >
                  <header className={styles.workspaceHeader}>
                    <div className={styles.workspaceNumber} aria-hidden="true">
                      {String(workspaceIndex + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <p className={styles.organizationName}>{workspace.organizationName}</p>
                      <h2>{workspace.workspaceName}</h2>
                    </div>
                    <span className={styles.roleBadge}>{workspace.roleLabel}</span>
                  </header>

                  {workspace.profiles.length === 0 ? (
                    <div className={styles.profileEmpty}>
                      <p>No business profile has been created for this workspace.</p>
                      <a href="/business-profile">Create business profile</a>
                    </div>
                  ) : (
                    <div className={styles.profileList}>
                      {workspace.profiles.map((profile) => (
                        <div className={styles.profileRow} key={profile.profileId}>
                          <div className={styles.profileIdentity}>
                            <span className={styles.profileMonogram} aria-hidden="true">
                              {profile.displayName.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <h3>{profile.displayName}</h3>
                              <p>{profile.playbookLabel}</p>
                            </div>
                          </div>

                          <dl className={styles.profileMetrics}>
                            <div>
                              <dt>Approved facts</dt>
                              <dd>{profile.approvedFactCount}</dd>
                            </div>
                            <div>
                              <dt>Draft</dt>
                              <dd>v{profile.draftVersion}</dd>
                            </div>
                            <div>
                              <dt>Last verified</dt>
                              <dd>{formatVerifiedDate(profile.lastVerifiedAt)}</dd>
                            </div>
                          </dl>

                          <div className={styles.profileActions}>
                            <a
                              className={styles.contextLink}
                              href={profile.contextHref}
                              aria-label={"Open approved context for " + profile.displayName}
                            >
                              <span>Approved context</span>
                              <span aria-hidden="true">↗</span>
                            </a>
                            <a
                              className={styles.freshnessLink}
                              href={profile.freshnessHref}
                              aria-label={"Review fact freshness for " + profile.displayName}
                            >
                              <span>Fact freshness</span>
                              <span aria-hidden="true">→</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <footer className={styles.footer}>
        <p>Only direct, active business memberships are shown.</p>
        <p>NovusSync / Campaign-to-outcome operations</p>
      </footer>
    </main>
  );
}

function formatVerifiedDate(value: string | null): string {
  if (value === null) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
