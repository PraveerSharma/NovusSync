export type ConfigurationIssue = Readonly<{
  key: string;
  reason: string;
}>;

export class ConfigurationError extends Error {
  readonly code = "INVALID_CONFIGURATION" as const;
  readonly issues: readonly ConfigurationIssue[];

  constructor(issues: readonly ConfigurationIssue[]) {
    const normalizedIssues = issues.map((issue) =>
      Object.freeze({ key: issue.key, reason: issue.reason }),
    );
    const keys = [...new Set(normalizedIssues.map((issue) => issue.key))];

    super(
      keys.length > 0
        ? `Invalid application configuration: ${keys.join(", ")}.`
        : "Invalid application configuration.",
    );

    this.name = "ConfigurationError";
    this.issues = Object.freeze(normalizedIssues);
  }
}
