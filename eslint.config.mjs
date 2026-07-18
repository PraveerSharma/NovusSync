import { fixupConfigRules } from "@eslint/compat";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const webFiles = ["apps/web/**/*.{js,jsx,ts,tsx}"];
const webNextVitals = fixupConfigRules(nextVitals).map((config) => {
  if (config.ignores && !config.files && !config.rules && !config.plugins) {
    return config;
  }

  return {
    ...config,
    files: webFiles,
    settings: {
      ...config.settings,
      react: { version: "19.2" },
    },
    rules: {
      ...config.rules,
      "@next/next/no-html-link-for-pages": "off",
    },
  };
});

export default defineConfig([
  ...webNextVitals,
  ...fixupConfigRules(nextTypescript),
  {
    files: ["packages/domain/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@novussync/*",
            "@supabase/*",
            "@vercel/*",
            "drizzle-orm",
            "next",
            "openai",
            "pg",
            "react",
          ],
        },
      ],
    },
  },
  {
    files: ["packages/application/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@novussync/db",
            "@novussync/integrations",
            "@novussync/ui",
            "@supabase/*",
            "@vercel/*",
            "drizzle-orm",
            "next",
            "openai",
            "pg",
            "react",
          ],
        },
      ],
    },
  },
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/coverage/**",
    "packages/db/drizzle/**",
    "prototype/**",
  ]),
]);
