import { defineConfig, devices } from "@playwright/test";

const publicPort = 3100;
const invitePort = 3101;
const publicBaseURL = `http://127.0.0.1:${publicPort}`;
const inviteBaseURL = `http://127.0.0.1:${invitePort}`;

function foundationEnvironment(baseURL: string, authAccessMode: "disabled" | "invite_only") {
  return {
    NODE_ENV: "production",
    APP_ENV: "local",
    APP_BASE_URL: baseURL,
    NEXT_PUBLIC_APP_BASE_URL: baseURL,
    NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_only",
    RELEASE_ID: `playwright-${authAccessMode}`,
    LOG_LEVEL: "error",
    EXTERNAL_ACTIONS_MODE: "deny",
    USE_FAKE_ADAPTERS: "true",
    LIVE_PROVIDER_TESTS: "false",
    AUTH_ACCESS_MODE: authAccessMode,
  };
}

export default defineConfig({
  testDir: "./specs",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  outputDir: "test-results",
  use: {
    baseURL: publicBaseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } },
      testIgnore: /auth-enabled\.spec\.ts/,
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
      testIgnore: /auth-enabled\.spec\.ts/,
    },
    {
      name: "auth-desktop-chromium",
      testMatch: /auth-enabled\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: inviteBaseURL,
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "auth-mobile-chromium",
      testMatch: /auth-enabled\.spec\.ts/,
      use: { ...devices["Pixel 7"], baseURL: inviteBaseURL },
    },
  ],
  webServer: [
    {
      command: `pnpm -C ../../apps/web exec next start --hostname 127.0.0.1 --port ${publicPort}`,
      url: publicBaseURL,
      reuseExistingServer: false,
      timeout: 120_000,
      env: foundationEnvironment(publicBaseURL, "disabled"),
    },
    {
      command: `pnpm -C ../../apps/web exec next start --hostname 127.0.0.1 --port ${invitePort}`,
      url: inviteBaseURL,
      reuseExistingServer: false,
      timeout: 120_000,
      env: foundationEnvironment(inviteBaseURL, "invite_only"),
    },
  ],
});
