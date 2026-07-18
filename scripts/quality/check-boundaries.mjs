import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const sourceExtensions = new Set([".js", ".mjs", ".ts", ".tsx"]);
const errors = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (["node_modules", ".next", "dist", "coverage"].includes(entry.name)) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolutePath)));
    } else if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
}

const files = [
  ...(await walk(path.join(root, "apps"))),
  ...(await walk(path.join(root, "packages"))),
];

for (const file of files) {
  const relativePath = path.relative(root, file);
  const source = await readFile(file, "utf8");

  if (/@marketing-agency|@amplyvo/.test(source)) {
    errors.push(`${relativePath}: stale package namespace.`);
  }

  if (
    relativePath.startsWith(`packages${path.sep}domain${path.sep}`) &&
    /(?:from|import\s*)\s*["']@novussync\//.test(source)
  ) {
    errors.push(`${relativePath}: domain cannot import another workspace package.`);
  }

  if (
    relativePath.startsWith(`packages${path.sep}application${path.sep}`) &&
    /["']@novussync\/(?:db|integrations|ui)["']/.test(source)
  ) {
    errors.push(`${relativePath}: application cannot import an adapter or UI package.`);
  }

  if (
    (relativePath.startsWith(`packages${path.sep}domain${path.sep}`) ||
      relativePath.startsWith(`packages${path.sep}application${path.sep}`)) &&
    /["'](?:@supabase\/|@vercel\/|drizzle-orm|next|openai|pg|react)/.test(source)
  ) {
    errors.push(`${relativePath}: provider/framework dependency crossed a core boundary.`);
  }
}

const packageDirectories = await readdir(path.join(root, "packages"), {
  withFileTypes: true,
});
for (const directory of packageDirectories.filter((entry) => entry.isDirectory())) {
  const manifestPath = path.join(root, "packages", directory.name, "package.json");
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      continue;
    }
    throw error;
  }

  if (!manifest.name?.startsWith("@novussync/")) {
    errors.push(`${path.relative(root, manifestPath)}: package must use @novussync scope.`);
  }

  const dependencies = {
    ...manifest.dependencies,
    ...manifest.optionalDependencies,
  };
  for (const dependency of Object.keys(dependencies)) {
    if (/^(?:@meta\/|facebook|whatsapp)/i.test(dependency)) {
      errors.push(`${path.relative(root, manifestPath)}: prohibited Meta runtime dependency.`);
    }
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}

process.stdout.write("Workspace package and provider boundaries are intact.\n");
