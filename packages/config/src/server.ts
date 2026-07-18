import { parseClientConfig, type ClientConfig } from "./client.ts";
import { ConfigurationError } from "./errors.ts";
import type { ConfigurationIssue } from "./errors.ts";
import {
  parseHttpUrl,
  parseStrictBoolean,
  readOptional,
  readRequired,
  type EnvironmentSource,
} from "./internal.ts";
import { SensitiveValue } from "./sensitive-value.ts";

export const APP_ENVIRONMENTS = ["local", "test", "preview", "staging", "production"] as const;

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];
export type LogLevel = (typeof LOG_LEVELS)[number];
export type ExternalActionsMode = "deny";
export type AuthAccessMode = "disabled" | "invite_only";

export type ServerConfig = Readonly<{
  runtime: Readonly<{
    environment: AppEnvironment;
    nodeEnvironment: "development" | "test" | "production";
    appBaseUrl: string;
    releaseId: string;
    logLevel: LogLevel;
  }>;
  client: ClientConfig;
  auth: Readonly<{
    accessMode: AuthAccessMode;
  }>;
  safety: Readonly<{
    externalActions: ExternalActionsMode;
    useFakeAdapters: true;
    liveProviderTests: false;
  }>;
  persistence: Readonly<{
    databaseUrl?: SensitiveValue;
  }>;
  credentialEncryption: Readonly<{
    kmsKeyId?: string;
    localEncryptionKey?: SensitiveValue;
  }>;
}>;

const NODE_ENVIRONMENTS = ["development", "test", "production"] as const;
const FORBIDDEN_PROVIDER_KEY = /^(?:NEXT_PUBLIC_)?(?:META|FACEBOOK|WHATSAPP)_/i;

function isAppEnvironment(value: string): value is AppEnvironment {
  return APP_ENVIRONMENTS.some((candidate) => candidate === value);
}

function isLogLevel(value: string): value is LogLevel {
  return LOG_LEVELS.some((candidate) => candidate === value);
}

function isNodeEnvironment(value: string): value is ServerConfig["runtime"]["nodeEnvironment"] {
  return NODE_ENVIRONMENTS.some((candidate) => candidate === value);
}

function isAuthAccessMode(value: string): value is AuthAccessMode {
  return value === "disabled" || value === "invite_only";
}

export function parseAuthAccessMode(value: string | undefined): AuthAccessMode {
  const normalizedValue = value?.trim() || "disabled";
  if (isAuthAccessMode(normalizedValue)) {
    return normalizedValue;
  }

  throw new ConfigurationError([
    {
      key: "AUTH_ACCESS_MODE",
      reason: "must be disabled or invite_only",
    },
  ]);
}

function validateDatabaseUrl(
  value: string | undefined,
  issues: ConfigurationIssue[],
): SensitiveValue | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
      issues.push({
        key: "DATABASE_URL",
        reason: "must use the postgres or postgresql protocol",
      });
      return undefined;
    }
  } catch {
    issues.push({ key: "DATABASE_URL", reason: "must be a valid URL" });
    return undefined;
  }

  return SensitiveValue.from(value);
}

export function loadServerConfig(source: EnvironmentSource): ServerConfig {
  const issues: ConfigurationIssue[] = [];
  let clientConfig: ClientConfig | undefined;

  try {
    clientConfig = parseClientConfig(source);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      issues.push(...error.issues);
    } else {
      throw error;
    }
  }

  for (const [key, value] of Object.entries(source)) {
    if (value?.trim() && FORBIDDEN_PROVIDER_KEY.test(key)) {
      issues.push({
        key,
        reason: "is prohibited by the initial manual-channel boundary",
      });
    }
  }

  const appEnvironmentValue = readRequired(source, "APP_ENV", issues);
  const nodeEnvironmentValue = readRequired(source, "NODE_ENV", issues);
  const appBaseUrl = parseHttpUrl(
    readRequired(source, "APP_BASE_URL", issues),
    "APP_BASE_URL",
    issues,
  );
  const releaseId = readRequired(source, "RELEASE_ID", issues);
  const logLevelValue = readRequired(source, "LOG_LEVEL", issues);
  const externalActionsValue = readRequired(source, "EXTERNAL_ACTIONS_MODE", issues);
  const useFakeAdapters = parseStrictBoolean(
    readRequired(source, "USE_FAKE_ADAPTERS", issues),
    "USE_FAKE_ADAPTERS",
    issues,
  );
  const liveProviderTests = parseStrictBoolean(
    readRequired(source, "LIVE_PROVIDER_TESTS", issues),
    "LIVE_PROVIDER_TESTS",
    issues,
  );
  const authAccessModeValue = readOptional(source, "AUTH_ACCESS_MODE");

  let appEnvironment: AppEnvironment | undefined;
  if (appEnvironmentValue) {
    if (isAppEnvironment(appEnvironmentValue)) {
      appEnvironment = appEnvironmentValue;
    } else {
      issues.push({ key: "APP_ENV", reason: "has an unsupported value" });
    }
  }

  let nodeEnvironment: ServerConfig["runtime"]["nodeEnvironment"] | undefined;
  if (nodeEnvironmentValue) {
    if (isNodeEnvironment(nodeEnvironmentValue)) {
      nodeEnvironment = nodeEnvironmentValue;
    } else {
      issues.push({ key: "NODE_ENV", reason: "has an unsupported value" });
    }
  }

  let logLevel: LogLevel | undefined;
  if (logLevelValue) {
    if (isLogLevel(logLevelValue)) {
      logLevel = logLevelValue;
    } else {
      issues.push({ key: "LOG_LEVEL", reason: "has an unsupported value" });
    }
  }

  let authAccessMode: AuthAccessMode | undefined;
  try {
    authAccessMode = parseAuthAccessMode(authAccessModeValue);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      issues.push(...error.issues);
    } else {
      throw error;
    }
  }

  if (releaseId && !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(releaseId)) {
    issues.push({ key: "RELEASE_ID", reason: "has an unsupported format" });
  }

  if (externalActionsValue && externalActionsValue !== "deny") {
    issues.push({
      key: "EXTERNAL_ACTIONS_MODE",
      reason: "must remain deny during Phase 0",
    });
  }

  if (useFakeAdapters === false) {
    issues.push({
      key: "USE_FAKE_ADAPTERS",
      reason: "must remain true during Phase 0",
    });
  }

  if (liveProviderTests === true) {
    issues.push({
      key: "LIVE_PROVIDER_TESTS",
      reason: "must remain false during Phase 0",
    });
  }

  if (appBaseUrl && clientConfig && appBaseUrl !== clientConfig.appBaseUrl) {
    issues.push({
      key: "NEXT_PUBLIC_APP_BASE_URL",
      reason: "must match APP_BASE_URL",
    });
  }

  if (
    appEnvironment &&
    appBaseUrl &&
    (appEnvironment === "preview" ||
      appEnvironment === "staging" ||
      appEnvironment === "production") &&
    !appBaseUrl.startsWith("https://")
  ) {
    issues.push({
      key: "APP_BASE_URL",
      reason: "must use HTTPS outside local and test environments",
    });
  }

  if (appEnvironment === "test" && nodeEnvironment && nodeEnvironment !== "test") {
    issues.push({ key: "NODE_ENV", reason: "must be test when APP_ENV is test" });
  }

  if (
    appEnvironment &&
    (appEnvironment === "preview" ||
      appEnvironment === "staging" ||
      appEnvironment === "production") &&
    nodeEnvironment &&
    nodeEnvironment !== "production"
  ) {
    issues.push({
      key: "NODE_ENV",
      reason: "must be production for deployed environments",
    });
  }

  const databaseUrlValue = readOptional(source, "DATABASE_URL");
  if (
    appEnvironment &&
    appEnvironment !== "local" &&
    appEnvironment !== "test" &&
    !databaseUrlValue
  ) {
    issues.push({
      key: "DATABASE_URL",
      reason: "is required for deployed environments",
    });
  }
  const databaseUrl = validateDatabaseUrl(databaseUrlValue, issues);

  const kmsKeyId = readOptional(source, "CREDENTIAL_KMS_KEY_ID");
  const localEncryptionKeyValue = readOptional(source, "CREDENTIAL_ENCRYPTION_KEY");

  if (kmsKeyId && localEncryptionKeyValue) {
    issues.push({
      key: "CREDENTIAL_ENCRYPTION_KEY",
      reason: "cannot be combined with CREDENTIAL_KMS_KEY_ID",
    });
  }

  if (
    localEncryptionKeyValue &&
    appEnvironment &&
    appEnvironment !== "local" &&
    appEnvironment !== "test"
  ) {
    issues.push({
      key: "CREDENTIAL_ENCRYPTION_KEY",
      reason: "is permitted only in local or test environments",
    });
  }

  if (
    issues.length > 0 ||
    !clientConfig ||
    !appEnvironment ||
    !nodeEnvironment ||
    !appBaseUrl ||
    !releaseId ||
    !logLevel ||
    !authAccessMode ||
    externalActionsValue !== "deny" ||
    useFakeAdapters !== true ||
    liveProviderTests !== false
  ) {
    throw new ConfigurationError(issues);
  }

  return Object.freeze({
    runtime: Object.freeze({
      environment: appEnvironment,
      nodeEnvironment,
      appBaseUrl,
      releaseId,
      logLevel,
    }),
    client: clientConfig,
    auth: Object.freeze({ accessMode: authAccessMode }),
    safety: Object.freeze({
      externalActions: "deny" as const,
      useFakeAdapters: true as const,
      liveProviderTests: false as const,
    }),
    persistence: Object.freeze({ databaseUrl }),
    credentialEncryption: Object.freeze({
      kmsKeyId,
      localEncryptionKey: localEncryptionKeyValue
        ? SensitiveValue.from(localEncryptionKeyValue)
        : undefined,
    }),
  });
}

export { ConfigurationError } from "./errors.ts";
export type { ConfigurationIssue } from "./errors.ts";
export type { EnvironmentSource } from "./internal.ts";
export { REDACTED_VALUE, SensitiveValue } from "./sensitive-value.ts";
