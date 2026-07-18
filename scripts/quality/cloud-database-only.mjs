const [action = "manage"] = process.argv.slice(2);

process.stdout.write(
  `No local database process to ${action}. NovusSync uses an explicitly authorized, non-production Supabase project.\n`,
);
