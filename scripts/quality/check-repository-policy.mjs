import { readFile, readdir } from "node:fs/promises";
import { basename, dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "playwright-report",
  "test-results",
]);

const forbiddenLockfiles = new Set([
  "bun.lock",
  "bun.lockb",
  "npm-shrinkwrap.json",
  "package-lock.json",
  "yarn.lock",
]);

const textExtensions = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".scss",
  ".sh",
  ".sql",
  ".svg",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

const explicitTextFiles = new Set([
  ".editorconfig",
  ".gitignore",
  ".npmrc",
  ".nvmrc",
  "Dockerfile",
]);

const expectedRuntime = Object.freeze({
  node: "24.18.0",
  packageManager: "pnpm@11.4.0",
  pnpm: "11.4.0",
});

const violations = [];

function report(path, message) {
  violations.push(`${path}: ${message}`);
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  entries.sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const absolutePath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function isTextFile(path) {
  return explicitTextFiles.has(basename(path)) || textExtensions.has(extname(path));
}

function validateRootManifest(path, manifest) {
  if (manifest.packageManager !== expectedRuntime.packageManager) {
    report(path, `packageManager must be ${expectedRuntime.packageManager}`);
  }

  if (manifest.engines?.node !== expectedRuntime.node) {
    report(path, `engines.node must be ${expectedRuntime.node}`);
  }

  if (manifest.engines?.pnpm !== expectedRuntime.pnpm) {
    report(path, `engines.pnpm must be ${expectedRuntime.pnpm}`);
  }

  if (
    manifest.scripts?.["policy:check"] !==
    "node scripts/quality/check-repository-policy.mjs && node scripts/quality/check-boundaries.mjs"
  ) {
    report(path, "policy:check must execute repository and architecture-boundary checks");
  }
}

function validateWorkspaceManifest(path, manifest) {
  if (manifest.name && !manifest.name.startsWith("@novussync/")) {
    report(path, "workspace package names must use the @novussync scope");
  }

  if (manifest.private !== true) {
    report(path, "workspace packages must remain private during Phase 0");
  }
}

function validateWorkflow(path, contents) {
  if (/pull_request_target\s*:/.test(contents)) {
    report(path, "pull_request_target is forbidden for verification workflows");
  }

  if (/continue-on-error\s*:\s*true/.test(contents)) {
    report(path, "verification failures may not be ignored");
  }

  if (/verification placeholder|foundation scaffolding exists/i.test(contents)) {
    report(path, "placeholder verification is forbidden");
  }

  for (const match of contents.matchAll(/^\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/gm)) {
    const reference = match[1];

    if (reference.startsWith("./")) {
      continue;
    }

    const version = reference.split("@").at(-1);
    if (!version || !/^[0-9a-f]{40}$/.test(version)) {
      report(path, `external action ${reference.split("@")[0]} must use an immutable commit SHA`);
    }
  }
}

const files = await collectFiles(repositoryRoot);

for (const absolutePath of files) {
  const path = relative(repositoryRoot, absolutePath) || basename(absolutePath);
  const fileName = basename(absolutePath);

  if (/^\.env(?:\.|$)/.test(fileName) && fileName !== ".env.example") {
    report(
      path,
      "local environment files are forbidden; use managed secrets and .env.example only",
    );
  }

  if (forbiddenLockfiles.has(fileName)) {
    report(path, "pnpm-lock.yaml is the only permitted dependency lockfile");
  }

  if (!isTextFile(absolutePath)) {
    continue;
  }

  const contents = await readFile(absolutePath, "utf8");

  if (/\bsk-(?:admin|proj|svcacct)-[A-Za-z0-9_-]{16,}\b/.test(contents)) {
    report(path, "an OpenAI secret-shaped value is present; the value was not printed");
  }

  if (fileName === "package.json") {
    let manifest;

    try {
      manifest = JSON.parse(contents);
    } catch {
      report(path, "package manifest is not valid JSON");
      continue;
    }

    if (absolutePath === resolve(repositoryRoot, "package.json")) {
      validateRootManifest(path, manifest);
    } else {
      validateWorkspaceManifest(path, manifest);
    }
  }

  if (path.startsWith(".github/workflows/") && [".yaml", ".yml"].includes(extname(path))) {
    validateWorkflow(path, contents);
  }
}

if (violations.length > 0) {
  console.error("Repository policy check failed:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Repository policy check passed.");
