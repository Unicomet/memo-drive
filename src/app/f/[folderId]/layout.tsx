"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Search, Moon, Sun } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    if (newIsDark) {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  };

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="border-border bg-card/50 border-b px-8 py-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <button>
              <Link href="/" className="text-2xl font-semibold">
                Drive Clone
              </Link>
            </button>
          </div>
          <div className="flex h-9 items-center space-x-6">
            <div className="relative w-full max-w-sm">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search in Drive"
                name="search-in-drive"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* TODO: Change the height so that be the same as the input, the hypotesis is that the problem is the height of the button */}
            <Button className="h-full" variant="outline" onClick={toggleTheme}>
              {isDark ? (
                <Sun className="h-full w-full" />
              ) : (
                <Moon className="h-full w-full" />
              )}
            </Button>
            <SignedOut>
              <SignInButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </header>
      <main className="mx- px- flex flex-grow flex-col px-32 py-8">
        {children}
      </main>
    </div>
  );
}
