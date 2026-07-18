import type { ConfigurationIssue } from "./errors.ts";

export type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export function readRequired(
  source: EnvironmentSource,
  key: string,
  issues: ConfigurationIssue[],
): string | undefined {
  const value = source[key]?.trim();

  if (!value) {
    issues.push({ key, reason: "is required" });
    return undefined;
  }

  return value;
}

export function readOptional(source: EnvironmentSource, key: string): string | undefined {
  const value = source[key]?.trim();
  return value ? value : undefined;
}

export function parseHttpUrl(
  value: string | undefined,
  key: string,
  issues: ConfigurationIssue[],
): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      issues.push({ key, reason: "must use HTTP or HTTPS" });
      return undefined;
    }

    if (url.username || url.password) {
      issues.push({ key, reason: "must not contain credentials" });
      return undefined;
    }

    if (url.search || url.hash) {
      issues.push({ key, reason: "must not contain a query or fragment" });
      return undefined;
    }

    if (url.pathname === "/") {
      return url.origin;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    issues.push({ key, reason: "must be an absolute URL" });
    return undefined;
  }
}

export function parseStrictBoolean(
  value: string | undefined,
  key: string,
  issues: ConfigurationIssue[],
): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  issues.push({ key, reason: "must be either true or false" });
  return undefined;
}
