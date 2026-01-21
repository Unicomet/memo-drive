import { Button } from "../../components/ui/button";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default function HomePage() {
  return (
    <>
      <header className="mb-12 text-center">
        <h1 className="mb-6 font-sans text-6xl font-bold text-balance text-neutral-900 md:text-7xl">
          Memo Drive
        </h1>
        <p className="mx-auto max-w-2xl text-xl leading-relaxed text-pretty text-neutral-600 md:text-2xl">
          Your digital memory companion. Store, organize, and access your
          thoughts effortlessly.
        </p>
      </header>

      <main className="mb-16 text-center">
        <form
          action={async () => {
            "use server";
            const session = await auth();

            if (!session.userId) {
              redirect("/sign-in");
            }

            redirect("/drive");
          }}
        >
          <Button
            size="lg"
            type="submit"
            className="transform rounded-lg bg-neutral-900 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-neutral-800 hover:shadow-xl"
          >
            Get Started
          </Button>
        </form>
      </main>

      {/* Footer */}
      <footer className="text-center text-sm text-neutral-500">
        <p>&copy; 2024 Memo Drive. All rights reserved.</p>
      </footer>
    </>
  );
}
