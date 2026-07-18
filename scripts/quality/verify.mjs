import { spawnSync } from "node:child_process";

import { loadFoundationEnvironment } from "./foundation-env.mjs";
import { VERIFY_STAGES } from "./verification-contract.mjs";

const environment = await loadFoundationEnvironment();
const stages = ["verify:policy", ...VERIFY_STAGES];

for (const stage of stages) {
  process.stdout.write(`\n[verify] ${stage}\n`);
  const result = spawnSync("pnpm", ["run", stage], {
    cwd: new URL("../../", import.meta.url),
    env: environment,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
