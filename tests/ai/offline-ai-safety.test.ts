import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { loadServerConfig } from "@novussync/config/server";

const root = fileURLToPath(new URL("../../", import.meta.url));

test("Phase 0 deployable packages contain no production AI SDK", async () => {
  const manifests: string[] = [];

  for (const group of ["apps", "packages"]) {
    const entries = await readdir(path.join(root, group), { withFileTypes: true });
    for (const entry of entries.filter((candidate) => candidate.isDirectory())) {
      manifests.push(path.join(root, group, entry.name, "package.json"));
    }
  }

  for (const manifestPath of manifests) {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const runtimeDependencies = Object.keys({
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
    });

    assert.equal(
      runtimeDependencies.some((dependency) =>
        ["openai", "ai", "@ai-sdk/openai"].includes(dependency),
      ),
      false,
      `${path.relative(root, manifestPath)} unexpectedly enables a production AI runtime`,
    );
  }
});

test("an incidental provider key is not exposed through the Phase 0 config", () => {
  const config = loadServerConfig({
    NODE_ENV: "test",
    APP_ENV: "test",
    APP_BASE_URL: "http://localhost:3000",
    NEXT_PUBLIC_APP_BASE_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_only",
    RELEASE_ID: "offline-ai-test",
    LOG_LEVEL: "error",
    EXTERNAL_ACTIONS_MODE: "deny",
    USE_FAKE_ADAPTERS: "true",
    LIVE_PROVIDER_TESTS: "false",
    OPENAI_API_KEY: "synthetic-never-use",
  });

  assert.equal(JSON.stringify(config).includes("synthetic-never-use"), false);
  assert.equal(config.safety.externalActions, "deny");
});
