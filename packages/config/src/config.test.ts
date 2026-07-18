import assert from "node:assert/strict";
import { test } from "node:test";

import { parseClientConfig } from "./client.ts";
import { ConfigurationError, loadServerConfig, type EnvironmentSource } from "./server.ts";
import { REDACTED_VALUE, safeJsonStringify } from "./redaction.ts";

const validLocalEnvironment: EnvironmentSource = Object.freeze({
  NODE_ENV: "development",
  APP_ENV: "local",
  APP_BASE_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_BASE_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_only",
  RELEASE_ID: "test-release",
  LOG_LEVEL: "debug",
  EXTERNAL_ACTIONS_MODE: "deny",
  USE_FAKE_ADAPTERS: "true",
  LIVE_PROVIDER_TESTS: "false",
});

function captureConfigurationError(run: () => unknown): ConfigurationError {
  try {
    run();
    assert.fail("Expected configuration loading to fail.");
  } catch (error) {
    assert.ok(error instanceof ConfigurationError);
    return error;
  }
}

test("loads a valid Phase 0 local configuration", () => {
  const config = loadServerConfig(validLocalEnvironment);

  assert.equal(config.runtime.environment, "local");
  assert.equal(config.client.appBaseUrl, "http://localhost:3000");
  assert.equal(config.client.auth.provider, "supabase");
  assert.equal(config.client.auth.projectUrl, "https://synthetic.supabase.co");
  assert.equal(config.auth.accessMode, "disabled");
  assert.equal(config.safety.externalActions, "deny");
  assert.equal(config.safety.useFakeAdapters, true);
  assert.equal(config.safety.liveProviderTests, false);
});

test("accepts an explicit invite-only authentication boundary", () => {
  const config = loadServerConfig({
    ...validLocalEnvironment,
    AUTH_ACCESS_MODE: "invite_only",
  });

  assert.equal(config.auth.accessMode, "invite_only");
});

test("rejects an unknown authentication mode", () => {
  const error = captureConfigurationError(() =>
    loadServerConfig({
      ...validLocalEnvironment,
      AUTH_ACCESS_MODE: "public_signup",
    }),
  );

  assert.ok(error.issues.some((issue) => issue.key === "AUTH_ACCESS_MODE"));
});

test("requires HTTPS for the browser-visible Supabase project URL", () => {
  const error = captureConfigurationError(() =>
    parseClientConfig({
      ...validLocalEnvironment,
      NEXT_PUBLIC_SUPABASE_URL: "http://synthetic.supabase.co",
    }),
  );

  assert.ok(error.issues.some((issue) => issue.key === "NEXT_PUBLIC_SUPABASE_URL"));
});

test("rejects an accidental client-exposed variable without printing its value", () => {
  const canary = "postgresql://client-leak-canary";
  const error = captureConfigurationError(() =>
    parseClientConfig({
      ...validLocalEnvironment,
      NEXT_PUBLIC_DATABASE_URL: canary,
    }),
  );

  assert.ok(error.issues.some((issue) => issue.key === "NEXT_PUBLIC_DATABASE_URL"));
  assert.equal(error.message.includes(canary), false);
});

test("allows exact Vercel framework metadata without consuming it as product config", () => {
  const config = parseClientConfig({
    ...validLocalEnvironment,
    NEXT_PUBLIC_VERCEL_ENV: "preview",
    NEXT_PUBLIC_VERCEL_PROJECT_ID: "prj_synthetic",
    NEXT_PUBLIC_VERCEL_OBSERVABILITY_CLIENT_CONFIG: "synthetic-client-metadata",
  });

  assert.equal(config.appBaseUrl, "http://localhost:3000");
  assert.equal("vercel" in config, false);
});

test("requires a database secret for a deployed environment", () => {
  const error = captureConfigurationError(() =>
    loadServerConfig({
      ...validLocalEnvironment,
      NODE_ENV: "production",
      APP_ENV: "preview",
      APP_BASE_URL: "https://preview.example.com",
      NEXT_PUBLIC_APP_BASE_URL: "https://preview.example.com",
    }),
  );

  assert.ok(error.issues.some((issue) => issue.key === "DATABASE_URL"));
});

test("rejects live adapters, provider tests, and automated external actions", () => {
  const error = captureConfigurationError(() =>
    loadServerConfig({
      ...validLocalEnvironment,
      EXTERNAL_ACTIONS_MODE: "allow",
      USE_FAKE_ADAPTERS: "false",
      LIVE_PROVIDER_TESTS: "true",
    }),
  );

  assert.deepEqual(
    new Set(error.issues.map((issue) => issue.key)),
    new Set(["EXTERNAL_ACTIONS_MODE", "USE_FAKE_ADAPTERS", "LIVE_PROVIDER_TESTS"]),
  );
});

test("rejects Meta and WhatsApp credentials during the manual-channel phase", () => {
  const error = captureConfigurationError(() =>
    loadServerConfig({
      ...validLocalEnvironment,
      META_ACCESS_TOKEN: "provider-canary",
      WHATSAPP_API_TOKEN: "provider-canary",
    }),
  );

  assert.ok(error.issues.some((issue) => issue.key === "META_ACCESS_TOKEN"));
  assert.ok(error.issues.some((issue) => issue.key === "WHATSAPP_API_TOKEN"));
  assert.equal(error.message.includes("provider-canary"), false);
});

test("redacts secrets and lead PII from nested and circular payloads", () => {
  const payload: Record<string, unknown> = {
    safeStatus: "trial-booked",
    authorization: "Bearer token-canary",
    lead: {
      name: "Lead Canary",
      email: "lead@example.com",
      phone: "+91 98765 43210",
      rawMessage: "private customer conversation",
    },
    error: new Error("Contact lead@example.com with api_key=secret-canary"),
  };
  payload.self = payload;

  const serialized = safeJsonStringify(payload);

  assert.ok(serialized);
  assert.ok(serialized.includes("trial-booked"));
  assert.ok(serialized.includes(REDACTED_VALUE));
  assert.equal(serialized.includes("Lead Canary"), false);
  assert.equal(serialized.includes("lead@example.com"), false);
  assert.equal(serialized.includes("98765"), false);
  assert.equal(serialized.includes("secret-canary"), false);
  assert.ok(serialized.includes("[CIRCULAR]"));
});

test("server secrets serialize only as redacted markers", () => {
  const canary = "postgresql://user:database-canary@example.com/app";
  const config = loadServerConfig({
    ...validLocalEnvironment,
    DATABASE_URL: canary,
  });

  const serialized = JSON.stringify(config);
  assert.equal(serialized.includes(canary), false);
  assert.ok(serialized.includes(REDACTED_VALUE));
});
