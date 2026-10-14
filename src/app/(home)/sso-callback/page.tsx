"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SsoCallbackPage() {
  return (
    <>
      <p role="status">Completing your Google sign-in…</p>
      <AuthenticateWithRedirectCallback
        signInUrl="/sign-in/continue"
        signUpUrl="/sign-up/continue"
        signInFallbackRedirectUrl="/drive"
        signUpFallbackRedirectUrl="/drive"
      />
      <div id="clerk-captcha" />
    </>
  );
}
