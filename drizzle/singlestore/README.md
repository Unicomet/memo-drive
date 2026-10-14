# SingleStore migrations

The parent `drizzle/meta` directory contains legacy SQLite metadata and is not used by the current SingleStore config. SingleStore migrations are generated and applied from this directory.

`0000_add_notes.sql` adds only `drive_tutorial_notes` and its account index to an existing Drive database. Its snapshot records the existing Drive tables as a baseline so future generated migrations do not attempt to recreate them. For a brand-new database, use `pnpm db:push` to provision the full schema first; do not apply this incremental migration afterward.

For an existing Drive database with credentials configured, run:

```bash
pnpm db:migrate
```

The notes feature needs this migration before use. The migration was applied successfully to the database configured by the Vercel development environment on October 14, 2026.
