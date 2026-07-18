import { ConfigurationError } from "./errors.ts";
import type { ConfigurationIssue } from "./errors.ts";
import { parseHttpUrl, readRequired, type EnvironmentSource } from "./internal.ts";

export const CLIENT_ENV_KEYS = [
  "NEXT_PUBLIC_APP_BASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

export type ClientEnvironmentKey = (typeof CLIENT_ENV_KEYS)[number];

export type ClientConfig = Readonly<{
  appBaseUrl: string;
  auth: Readonly<{
    provider: "supabase";
    projectUrl: string;
    publishableKey: string;
  }>;
}>;

const CLIENT_ENV_KEY_SET = new Set<string>(CLIENT_ENV_KEYS);

const VERCEL_FRAMEWORK_ENV_KEYS = new Set([
  "NEXT_PUBLIC_VERCEL_BRANCH_URL",
  "NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID",
  "NEXT_PUBLIC_VERCEL_ENV",
  "NEXT_PUBLIC_VERCEL_GIT_COMMIT_AUTHOR_LOGIN",
  "NEXT_PUBLIC_VERCEL_GIT_COMMIT_AUTHOR_NAME",
  "NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE",
  "NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF",
  "NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA",
  "NEXT_PUBLIC_VERCEL_GIT_PREVIOUS_SHA",
  "NEXT_PUBLIC_VERCEL_GIT_PROVIDER",
  "NEXT_PUBLIC_VERCEL_GIT_PULL_REQUEST_ID",
  "NEXT_PUBLIC_VERCEL_GIT_REPO_ID",
  "NEXT_PUBLIC_VERCEL_GIT_REPO_OWNER",
  "NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG",
  "NEXT_PUBLIC_VERCEL_OBSERVABILITY_CLIENT_CONFIG",
  "NEXT_PUBLIC_VERCEL_PROJECT_ID",
  "NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL",
  "NEXT_PUBLIC_VERCEL_SKEW_PROTECTION_ENABLED",
  "NEXT_PUBLIC_VERCEL_TARGET_ENV",
  "NEXT_PUBLIC_VERCEL_URL",
]);

export function parseClientConfig(source: EnvironmentSource): ClientConfig {
  const issues: ConfigurationIssue[] = [];

  for (const key of Object.keys(source)) {
    if (
      key.startsWith("NEXT_PUBLIC_") &&
      !CLIENT_ENV_KEY_SET.has(key) &&
      !VERCEL_FRAMEWORK_ENV_KEYS.has(key)
    ) {
      issues.push({ key, reason: "is not allow-listed for browser exposure" });
    }
  }

  const appBaseUrl = parseHttpUrl(
    readRequired(source, "NEXT_PUBLIC_APP_BASE_URL", issues),
    "NEXT_PUBLIC_APP_BASE_URL",
    issues,
  );
  const projectUrl = parseHttpUrl(
    readRequired(source, "NEXT_PUBLIC_SUPABASE_URL", issues),
    "NEXT_PUBLIC_SUPABASE_URL",
    issues,
  );
  const publishableKey = readRequired(source, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", issues);

  if (projectUrl && !projectUrl.startsWith("https://")) {
    issues.push({ key: "NEXT_PUBLIC_SUPABASE_URL", reason: "must use HTTPS" });
  }

  if (issues.length > 0 || !appBaseUrl || !projectUrl || !publishableKey) {
    throw new ConfigurationError(issues);
  }

  return Object.freeze({
    appBaseUrl,
    auth: Object.freeze({
      provider: "supabase" as const,
      projectUrl,
      publishableKey,
    }),
  });
}

export { ConfigurationError } from "./errors.ts";
export type { ConfigurationIssue } from "./errors.ts";
export type { EnvironmentSource } from "./internal.ts";
