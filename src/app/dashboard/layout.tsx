"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Search, Moon, Sun, StickyNote, FolderOpen } from "lucide-react";
import { SignedIn, UserButton } from "@clerk/nextjs";
import ShareFileDialogProvider from "../_providers/shareFileDialog/share-file-dialog-provider";
import { DialogShareFile } from "./file/[fileId]/_components/dialog-share-file";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [searchQuery, setSearchQuery] = useState("");
  const isNotesPage = usePathname() === "/dashboard/notes";
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function refresh() {
      if (document.visibilityState === "visible") router.refresh();
    }

    const interval = window.setInterval(refresh, 1000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  // For theme toggle button - prevents hydration mismatch
  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <ShareFileDialogProvider>
      <div className="bg-background flex min-h-screen flex-col">
        <header className="border-border bg-card/50 border-b px-4 py-6 shadow-sm backdrop-blur-sm sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-8">
              <Link href="/drive" className="text-2xl font-semibold">
                Drive Clone
              </Link>
            </div>
            <div className="flex h-9 items-center gap-3 sm:gap-6">
              <Button variant="outline" asChild>
                <Link href={isNotesPage ? "/drive" : "/dashboard/notes"}>
                  {isNotesPage ? <FolderOpen /> : <StickyNote />}
                  {isNotesPage ? "Back to My Drive" : "Notes"}
                </Link>
              </Button>
              {!isNotesPage && (
                <div className="relative hidden w-full max-w-sm md:block">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="Search in Drive"
                    name="search-in-drive"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}

              {/* TODO: Change the height so that be the same as the input, the hypotesis is that the problem is the height of the button */}
              <Button
                className="h-full"
                variant="outline"
                size="icon"
                aria-label="Toggle theme"
                onClick={toggleTheme}
              >
                {isDark ? (
                  <Sun className="h-full w-full" />
                ) : (
                  <Moon className="h-full w-full" />
                )}
              </Button>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </header>
        <main className="flex flex-grow flex-col px-4 py-8 sm:px-8 lg:px-32">
          {children}
        </main>
      </div>
      <DialogShareFile />
      <Toaster
        theme={resolvedTheme as "dark" | "light" | "system" | undefined}
      />
    </ShareFileDialogProvider>
  );
}
