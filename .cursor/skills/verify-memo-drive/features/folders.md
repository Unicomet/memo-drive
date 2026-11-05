# Folders

Folders lets a user create a folder inside the current one, open it, and delete it.

## Sub-features

- `folders-create` creates a named folder in the current folder.
- `folders-open` opens that folder.
- `folders-delete` removes it.

## How to get to it (user POV)

- Open the current folder and choose `Create Folder`.
- Choose the new folder's name in the list.
- Choose the trash control on that folder's row.

## Driving it with memo-verify

Preconditions:

- `doctor` prints `ready`, `url`, and `rootFolder`.
- The browser is signed in and `$URL/dashboard/folder/<rootFolder>` shows the file list, not the subscription wall.
- No folder is named `verify-folder-<run>`.

- **Open the dialog.** Choose `Create Folder`. The dialog title is `Create a new folder`. The textbox placeholder is `Folder Name`.
- **Create.** Fill `Folder Name` with `verify-folder-<run>` and choose the `Create Folder` button inside the dialog. The dialog closes and the list shows a link named `verify-folder-<run>`.
- **Open.** Choose that link. The address is `$URL/dashboard/folder/<new id>` and the breadcrumb shows `verify-folder-<run>`.
- **Delete.** Go back to the parent. On the row whose link is `verify-folder-<run>`, choose the only button. The link disappears after refresh.
- **Proof.** Snapshot the parent list with `verify-folder-<run>` visible, then snapshot it again after delete with that name gone.

## Gotchas

- The header `Create Folder` and the dialog `Create Folder` share a name. The dialog one is the submit button.
- The dialog `Close` button submits the form, so it creates the folder. Press Escape to dismiss the dialog without creating.
- The label `Folder Name` is not tied to the input. The textbox is the one whose placeholder is `Folder Name`.
- The folder row's delete button has no accessible name and no confirm. It is the only button in the row. Delete only `verify-folder-<run>`.
- Folders are listed after files, newest first.
- An empty name still submits. Do not submit one.
