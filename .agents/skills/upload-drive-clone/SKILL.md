---
name: upload-drive-clone
description: Upload local files to the user's Memo Drive clone through its CLI and return download links. Use when asked to upload to the drive clone or Memo Drive, including Git bundles. This is separate from Google Drive and chat attachments.
---

# Upload to Drive Clone

The CLI lives at `~/Projects/memo-drive/cli/memo.mjs`. Run it with Node from that repository. It loads credentials from the repository's `.env.local` and the selected account from `~/.config/memo-drive/account.json`; keep credential values out of output. If the checkout moved, locate `cli/memo.mjs` before continuing.

## Upload

1. Resolve the requested local file to an absolute path. For Git bundles, run `git bundle verify <file>` in the source repository. Check commit metadata when the request requires a particular identity or commit. Creating or rewriting commits is outside this skill's upload workflow.
2. Run `node cli/memo.mjs whoami` in the CLI repository. Use the selected account unless the user specified another. If no account is selected, use `account list`, then `account use <email-or-user-id>` when the intended account is unambiguous. Ask only if account selection blocks the upload.
3. Upload with the existing CLI:

   ```bash
   node cli/memo.mjs upload /absolute/path/to/file
   ```

   The default destination is the account's sole root folder. When the user specifies a folder, pass `--folder <id>`. `whoami` reports root folder IDs; if several roots exist and no destination can be inferred, ask which one. The CLI checks folder ownership and enforces its file size limit; inspect `node cli/memo.mjs help` and `cli/args.mjs` if needed.
4. Wait for the upload command to finish. Success returns JSON containing the persisted file `id`, `name`, `size`, `url`, `folderId`, `folderName`, and account `email`. Confirm the reported name and size match the intended file, then return a Markdown download link using `url` and name the destination folder. Deprecation warnings alone do not invalidate a successful result.

If a command fails before uploading, correct the local prerequisite and retry. If it fails or disconnects after storage upload may have started, inspect whether the file was saved before retrying: the CLI has no idempotency key and another upload may create a duplicate. Report uncertain results when they cannot be resolved. An explicit request to reupload authorizes a new copy.

Use this CLI for the requested Drive destination; sending a chat attachment does not put a file in Memo Drive. Keep an existing file's basename unless the user requests a different name.
