# Notes

Notes lets a signed-in user keep titled sticky notes, edit them, attach images, and remove them. The same title and description can be created and read from the terminal.

## Sub-features

- `notes-open` opens My Notes from the drive header.
- `notes-create` adds an empty note at the top of the board.
- `notes-save` stores a title and description and shows them again after a reload.
- `notes-attach` adds an image to that note from the card or the CLI.
- `notes-delete` removes the note after confirmation.
- `notes-cli` creates and reads the same note from the terminal.

## How to get to it (user POV)

- Choose `Notes` in the dashboard header. The heading is `My Notes`. On this page the same control reads `Back to My Drive`.
- Choose `New note`.
- Run `node cli/memo.mjs notes create --title "<title>" --description "<description>"`.
- Run `node cli/memo.mjs notes show <id>` or `node cli/memo.mjs notes list`.

## Driving it with memo-verify

Preconditions:

- `doctor` prints `ready` and a `url`.
- The browser entry needs a signed-in session on that url. `Redirecting to Google…` means this entry is unreachable.
- No note is titled `verify-note-<run>`.
- CLI commands use the account from `node cli/memo.mjs whoami`.

- **Open the board.** Choose `Notes`. The heading reads `My Notes`. An empty account shows `Your notes start here`.
- **Create in the browser.** Choose `New note`. The button reads `Creating…`, then a card named `Untitled note` appears with `Note title`, `Note description`, and the status `Saved`.
- **Save.** In that card, fill `Note title` with `verify-note-<run>` and `Note description` with `Saved from the browser`. Wait until the status reads `Saved`. Choose `Back to My Drive`, then `Notes`. The card shows both values.
- **Confirm the row.** Run `node cli/memo.mjs notes list` and keep the object whose title is `verify-note-<run>`. Its description is `Saved from the browser`.
- **Attach in the browser.** In that card, choose `Add images` and give `Attach images` a PNG under 8 MB. The card shows `Note attachment 1` and returns to `Saved`.
- **Create from the CLI.** Run `node cli/memo.mjs notes create --title "verify-note-<run>" --description "Saved from the CLI"`. Exit 0. Stdout is one JSON object with that title, that description, and `"images": []`.
- **Read it back.** Run `node cli/memo.mjs notes show <id>` with the id from create. Exit 0 and the same title and description.
- **See it in the list.** Run `node cli/memo.mjs notes list`. Exit 0. The matching object is the one just created. Leave every other object out of the artifact.
- **See it on the board.** Reload `$URL/dashboard/notes`. The card named `verify-note-<run>` shows `Saved from the CLI`.
- **Delete in the browser.** On that card, choose `Delete note` and accept `Delete this note? This cannot be undone.` The card disappears and a `Note deleted` toast shows. `node cli/memo.mjs notes show <id>` exits 1 and stderr contains `Note not found.`
- **Proof.** Save the create and show JSON, without `email` or `ownerId`, under `artifacts/notes/`. Save the list match the same way. For a browser pass, save an accessible-name snapshot and a screenshot that show `My Notes` and `verify-note-<run>`.
- **Remove the CLI fixture.** If the browser delete did not run, run `node .cursor/skills/verify-memo-drive/scripts/memo-verify.mjs note-delete <id>`. A second `notes show` exits 1.

## Gotchas

- Cookie-less `GET /dashboard/notes` is 404 with `x-clerk-auth-status: signed-out`. That is the gate, not a missing page.
- The board lists notes newest-created first. A CLI note appears at the top of an open tab within about a second.
- Status goes `Unsaved changes`, then `Saving…`, then `Saved` after the Save button, after leaving the card, or about 800 ms after typing. Wait for `Saved`.
- `Save` stays disabled when the status is `Saved`.
- Every card has a textbox named `Note title`. Act inside the article named `verify-note-<run>`, or `Untitled note` before the title is set.
- Titles can be 200 characters and descriptions 100,000. The CLI error is `Titles can have up to 200 characters and descriptions up to 100,000.`
- `Add images` allows 10 images, 8 MB each, image types only. Paste with Ctrl+V does the same. The CLI accepts `--image <file>` for png, jpg, gif, webp, and svg.
- Removing an image, or deleting the note row from the database, does not delete the UploadThing object. Skip attach unless the proof is about images.
- The CLI cannot delete a note. `note-delete` is cleanup for a `verify-` title, not the product's delete button.
- Do not delete a card whose title does not start with `verify-`.
