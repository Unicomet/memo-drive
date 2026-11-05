# Open the drive

Open the drive lets a signed-out visitor start sign-in, and a signed-in user land in their root folder. An account with no root folder can create one.

## Sub-features

- `open-home` shows the signed-out home page.
- `open-sign-in` sends the visitor to Google.
- `open-root` sends a signed-in user to their root folder.
- `open-create` creates the root folder when the account does not have one.

## How to get to it (user POV)

- Open `/`. The heading is `Memo Drive`. Choose `Get Started`.
- Open `/sign-in`.
- Open `/drive`, or choose `Drive Clone` or `My Drive`.
- If the account has no root folder, `/drive` shows `Create New Drive`.

## Driving it with memo-verify

Preconditions:

- `doctor` prints `ready` and a `url`.
- `open-root` needs a signed-in browser on that url. `Redirecting to Google…` means that entry is unreachable.
- `open-create` needs `node cli/memo.mjs whoami` to print `"rootFolders": []`. The current account has a root folder, so this entry stays unreachable until an account without one is selected.

- **Signed-out home.** Open `$URL/`. The heading reads `Memo Drive` and the button reads `Get Started`.
- **Start sign-in.** Choose `Get Started` while signed out. The page is `/sign-in` and the status reads `Redirecting to Google…`. Stop there.
- **Sign-in failure.** If the alert `Could not connect to Google. Please try again.` is visible, choose `Try again`. The status returns to `Redirecting to Google…` or the alert stays. Record which one happened.
- **Land in the root.** From a signed-in page, open `$URL/drive`. The address becomes `$URL/dashboard/folder/<rootFolder>` from doctor, or the page shows the subscription message in Gotchas.
- **Create the first drive.** Only when `rootFolders` is empty, open `$URL/drive` and choose `Create New Drive`. The address becomes `$URL/dashboard/folder/<new id>` and `whoami` lists one folder named `Root`.
- **Proof.** Save the final URL and the visible heading. For the signed-out page, the snapshot contains `Memo Drive` and `Get Started`.

## Gotchas

- Cookie-less `GET /drive` and `GET /dashboard/notes` are 404 with `x-clerk-auth-status: signed-out`. A browser that already has the Clerk dev cookie is redirected to `/sign-in` instead.
- `/sign-in` starts Google OAuth on its own. Do not invent a password on that page.
- A signed-in visit to `/` also redirects to `/drive`.
- A paid account sees the folder. A free account sees `You need an active subscription to access your drive.` and a link named `here` to `/pricing`, then the page refreshes to `/pricing` after 5 seconds. `Please upgrade your plan.` is the other form of that wall. Neither form is the file list.
- `Create New Drive` is only rendered when the account has no root folder. Choosing it on an account that already has one is not possible from this screen.
- The folder created here is named `Root`. It is the account's real root, not a `verify-` fixture. Do not delete it.
