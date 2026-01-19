# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Google Drive clone built with Next.js 15 (App Router), featuring file/folder management, role-based permissions, and Stripe payments integration.

## Development Commands

**Essential workflow:**
```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (uses --turbo)
pnpm build            # Production build
pnpm check            # Run linting + typecheck (use before commits)
```

**Database operations:**
```bash
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema directly
pnpm db:studio        # Open Drizzle Studio
```

**Code quality:**
```bash
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix linting issues
pnpm typecheck        # TypeScript validation only
pnpm format:write     # Format with Prettier
```

## Architecture

### Tech Stack
- **Framework:** Next.js 15 with App Router and React Server Components
- **Database:** SingleStore (MySQL-compatible) with Drizzle ORM
- **Auth:** Clerk (session-based authentication)
- **Storage:** UploadThing for file uploads
- **API Layer:** tRPC for type-safe APIs + Next.js API routes for third-party integrations
- **Payments:** Stripe with webhooks
- **Analytics:** PostHog
- **Email:** Resend

### Key Architectural Patterns

**API Organization:**
- tRPC routers live in `src/server/api/routers/*` and are registered in `src/server/api/root.ts`
- Third-party service routes (UploadThing, Stripe) use Next.js API routes in `src/app/api/*`
- Server Actions in `src/server/actions.ts` handle auth-protected mutations

**Database Layer:**
- Schema defined in `src/server/db/schema.ts` with `drive_tutorial_*` table prefix
- Centralized query/mutation helpers in `src/server/db/queries.ts` via `DB_QUERIES` and `DB_MUTATIONS` objects
- **IMPORTANT:** Use these helpers instead of ad-hoc queries throughout the codebase

**Authentication & Authorization:**
- Clerk auth integrated via `src/app/layout.tsx` and `src/middleware.ts`
- Middleware protects `/dashboard(.*)` routes
- Permission system in `src/lib/auth.ts` with role-based access control (RBAC)
- Server Actions use `auth()` from Clerk to verify user identity

**File Upload Flow:**
1. UploadThing configuration in `src/app/api/uploadthing/core.ts`
2. Validation via `middleware` hook
3. Database writes in `onUploadComplete` hook
4. File deletion triggers cleanup in both UploadThing and database

### Critical Files

**Start here when working on:**
- **App providers/layout:** `src/app/layout.tsx` — Clerk, tRPC, PostHog, UploadThing providers
- **tRPC setup:** `src/server/api/trpc.ts` — procedure definitions and middleware
- **API registration:** `src/server/api/root.ts` — add new routers here
- **DB schema:** `src/server/db/schema.ts` — tables: files, folders, items_roles, items_roles_users
- **DB helpers:** `src/server/db/queries.ts` — use `DB_QUERIES`/`DB_MUTATIONS` objects
- **Upload handling:** `src/app/api/uploadthing/core.ts` — file upload lifecycle
- **Auth/permissions:** `src/lib/auth.ts` — `hasPermission()`, role checks
- **Server Actions:** `src/server/actions.ts` — user-facing mutations

## Database Schema

**Core tables:**
- `drive_tutorial_files` — file metadata (name, type, size, url, parent, ownerId)
- `drive_tutorial_folders` — folder hierarchy (name, parent, ownerId)
- `drive_tutorial_items_roles` — role definitions (role, roleDescription)
- `drive_tutorial_items_roles_users` — user-item-role assignments

**Schema changes:**
1. Edit `src/server/db/schema.ts`
2. Run `pnpm db:generate` to create migration
3. Run `pnpm db:push` or `pnpm db:migrate`
4. Update `DB_QUERIES`/`DB_MUTATIONS` in `src/server/db/queries.ts` if needed

## Environment Setup

1. Copy `.env.example` to `.env`
2. Required services:
   - **SingleStore:** `SINGLESTORE_HOST`, `SINGLESTORE_USER`, `SINGLESTORE_PASS`, `SINGLESTORE_DB_NAME`
   - **Clerk:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
   - **UploadThing:** `UPLOADTHING_TOKEN`
   - **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **PostHog:** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
   - **Resend:** `RESEND_API_KEY`
3. Environment schema enforced in `src/env.js` (T3 env validation)
4. Skip validation in CI: `SKIP_ENV_VALIDATION=1`

## Code Conventions

### From `.cursor/rules/rules.mdc`:

**TypeScript:**
- Prefer interfaces over types
- Avoid enums; use maps instead
- Use functional components with TypeScript interfaces

**Code Style:**
- Functional and declarative patterns; avoid classes
- Use `function` keyword for pure functions
- Descriptive variable names with auxiliary verbs (isLoading, hasError)
- Directory names: lowercase-with-dashes (e.g., `components/auth-wizard`)
- File structure: exported component → subcomponents → helpers → static content → types

**React Patterns:**
- Minimize `use client` — favor React Server Components
- Wrap client components in Suspense with fallback
- Use early returns and guard clauses
- Use Zod for form validation
- Model expected errors as return values in Server Actions

**UI:**
- Shadcn UI + Radix + Tailwind CSS
- Mobile-first responsive design
- Use `nuqs` for URL search parameter state management

## Adding New Features

**New tRPC endpoint:**
1. Create router in `src/server/api/routers/[name].ts`
2. Import and register in `src/server/api/root.ts`
3. Use `publicProcedure` from `src/server/api/trpc.ts`
4. Access via tRPC client in components

**New Server Action:**
1. Add to `src/server/actions.ts` with `"use server"` at top
2. Use `auth()` from Clerk for authentication
3. Call `DB_QUERIES`/`DB_MUTATIONS` helpers
4. Return `{ success, error }` objects for error handling

**New database query:**
1. Add function to `DB_QUERIES` or `DB_MUTATIONS` object in `src/server/db/queries.ts`
2. Follow existing patterns (use Drizzle query builder)
3. Add appropriate indexes if querying by new columns

## Common Pitfalls

- **Table prefix required:** All tables must use `drive_tutorial_*` prefix (see `drizzle.config.ts` tablesFilter)
- **Server-only imports:** Never import `src/server/*` or `src/env.js` server vars in client components
- **Permission checks:** Use `hasPermission()` from `src/lib/auth.ts` for authorization; don't just check ownership
- **File deletion:** Must clean up both database records AND UploadThing files (see `deleteFile` in `src/server/actions.ts`)
- **README outdated:** README mentions Prisma but project uses Drizzle

## Testing & Validation

After significant changes:
```bash
pnpm check    # Lint + typecheck
pnpm build    # Verify production build
```

If adding new server APIs, ensure no client-only module imports leak into server code.
