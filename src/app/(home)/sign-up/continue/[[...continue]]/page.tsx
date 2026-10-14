import { SignUp } from "@clerk/nextjs";

// New Google accounts may need to complete required profile fields.
export default function ContinueSignUpPage() {
  return (
    <SignUp
      routing="path"
      path="/sign-up/continue"
      signInUrl="/sign-in"
      fallbackRedirectUrl="/drive"
    />
  );
}
