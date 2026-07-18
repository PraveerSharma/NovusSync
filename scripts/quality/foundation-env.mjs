import { readFile } from "node:fs/promises";

const EXAMPLE_ENV_URL = new URL("../../.env.example", import.meta.url);

function parseEnvironmentFile(source) {
  const values = {};

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator < 1) {
      throw new Error("Invalid entry in .env.example.");
    }

    values[line.slice(0, separator)] = line.slice(separator + 1);
  }

  return values;
}

export async function loadFoundationEnvironment(inheritedEnvironment = process.env) {
  const example = parseEnvironmentFile(await readFile(EXAMPLE_ENV_URL, "utf8"));
  return { ...example, ...inheritedEnvironment };
}
