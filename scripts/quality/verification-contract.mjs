export const VERIFY_STAGES = Object.freeze([
  "env:check",
  "format:check",
  "lint",
  "typecheck",
  "test:unit",
  "test:integration",
  "test:contract",
  "test:ai",
  "build",
  "test:e2e",
]);

export const CI_STAGE_ASSIGNMENTS = Object.freeze({
  "ci-verify": Object.freeze([
    "env:check",
    "format:check",
    "lint",
    "typecheck",
    "test:unit",
    "test:ai",
    "build",
  ]),
  "ci-integration": Object.freeze(["test:integration"]),
  "ci-contract": Object.freeze(["test:contract"]),
  "ci-e2e": Object.freeze(["test:e2e"]),
});
