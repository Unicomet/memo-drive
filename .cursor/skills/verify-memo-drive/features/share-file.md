# Share a file

Share a file lets the owner invite another Clerk user by email and see that person on the file.

## Sub-features

- `share-open` opens the share dialog for one file.
- `share-unknown` reports an email that is not a Clerk user and adds nobody.
- `share-member` invites an existing Clerk user and lists them.

## How to get to it (user POV)

- On a file row, choose `Share file`.
- The dialog title is `Share with other people`.
- Enter an email and choose `Share`.
- Choose `Close` to leave the dialog.

## Driving it with memo-verify

Preconditions:

- `doctor` prints `ready` and `rootFolder`.
- The browser is signed in and the folder page shows a file row. The subscription wall makes this feature unreachable.
- Use a file that already belongs to the account. Do not upload a fixture unless browser delete is available.
- `node cli/memo.mjs account list` shows the other Clerk users. `share-member` needs an email on that list other than the owner. One user in the list makes `share-member` unreachable.

- **Open.** On the row whose name is the file, choose `Share file`. The dialog title is `Share with other people`. The email textbox is `Email Address`. The empty list reads `No users have been invited yet.`
- **Unknown email.** Fill `Email Address` with `nobody-verify@example.com` and choose `Share`. The dialog stays open and the text is `Error sharing file: User not found`. The list still has no new person.
- **Existing user.** Fill `Email Address` with another email from `account list` and choose `Share`. Reopen `Share file` on the same row. The list contains that email.
- **Close.** Choose `Close`. The dialog is gone and the file row remains.
- **Proof.** Snapshot the unknown-email error. If a member was invited, snapshot the list that contains their email and record that the grant is still there.

## Gotchas

- `Share file` is the name of every file's button. Use the row whose link is the file name.
- `Share` looks up a Clerk user. An unknown email does not create an account.
- There is no unshare control. `share-member` leaves the grant in place. Prefer `share-unknown` unless the proof is the success path.
- `Close` does not share. It is not the `Close` button in the create-folder dialog.
- While people load, the dialog reads `Loading...`. Wait for the list or for `No users have been invited yet.`
- A load failure reads `Error loading invited users.` That is a failed read, not an empty share list.
