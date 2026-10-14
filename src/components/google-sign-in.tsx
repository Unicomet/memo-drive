"use client";

import { useAuth, useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { getSignInRedirectUrl } from "~/lib/sign-in-redirect";

export function GoogleSignIn() {
  const { isLoaded: isSignInLoaded, signIn } = useSignIn();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const hasStarted = useRef(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isSignInLoaded || !isAuthLoaded) return;

    const redirectUrlComplete = getSignInRedirectUrl(
      new URLSearchParams(window.location.search).get("redirect_url"),
      window.location.origin,
    );

    if (isSignedIn) {
      router.replace(redirectUrlComplete);
      return;
    }

    // React Strict Mode may run the effect twice; start only one OAuth attempt.
    if (!signIn || hasStarted.current) return;
    hasStarted.current = true;

    void signIn
      .authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete,
      })
      .catch(() => setError(true));
  }, [isSignInLoaded, isAuthLoaded, isSignedIn, signIn, router]);

  return (
    <div className="space-y-4">
      {error ? (
        <>
          <p role="alert">Could not connect to Google. Please try again.</p>
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </>
      ) : (
        <p role="status">Redirecting to Google…</p>
      )}
      <div id="clerk-captcha" />
    </div>
  );
}
