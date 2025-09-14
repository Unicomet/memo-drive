"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Upload, Search, ChevronRight, Moon, Sun } from "lucide-react";
import { cn } from "~/lib/utils";
import { FileRow, FolderRow } from "./file-row";
import type { files_table, folders_table } from "~/server/db/schema";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import type { OurFileRouter } from "~/app/api/uploadthing/core";
import { UploadButton } from "~/components/uploadthings";

export default function DriveContent(props: {
  files: (typeof files_table.$inferSelect)[];
  folders: (typeof folders_table.$inferSelect)[];
  folderParents: (typeof folders_table.$inferSelect)[];
  parentFolder: number;
}) {
  const navigate = useRouter();

  const { files, folders, folderParents: breadcrumbs } = props;

  const [searchQuery, setSearchQuery] = useState("");
  const [isDark, setIsDark] = useState(true);

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

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <header className="border-b border-border bg-card/50 px-8 py-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              Drive Clone
            </h1>
            <Button className="bg-accent px-6 py-2.5 font-medium text-accent-foreground shadow-md transition-all duration-200 hover:bg-accent/90 hover:shadow-lg">
              <Upload className="mr-2 h-4 w-4" />
              New Upload
            </Button>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search in Drive"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-96 border-border bg-background pl-12 transition-colors duration-200 focus:border-primary"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="h-11 w-11 border-border bg-transparent transition-colors duration-200 hover:bg-muted"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
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
      <main className="mx-auto max-w-7xl p-8">
        <nav className="mt-6 flex items-center space-x-3 border-t border-border py-6 text-sm">
          <Button
            variant="ghost"
            className="mr-2 cursor-pointer font-medium hover:text-white"
            asChild
          >
            <Link href="/f/1">My Drive</Link>
          </Button>
          {breadcrumbs.map((folder, index) => (
            <div key={index} className="flex items-center">
              <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />
              <button
                className={cn(
                  "rounded-md px-3 py-2 font-medium transition-colors duration-200",
                  index === breadcrumbs.length - 1
                    ? "bg-accent font-semibold text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Link href={`/f/${folder.id}`}>{folder.name}</Link>
              </button>
            </div>
          ))}
        </nav>
        <div className="space-y-2">
          {files.map((file) => (
            <FileRow key={file.id} file={file} />
          ))}
          {folders.map((folder) => (
            <FolderRow key={folder.id} folder={folder} />
          ))}
        </div>
        <UploadButton
          endpoint="imageUploader"
          onClientUploadComplete={(res) => {
            // Do something with the response
            console.log("Files uploaded: ", res);
            navigate.refresh();
          }}
          onUploadError={(error: Error) => {
            // Do something with the error.
            alert(`ERROR! ${error.message}`);
          }}
        />
      </main>
    </div>
  );
}
