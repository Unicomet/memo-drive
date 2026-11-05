---
name: verify-memo-drive
description: "Drive Memo Drive, the Next.js app and `node cli/memo.mjs`, and prove notes, files, folders, sharing, and sign-in. Use when a change needs a real user-path check, or when verify-memo-drive is named."
---

# Verify Memo Drive

Drive the signed-in product and keep the proof. The app is the dashboard at `/drive` and `/dashboard/*`, plus the CLI. Pricing, Stripe webhooks, and the marketing copy on `/` are outside this map.

Run every command from the repo root. The harness is `memo-verify`:

```bash
node .cursor/skills/verify-memo-drive/scripts/memo-verify.mjs <launch|doctor|cleanup|note-delete>
```

## Launch

Memo Drive has no empty local database. `.env.local` must already hold Clerk, SingleStore, UploadThing, Stripe, Resend, Upstash, QStash, Axiom, and PostHog. The CLI account is `~/.config/memo-drive/account.json`. Launch does not migrate or seed. A missing root folder means the account has never finished Create New Drive.

One Next dev server owns this checkout. A second `next dev` shares `.next` with the first. `launch` adopts the next process whose cwd is this repo and refuses to start another. Cleanup does not stop a server it did not start. There is no per-run data directory: SingleStore, Clerk, and UploadThing are the live account. One mutating verification at a time. Fixture titles and file names start with `verify-`.

When nothing for this checkout is listening, `launch` starts:

```bash
node .cursor/skills/verify-memo-drive/scripts/memo-verify.mjs launch
```

That runs `./node_modules/.bin/next dev --turbo -H 127.0.0.1 -p 3107` (override the port with `MEMO_VERIFY_PORT`) and waits until `GET /` returns the signed-out home page. Ready means that page is served, doctor passes, and `node cli/memo.mjs whoami` shows the selected user and at least one root folder. A process that only opens a port is not ready.

`launch` prints `launched`, `already-running`, or `using-existing`, then the same `ready` block as doctor. The dev script in `package.json` is `next dev --turbo`. `pnpm` is often absent; the harness calls the binary in `node_modules`.

## Doctor

Doctor is read-only. Run it before driving, and again when a page or command looks wrong.

```bash
node .cursor/skills/verify-memo-drive/scripts/memo-verify.mjs doctor
```

Exit 0 prints `ready` and `url`, `port`, `pid`, `owned`, `next`, `userId`, `email`, `rootFolder`, `rootName`. `owned=false` means the server was already running; cleanup will leave it up. Exit 1 prints `not-ready` and the failed check.

The checks are:

- The recorded pid is alive, its cwd is this repo, and its command is Next at the installed `next` version.
- That pid owns the recorded port. Doctor does not kill other listeners.
- `GET /` is 200 and contains `Memo Drive` and `Get Started`.
- Cookie-less `GET /dashboard/notes` is 404 with `x-clerk-auth-status: signed-out`. Clerk's dev protect-rewrite does that when the dev-browser cookie is missing. A 200 on that request means the gate failed.
- `GET /sign-in` is 200 and contains `Redirecting to Google`.
- `node cli/memo.mjs whoami` matches `account.json` and lists a root folder.

## Drive

Prefer the CLI for notes and uploads. Prefer the browser for everything the CLI cannot do: sign-in, folder pages, autosave, delete, share, and download.

Browser rules:

- Open `url` from doctor. Use accessible names, not coordinates.
- A cookie-less browser is not a signed-in session. `/sign-in` renders `Redirecting to Google…` and starts Google OAuth. If that status is on screen, stop. Report the browser entry unreachable and keep the CLI result separate.
- A signed-in browser on this host sends the Clerk cookie to every port. Stay on the doctor URL.
- Folder pages at `/dashboard/folder/<id>` require a paid subscription. `You need an active subscription to access your drive.` means the file list is not there. Notes do not check the subscription.
- Accept the confirm dialog `Delete this note? This cannot be undone.` only for a note titled `verify-…`.
- File and folder delete buttons have no confirm. Delete only a row whose name starts with `verify-`.

CLI, when `cli/memo.mjs` is in the checkout. If that file is absent, every CLI entry is unreachable:

```bash
node cli/memo.mjs whoami
node cli/memo.mjs notes create --title "<title>" --description "<description>"
node cli/memo.mjs notes show <id>
node cli/memo.mjs notes list
node cli/memo.mjs upload <file> [--folder <id>]
```

`notes list` and `whoami` print JSON. `notes create` and `notes show` print one note. `upload` prints one file. There is no CLI delete.

Read `features/README.md`, then only the feature file you are driving.

## Evidence

Write proof under `.cursor/skills/verify-memo-drive/artifacts/<feature-id>/`. That directory is gitignored. Cleanup does not remove it.

Record the command, the exit code, and the resulting state. For a mutation, read it back from a second view (`notes show`, a reloaded notes page, or the file row). A toast or a `Saved` status is not enough on its own.

Keep `id`, `title`, `description`, `images`, and `updatedAt` for a note. Keep `id`, `name`, `folderId`, and `url` for a file. Leave `email` and `ownerId` out of artifact files. From `notes list`, save the matching object only.

UI proof is an accessible-name snapshot plus a screenshot that shows `Drive Clone` or `My Notes` and the fixture title. Name the feature id in the artifact filename.

Mocks are out of bounds. The database and UploadThing are the real ones. A dry-run flag does not exist.

## Cleanup

```bash
node .cursor/skills/verify-memo-drive/scripts/memo-verify.mjs note-delete <id>
node .cursor/skills/verify-memo-drive/scripts/memo-verify.mjs cleanup
```

`note-delete` deletes one note owned by the selected account whose title starts with `verify-`. Any other title is an error and the row stays. Run it before `cleanup`, and run it after a failed notes attempt too.

`cleanup` stops the Next process only when `owned=true`, and only that pid. It then deletes `run/server.json` and `run/server.log`. It leaves an adopted server running. It does not delete artifacts, drive files, or UploadThing objects.

Browser file delete is the path that removes both the database row and the UploadThing object. If that path was not driven, do not upload a fixture file.

## Helpers

The script is executable.

| Command | What it prints on success |
| --- | --- |
| `launch` | `launched`, `already-running`, or `using-existing`, then the `ready` block |
| `doctor` | the `ready` block |
| `cleanup` | `stopped pid=<pid> port=<port>` or `left-running pid=<pid> port=<port>` |
| `note-delete <id>` | `deleted id=<id> title=<title>` |

```bash
node .cursor/skills/verify-memo-drive/scripts/memo-verify.mjs launch
node .cursor/skills/verify-memo-drive/scripts/memo-verify.mjs doctor
node .cursor/skills/verify-memo-drive/scripts/memo-verify.mjs note-delete 123
node .cursor/skills/verify-memo-drive/scripts/memo-verify.mjs cleanup
```
