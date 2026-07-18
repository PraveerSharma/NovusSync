import { loadServerConfig } from "../../packages/config/src/server.ts";
import { loadFoundationEnvironment } from "./foundation-env.mjs";

const environment = await loadFoundationEnvironment();
const config = loadServerConfig(environment);

process.stdout.write(
  `Environment contract valid for ${config.runtime.environment}; external effects are ${config.safety.externalActions}.\n`,
);
