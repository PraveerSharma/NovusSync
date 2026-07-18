import { spawnSync } from "node:child_process";

import { loadFoundationEnvironment } from "./foundation-env.mjs";

const rawArgs = process.argv.slice(2);
let appEnvironmentOption;
let nodeEnvironmentOption;

while (rawArgs[0]?.startsWith("--")) {
  const option = rawArgs.shift();
  if (option?.startsWith("--app-env=")) {
    appEnvironmentOption = option.slice("--app-env=".length);
  } else if (option?.startsWith("--node-env=")) {
    nodeEnvironmentOption = option.slice("--node-env=".length);
  } else {
    process.stderr.write(`Unsupported option: ${option}\n`);
    process.exit(2);
  }
}

const [command, ...args] = rawArgs;

if (
  appEnvironmentOption &&
  !["local", "test", "preview", "staging", "production"].includes(appEnvironmentOption)
) {
  process.stderr.write("--app-env must be local, test, preview, staging, or production.\n");
  process.exit(2);
}

if (
  nodeEnvironmentOption &&
  !["development", "test", "production"].includes(nodeEnvironmentOption)
) {
  process.stderr.write("--node-env must be development, test, or production.\n");
  process.exit(2);
}

if (!command) {
  process.stderr.write("A command is required.\n");
  process.exit(2);
}

const environment = await loadFoundationEnvironment();
if (appEnvironmentOption) {
  environment.APP_ENV = appEnvironmentOption;
}
if (nodeEnvironmentOption) {
  environment.NODE_ENV = nodeEnvironmentOption;
}

const result = spawnSync(command, args, {
  env: environment,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
