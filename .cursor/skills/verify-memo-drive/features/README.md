# Memo Drive verification map

This directory is the maintained source for verifying Memo Drive. Read this index, then open the one feature file you are driving.

## Baseline preconditions

- Run `node .cursor/skills/verify-memo-drive/scripts/memo-verify.mjs launch` from the repo root.
- Run `doctor` and require `ready`, a `url`, the selected account, and a `rootFolder`.
- Drive that `url` only. `owned=false` means a Next server was already using this checkout. Leave it up.
- The account is the live Clerk user in `~/.config/memo-drive/account.json`. SingleStore and UploadThing are shared. One mutating run at a time.
- Name every fixture `verify-…`. A notes fixture is removed with `note-delete`. A file fixture is removed with the browser Delete control, which also deletes the stored object.

## Driving conventions

- Start from the baseline unless the feature file says otherwise.
- Use accessible names. Several rows repeat `Share file` and `Delete file`; choose the row whose link text is the file name.
- Treat commands and quoted names as literal.
- Browser actions use the doctor `url`. CLI actions use `node cli/memo.mjs`.
- Restore fixtures before you finish. Leave `artifacts/` in place.

## Proof and skip reporting

- Capture the action and the resulting state.
- UI proof is an accessible-name snapshot and a screenshot that shows the app and the fixture.
- CLI proof is the command, the exit code, and the JSON fields named in the skill's Evidence section.
- A mutation also needs a second read of the stored value.
- Record the feature id and the entry point with the artifact.
- An unreachable entry records the command you ran and the missing precondition. Another entry's success does not cover it.

## Feature entry contract

Each feature file has an H1, one opening paragraph, then exactly these H2 sections:

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with memo-verify`
4. `Gotchas`

## Features

- [Open the drive](./open-drive.md) covers the signed-out home page, Google sign-in, Create New Drive, and landing in the root folder.
- [Notes](./notes.md) covers creating, saving, listing, and deleting a note in the browser and from the CLI.
- [Files](./files.md) covers upload, download, ordering, and delete for files in a folder.
- [Folders](./folders.md) covers creating, opening, and deleting a folder.
- [Share a file](./share-file.md) covers the share dialog, an unknown email, and a real Clerk user.
