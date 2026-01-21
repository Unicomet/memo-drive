import { SignInButton } from "@clerk/nextjs";
import { Button } from "~/components/ui/button";

export default function SingInPage() {
  return (
    <>
      <div className="mb-8 text-3xl">Sign In Page</div>
      <Button
        asChild
        className="transform rounded-lg bg-neutral-900 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-neutral-800 hover:shadow-xl"
      >
        <SignInButton forceRedirectUrl={"/drive"} />
      </Button>
      <footer className="mt-12">
        © {new Date().getFullYear()} Memo Drive. All rights reserved.
      </footer>
    </>
  );
}
