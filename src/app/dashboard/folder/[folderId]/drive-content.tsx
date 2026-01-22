"use client";

import { Button } from "~/components/ui/button";
import { ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";
import { FileRow, FolderRow } from "../../file-row";
import type { files_table, folders_table } from "~/server/db/schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UploadButton } from "~/components/uploadthings";
import { DialogCreateFolder } from "./_components/dialog-create-folder";
import { DialogShareFile } from "../../file/[fileId]/_components/dialog-share-file";
import { toast } from "sonner";

export default function DriveContent(props: {
  files: (typeof files_table.$inferSelect)[];
  folders: (typeof folders_table.$inferSelect)[];
  folderParents: (typeof folders_table.$inferSelect)[];
  currentFolderId: number;
}) {
  const navigate = useRouter();
  const { files, folders, folderParents: breadcrumbs } = props;

  return (
    <>
      <div className="flex w-full items-center">
        <nav className="mt-6 flex flex-1 items-center gap-x-3 py-6 text-sm">
          <Button
            variant="ghost"
            className="mr-2 cursor-pointer font-medium hover:text-white"
            asChild
          >
            <Link href="/drive">My Drive</Link>
          </Button>
          {breadcrumbs.map((folder, index) => (
            <div key={index} className="flex items-center">
              <ChevronRight className="text-muted-foreground mx-2 h-4 w-4" />
              <button
                className={cn(
                  "rounded-md px-3 py-2 font-medium transition-colors duration-200",
                  index === breadcrumbs.length - 1
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Link href={`/dashboard/folder/${folder.id}`}>
                  {folder.name}
                </Link>
              </button>
            </div>
          ))}
        </nav>
        <DialogCreateFolder currentFolderId={props.currentFolderId} />
      </div>
      <div className="flex flex-col gap-y-4">
        {files.map((file) => (
          <FileRow key={file.id} file={file} />
        ))}
        {folders.map((folder) => (
          <FolderRow key={folder.id} folder={folder} />
        ))}
      </div>
      <UploadButton
        className="mt-8"
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          // Do something with the response
          console.log("Files uploaded: ", res);
          navigate.refresh();
          toast.success("Upload complete!");
        }}
        onUploadError={(error: Error) => {
          // Do something with the error.
          console.error("Failed to upload a file: ", error.message);
          toast.error(`Upload failed`);
        }}
        input={{ folderId: props.currentFolderId }}
      />
    </>
  );
}
