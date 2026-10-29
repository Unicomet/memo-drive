---
name: drive-clone-notes
description: Create or edit notes in Memo Drive using the drive-clone CLI. Use when asked to save something as a Memo Drive note or update an existing note; file uploads use upload-drive-clone instead.
---

# Memo Drive Notes

Use `node cli/memo.mjs` from `~/Projects/memo-drive`. It loads credentials from `.env.local` and the selected account from `~/.config/memo-drive/account.json`; keep credentials out of output. If the checkout moved, locate `cli/memo.mjs`.

Run `whoami` to confirm the selected account and `help` to discover current note commands. Use the selected account unless the user requests another; resolve missing selection with `account list` and `account use` when the intended account is unambiguous.

## Create

Save the user's content as a native note, rather than a local Markdown file or Drive file upload:

```bash
node cli/memo.mjs notes create --title 'Title' --description 'Note content'
```

Choose a concise title from context when none is given. Preserve command syntax and actual newlines. Pass content with proper shell quoting or an argument array; backticks and `$()` in note content must remain literal. For image attachments, use the supported `--image <absolute-path>` flag.

Wait for persisted JSON and check the returned title and description. Report the note title and ID; include a link only if an actual note URL is available.

## Edit

Resolve the target with `notes list` and read it with `notes show <note-id>` before changing it. Ask only if multiple matching notes make the target ambiguous. Preserve fields and attachments outside the requested change.

Check `help` and, if necessary, `cli/memo.mjs` for a supported text update command and its exact arguments. Use it when present, then read the note again to verify the requested change.

The CLI inspected when this skill was created supports `list`, `create`, `show`, and `attach`, but no title/description update command. If that remains true, report that editing is blocked by missing CLI support. Do not replace an edit with a duplicate note or bypass the CLI with direct database writes. Implement CLI editing only when the user authorizes that development work.

To add images to an existing note, use `notes attach <note-id> <absolute-image-path>` and verify the returned attachments.

## Recover from uncertain writes

If creation fails after persistence may have occurred, inspect `notes list` and `notes show` before retrying to avoid duplicates. For attachment failures, inspect the saved note before retrying. Report uncertain outcomes if they cannot be resolved.
