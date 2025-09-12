"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Upload, Search, ChevronRight, Moon, Sun } from "lucide-react";
import { cn } from "~/lib/utils";
import { mockFiles, mockFolders, type Folder } from "~/lib/mock-data";
import { FileRow, FolderRow } from "./file-row";

export default function GoogleDriveClone() {
  const [currentFolderId, setCurrentFolder] = useState<string>("root");

  const getCurrentFiles = () => {
    return mockFiles.filter((file) => file.parent === currentFolderId);
  };

  const getCurrentFolders = () => {
    return mockFolders.filter((folder) => folder.parent === currentFolderId);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [isDark, setIsDark] = useState(true);

  const handleFolderClick = (item: Folder) => {
    console.log("Navigating to folder:", item);
    setCurrentFolder(item.id);
  };

  // const handleBreadcrumbClick = (index: number) => {
  //   const newPath = currentPath.slice(0, index + 1);
  //   setCurrentPath(newPath);

  //   if (index === 0) {
  //     setCurrentItems(mockFolders);
  //   } else {
  //     // Navigate to the correct folder based on path
  //     let items = mockFiles;
  //     for (let i = 1; i < newPath.length; i++) {
  //       const folder = items.find(
  //         (item) => item.name === newPath[i],
  //       );
  //       files = mockFiles.filter((item) => item.parent === folder?.id) || [];};
  //       const folders = mockFolders.filter((item) => item.parent === folder?.id) || [];

  //     }
  //     setCurrentItems(items);
  //   }
  // };

  const breadCrumbs = useMemo(() => {
    const breadCrumbs: Folder[] = [];

    let currentFolder = mockFolders.find(
      (folder) => folder.id === currentFolderId,
    );
    while (currentFolder && currentFolder?.id !== "root") {
      breadCrumbs.unshift(currentFolder);
      currentFolder = mockFolders.find(
        (folder) => folder.id === currentFolder?.parent,
      );
    }
    return breadCrumbs;
  }, [currentFolderId]);

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
    <div className="bg-background min-h-screen transition-colors duration-300">
      <header className="border-border bg-card/50 border-b px-8 py-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-primary text-2xl font-bold tracking-tight">
              Drive Clone
            </h1>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 px-6 py-2.5 font-medium shadow-md transition-all duration-200 hover:shadow-lg">
              <Upload className="mr-2 h-4 w-4" />
              New Upload
            </Button>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder="Search in Drive"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background border-border focus:border-primary h-11 w-96 pl-12 transition-colors duration-200"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="border-border hover:bg-muted h-11 w-11 bg-transparent transition-colors duration-200"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <nav className="border-border mt-6 flex items-center space-x-3 border-t pt-6 text-sm">
          <Button
            onClick={() => setCurrentFolder("root")}
            variant="ghost"
            className="mr-2 cursor-pointer font-medium hover:text-white"
          >
            My Drive
          </Button>
          {breadCrumbs.map((folder, index) => (
            <div key={index} className="flex items-center">
              <ChevronRight className="text-muted-foreground mx-2 h-4 w-4" />
              <button
                onClick={() => handleFolderClick(folder)}
                className={cn(
                  "rounded-md px-3 py-2 font-medium transition-colors duration-200",
                  index === breadCrumbs.length - 1
                    ? "text-accent-foreground bg-accent font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {folder.name}
              </button>
            </div>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl p-8">
        <div className="space-y-2">
          {getCurrentFiles().map((file) => (
            <FileRow key={file.id} file={file} />
          ))}
          {getCurrentFolders().map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              handleFolderClick={() => handleFolderClick(folder)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
