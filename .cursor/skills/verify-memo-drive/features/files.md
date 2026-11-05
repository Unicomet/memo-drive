# Files

Files lets a user add a file to the current folder, download it, and delete it. The newest file is listed first. The CLI can add a file to the root folder.

## Sub-features

- `files-upload-dropzone` uploads from the drop area.
- `files-upload-button` uploads from the button under the list.
- `files-upload-cli` uploads from the terminal.
- `files-download` downloads one file under its stored name.
- `files-download-images` downloads every image in the folder, or the images that are checked.
- `files-order` lists files newest-updated first, then folders.
- `files-delete` removes the file from the list and from storage.

## How to get to it (user POV)

- Open `/drive` so it lands on `/dashboard/folder/<rootFolder>`.
- Drop a file on `Choose file(s) or drag and drop`, or use the button under the list labeled `Choose File(s)`.
- Run `node cli/memo.mjs upload <file>`.
- Choose `Download <file name>` on that row.
- When the folder contains an image, choose `Download all images (<count>)`.
- Choose `Delete file` on that row.

## Driving it with memo-verify

Preconditions:

- `doctor` prints `ready`, `url`, and one `rootFolder`.
- The browser is signed in on that url and the folder page shows the file list. The subscription wall means upload, download, and delete are unreachable in the browser.
- The fixture file is named `verify-file-<run>.txt` and contains the text `verify-file`.
- `node cli/memo.mjs whoami` lists one root folder. More than one root requires `--folder <id>`.

- **Open the folder.** Open `$URL/drive`. The address is `$URL/dashboard/folder/<rootFolder>`. The drop area reads `Choose file(s) or drag and drop`. The button under the list reads `Choose File(s)`.
- **Upload from the drop area.** Give that drop area `verify-file-<run>.txt`. The toast reads `Upload complete!` and a row for that name appears.
- **Upload from the button.** Give `Choose File(s)` a second fixture `verify-file-button-<run>.txt`. The same toast appears and that name is a row.
- **Upload from the CLI.** Run `node cli/memo.mjs upload verify-file-<run>.txt`. Exit 0. Stdout includes `"name": "verify-file-<run>.txt"` and the doctor `rootFolder` as `folderId`. Reload the folder. That name is the first file row.
- **Download one file.** Choose `Download verify-file-<run>.txt`. The response is an attachment whose filename is exactly `verify-file-<run>.txt`, and the bytes are `verify-file`.
- **Download images.** If the folder has no image, this entry is unreachable. If it has images, choose `Download all images (<count>)`. The toast reads `Images downloaded`. Checking `Select all images` changes the button to `Download selected (<count>)`.
- **Delete.** On the `verify-file-<run>.txt` row, choose `Delete file`. The toast reads `File deleted successfully` and the row is gone. Repeat for the button fixture.
- **Proof.** Save the upload JSON without `email` or `ownerId`, the download filename, and a snapshot that shows the file name before delete.

## Gotchas

- The header field `Search in Drive` does not change the list. It is not search.
- The drop area and the lower button both accept up to 5 files, 512 MB each. A free account can be rejected with `Too many requests, free tier limit reached`. The toast is then `Upload failed`.
- CLI upload does not pass the subscription wall. A CLI success does not prove the drop area.
- Rows are files first, then folders. Each group is newest `updatedAt` first.
- `Download <name>` is unique per row. `Delete file` is not. Use the row whose name is the fixture.
- Delete has no confirm. It removes the UploadThing object and the database row. There is no CLI delete. If the browser delete cannot be driven, do not upload.
- Image rows also have `Select <name>`. Other file types do not.
- `Download all images` is absent when the folder has no image.
