const [stage = "unknown-stage", owner = "unassigned"] = process.argv.slice(2);

process.stderr.write(
  `${stage} is not implemented yet. It remains release-blocking under ${owner}; no placeholder success is allowed.\n`,
);
process.exit(1);
