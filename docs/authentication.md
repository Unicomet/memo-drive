# Google sign-in with Clerk

Visiting `/sign-in` starts Clerk's Google OAuth flow automatically. There is no
login button or provider selection step. Existing sessions go directly to the
drive, including when visiting the home page. Google may still ask the user to
choose a Google account or approve consent.

Clerk completes OAuth at `/sso-callback`, including creating accounts for new
users. If Clerk requires MFA or additional profile information, its continuation
pages handle those requirements. Protected drive links return to the requested
page after authentication. External redirect destinations are rejected.

## Keeping users signed in

The app keeps Clerk's standard browser session and automatic token refresh.
Session lifetime is an instance setting in Clerk, rather than a Next.js setting.
No session lifetime setting was changed by this code change.

For sessions that stay valid while users keep returning:

1. Open the correct development or production instance in the
   [Clerk Dashboard Sessions page](https://dashboard.clerk.com/~/sessions).
2. Enable **Inactivity timeout** and set a long duration supported by your plan.
3. Disable **Maximum lifetime** so active users are not periodically forced to
   authenticate again.
4. Save the settings. Configure both instances if needed.

Clerk requires at least one expiry setting to remain enabled. Custom session
durations require a paid plan in production. Clearing browser cookies, signing
out, session revocation, and browser cookie limits can still require another
login. An unlimited session cannot be guaranteed. See
[Clerk's session options](https://clerk.com/docs/guides/secure/session-options).

## Verification

- TypeScript and ESLint pass for the authentication changes.
- Redirect tests cover returning to a drive link and rejecting external URLs or
  authentication loops.
- Browser check: an existing localhost Clerk session bypassed sign-in and opened
  the user's drive.
- Browser check: a signed-out origin (`127.0.0.1`) automatically reached Google's
  account page without clicking an app login button or choosing a provider.
- The Google callback, first-time account creation, and MFA/profile continuation
  still require a complete login to verify end to end.
