import assert from "node:assert/strict";
import { test } from "node:test";
import { getSignInRedirectUrl } from "../src/lib/sign-in-redirect.ts";

const origin = "https://memo-drive.example";

test("returns to the requested drive page after Google authentication", () => {
  assert.equal(
    getSignInRedirectUrl(`${origin}/dashboard/folder/123?view=list`, origin),
    "/dashboard/folder/123?view=list",
  );
  assert.equal(
    getSignInRedirectUrl("/dashboard/notes", origin),
    "/dashboard/notes",
  );
});

test("defaults to the drive without a requested page", () => {
  assert.equal(getSignInRedirectUrl(null, origin), "/drive");
});

test("rejects external destinations and sign-in redirect loops", () => {
  for (const value of [
    "https://other.example/dashboard/notes",
    "//other.example/dashboard/notes",
    "/\\other.example/dashboard/notes",
    "javascript:alert(1)",
    "/sign-in",
    "/sso-callback",
    "/dashboard/../sign-in",
  ]) {
    assert.equal(getSignInRedirectUrl(value, origin), "/drive");
  }
});
