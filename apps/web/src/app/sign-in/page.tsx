import { APP_NAME } from "@novussync/config";
import { redirect } from "next/navigation";

import { getAuthAccessMode } from "../../lib/auth/runtime";
import { safeAuthDestination } from "../../lib/auth/redirect";
import { createClient } from "../../lib/supabase/server";
import { requestMagicLink } from "./actions";
import styles from "./sign-in.module.css";

export const dynamic = "force-dynamic";

type SignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const statusMessages: Record<string, string> = {
  "check-email": "If this email has an active invitation, a secure sign-in link is on its way.",
  "invalid-email": "Enter a valid work email address.",
  "link-error": "That sign-in link is invalid or has expired. Request a new one.",
  unavailable: "Invitation sign-in is not active in this environment yet.",
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const parameters = await searchParams;
  const next = safeAuthDestination(firstValue(parameters.next));
  const state = firstValue(parameters.state);
  const mode = getAuthAccessMode();

  if (mode === "invite_only") {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) {
      redirect(next);
    }
  }

  return (
    <main className={`${styles.page} safe-shell`}>
      <a className={styles.skipLink} href="#sign-in-panel">
        Skip to sign in
      </a>

      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label={`${APP_NAME} home`}>
          <span className={styles.brandMark} aria-hidden="true">
            N
          </span>
          <span>{APP_NAME}</span>
        </a>
        <span className={styles.privateLabel}>Private workspace</span>
      </header>

      <section className={styles.stage} aria-labelledby="sign-in-title">
        <div className={styles.story}>
          <p className={styles.eyebrow}>Invitation-only access</p>
          <h1 id="sign-in-title">Your marketing work, with every decision accounted for.</h1>
          <p className={styles.intro}>
            Enter the email your workspace administrator invited. We will send a one-time link, so
            there is no password to remember.
          </p>

          <div className={styles.signalGrid} aria-label="Access safeguards">
            <div>
              <span>01</span>
              <p>No public registration</p>
            </div>
            <div>
              <span>02</span>
              <p>Workspace-scoped access</p>
            </div>
            <div>
              <span>03</span>
              <p>Human approval stays final</p>
            </div>
          </div>
        </div>

        <div className={styles.panel} id="sign-in-panel" tabIndex={-1}>
          <div className={styles.panelHeader}>
            <span className={styles.statusDot} aria-hidden="true" />
            <span>{mode === "invite_only" ? "Secure access ready" : "Access staged safely"}</span>
          </div>

          <div className={styles.formCopy}>
            <p className={styles.kicker}>Welcome back</p>
            <h2>Open your workspace</h2>
            <p>We only recognize email addresses invited by a NovusSync administrator.</p>
          </div>

          {state && statusMessages[state] ? (
            <p className={styles.notice} role="status">
              {statusMessages[state]}
            </p>
          ) : null}

          {mode === "invite_only" ? (
            <form className={styles.form} action={requestMagicLink}>
              <input name="next" type="hidden" value={next} />
              <label htmlFor="email">Work email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@company.com"
                required
                maxLength={254}
              />
              <button type="submit">Send secure link</button>
            </form>
          ) : (
            <button className={styles.disabledButton} type="button" disabled>
              Provider verification pending
            </button>
          )}

          <p className={styles.supportCopy}>
            Need access? Contact the person managing your NovusSync pilot.
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>Approval-controlled by design</span>
        <span>External effects remain denied</span>
      </footer>
    </main>
  );
}
