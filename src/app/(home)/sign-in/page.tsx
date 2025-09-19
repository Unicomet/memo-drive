import { SignInButton } from "@clerk/nextjs";
import { Button } from "~/components/ui/button";

export default function SingInPage() {
  return (
    <>
      <div className="mb-8 text-3xl">Sign In Page</div>
      <Button asChild>
        <SignInButton forceRedirectUrl={"/drive"} />
      </Button>
      <footer className="mt-12">
        © {new Date().getFullYear()} Memo Drive. All rights reserved.
      </footer>
    </>
  );
}
