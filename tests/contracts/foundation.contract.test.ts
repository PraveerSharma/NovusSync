import assert from "node:assert/strict";
import test from "node:test";

import {
  decideFoundationExternalEffect,
  FOUNDATION_EXTERNAL_EFFECTS,
} from "@novussync/application";
import { loadServerConfig } from "@novussync/config/server";

const safeEnvironment = {
  NODE_ENV: "test",
  APP_ENV: "test",
  APP_BASE_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_BASE_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_only",
  RELEASE_ID: "contract-test",
  LOG_LEVEL: "error",
  EXTERNAL_ACTIONS_MODE: "deny",
  USE_FAKE_ADAPTERS: "true",
  LIVE_PROVIDER_TESTS: "false",
} as const;

test("every declared Phase 0 external effect is denied deterministically", () => {
  for (const effect of FOUNDATION_EXTERNAL_EFFECTS) {
    const decision = decideFoundationExternalEffect({
      effect,
      workspaceId: "synthetic-workspace",
      correlationId: `contract-${effect}`,
    });

    assert.deepEqual(decision, {
      allowed: false,
      code: "FOUNDATION_EXTERNAL_EFFECTS_DENIED",
      effect,
      workspaceId: "synthetic-workspace",
      correlationId: `contract-${effect}`,
    });
    assert.ok(Object.isFrozen(decision));
  }
});

test("the runtime contract requires fake adapters and disables live provider tests", () => {
  const config = loadServerConfig(safeEnvironment);

  assert.equal(config.safety.externalActions, "deny");
  assert.equal(config.safety.useFakeAdapters, true);
  assert.equal(config.safety.liveProviderTests, false);
});
