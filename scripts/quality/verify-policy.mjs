import { readFile } from "node:fs/promises";

import { CI_STAGE_ASSIGNMENTS, VERIFY_STAGES } from "./verification-contract.mjs";

const packageJson = JSON.parse(
  await readFile(new URL("../../package.json", import.meta.url), "utf8"),
);
const scripts = packageJson.scripts ?? {};
const errors = [];

for (const stage of VERIFY_STAGES) {
  const command = scripts[stage];
  if (typeof command !== "string" || !command.trim()) {
    errors.push(`Missing root script for ${stage}.`);
    continue;
  }

  if (/^\s*(?:echo|true)(?:\s|$)/.test(command)) {
    errors.push(`${stage} is a false-success placeholder.`);
  }
}

const assignments = Object.values(CI_STAGE_ASSIGNMENTS).flat();
for (const stage of VERIFY_STAGES) {
  const count = assignments.filter((candidate) => candidate === stage).length;
  if (count !== 1) {
    errors.push(`${stage} must be assigned to exactly one required CI job; found ${count}.`);
  }
}

for (const stage of new Set(assignments)) {
  if (!VERIFY_STAGES.includes(stage)) {
    errors.push(`CI assigns unknown verification stage ${stage}.`);
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}

process.stdout.write("Verification policy assigns every required stage exactly once.\n");
