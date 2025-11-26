# copilot-instructions for drive-clone-2

Purpose: concise, actionable notes so an AI coding agent can be productive immediately.

1. Big-picture architecture

- **Framework**: Next.js (app router, Next 15+ style) with React server components in `src/app`.
- **Auth**: Clerk is used for auth; integrations live in `src/app/layout.tsx`, `src/middleware.ts`, and server helpers in `src/server/actions.ts`.
- **API layers**:
  - tRPC router for app APIs: `src/server/api/*` (`root.ts`, `trpc.ts`, `routers/*`). Add new routers in `src/server/api/routers` and import them into `src/server/api/root.ts`.
  - Next API routes for third-party libs: e.g. Uploadthing route at `src/app/api/uploadthing/route.ts` and router config at `src/app/api/uploadthing/core.ts`.
- **Database**: Drizzle ORM targeting SingleStore/MySQL. Schema in `src/server/db/schema.ts`, database helpers in `src/server/db/*`.
- **Storage/Uploads**: Uploadthing is used for file uploads; server-side hooks and cleanup are in `src/app/api/uploadthing/core.ts` and `src/server/db/queries.ts`.

2. Dev & build workflows (explicit commands)

- Use `pnpm` (see `package.json` and `packageManager`).
- Local dev: `pnpm install` then `pnpm dev` (runs `next dev --turbo`).
- Build / preview: `pnpm build` and `pnpm preview` or `pnpm start` after build.
- Typecheck & lint: `pnpm check` (runs `next lint && tsc --noEmit`), `pnpm lint`, `pnpm lint:fix`.
- Formatting: `pnpm format:check` / `pnpm format:write` (Prettier + plugin).

3. Database / migrations

- This project uses `drizzle-kit`. Useful scripts are in `package.json`:
  - `pnpm db:generate` — generate migration or client artifacts
  - `pnpm db:migrate` — run migrations
  - `pnpm db:push` — push schema
  - `pnpm db:studio` — run drizzle studio
- Config lives in `drizzle.config.ts`. Env schema for DB is in `src/env.js`. Update both when changing DB connection behavior.

4. Environment variables

- Copy `.env.example` to `.env` and fill values. The canonical env schema is enforced in `src/env.js` (server/client separation). If builds fail due to missing vars, either set them or run with `SKIP_ENV_VALIDATION=1`.

5. Project-specific conventions & patterns

- Router & API conventions:
  - tRPC `publicProcedure` is defined in `src/server/api/trpc.ts`. Use this and add middlewares there.
  - The primary server API router is `src/server/api/root.ts`; add new top-level routers there.
- DB helpers:
  - Prefer helper functions in `src/server/db/queries.ts` (`DB_QUERIES`, `DB_MUTATIONS`) instead of ad-hoc queries throughout the codebase.
- Uploads:
  - Upload validation and post-upload DB writes occur in `src/app/api/uploadthing/core.ts` via `middleware` and `onUploadComplete`.
- Server Actions & Edge cases:
  - Next server actions are used in `src/server/actions.ts` (prefixed with `"use server"`). They rely on Clerk `auth()` and often call DB helpers.
- Middleware:
  - `src/middleware.ts` protects `/dashboard(.*)` routes via Clerk middleware; API/trpc routes are always run per the matcher.

6. Integration points and gotchas

- tRPC client is created in `src/trpc/react.tsx`; it calls `/api/trpc` and uses `superjson` as the transformer.
- Uploadthing routes log headers in `src/app/api/uploadthing/route.ts` — useful for debugging third-party auth/proxy issues.
- Drizzle schema files are filtered by `tablesFilter` in `drizzle.config.ts` (prefix `drive_tutorial_*`). Changing table names requires updating this config.
- README is partially out-of-date (mentions Prisma). Prefer `drizzle` commands above.

7. When you edit code

- Run `pnpm build` or `pnpm check` to validate type errors and linting after substantive changes.
- If you add new server APIs, update `src/server/api/root.ts` and ensure any server-side imports (db, env) do not import client-only modules.

8. Quick references (files to open first)

- `src/app/layout.tsx` — app-level providers (Clerk, Uploadthing, PostHog, TRPC)
- `src/server/api/trpc.ts` — tRPC setup and middleware conventions
- `src/server/api/root.ts` — where to register routers
- `src/app/api/uploadthing/core.ts` — file upload flows
- `src/server/db/queries.ts` and `src/server/db/index.ts` — DB helpers and connection
- `drizzle.config.ts` and `.env.example` — DB config and envs
- `src/app` folder — main app code where lives frontend pages and components and api folder that contains trpc routes and uploadthing configuration.
