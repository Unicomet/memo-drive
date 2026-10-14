import { SignIn } from "@clerk/nextjs";

// Clerk resumes here only if Google sign-in requires another step, such as MFA.
export default function ContinueSignInPage() {
  return (
    <SignIn
      routing="path"
      path="/sign-in/continue"
      signUpUrl="/sign-up/continue"
      fallbackRedirectUrl="/drive"
    />
  );
}
