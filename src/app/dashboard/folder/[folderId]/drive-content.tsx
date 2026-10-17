"use client";

import { Button } from "~/components/ui/button";
import { useState } from "react";
import { downloadImages } from "~/lib/download-images";
import { ChevronRight, DownloadIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { FileRow, FolderRow } from "../../file-row";
import type { files_table, folders_table } from "~/server/db/schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UploadButton, UploadDropzone } from "~/components/uploadthings";
import { DialogCreateFolder } from "./_components/dialog-create-folder";
import { toast } from "sonner";

export default function DriveContent(props: {
  files: (typeof files_table.$inferSelect)[];
  folders: (typeof folders_table.$inferSelect)[];
  folderParents: (typeof folders_table.$inferSelect)[];
  currentFolderId: number;
}) {
  const navigate = useRouter();
  const { files, folders, folderParents: breadcrumbs } = props;

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const images = files.filter(
    (file) => file.fileType === "image" || file.fileType.startsWith("image/"),
  );
  const selectedImages = images.filter((file) => selectedIds.includes(file.id));

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadImages(selectedImages.length ? selectedImages : images);
      toast.success("Images downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed");
    } finally {
      setIsDownloading(false);
    }
  }

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
      <UploadDropzone
        className="border-border bg-muted/30 text-foreground mt-0 w-full rounded-xl px-6 py-6"
        appearance={{
          label: "text-foreground hover:text-primary",
          allowedContent: "text-muted-foreground",
          button:
            "bg-foreground data-[state=ready]:bg-foreground data-[state=uploading]:bg-muted-foreground",
        }}
        config={{ mode: "auto" }}
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          console.log("Files uploaded: ", res);
          navigate.refresh();
          toast.success("Upload complete!");
        }}
        onUploadError={(error: Error) => {
          console.error("Failed to upload a file: ", error.message);
          toast.error("Upload failed");
        }}
        input={{ folderId: props.currentFolderId }}
      />
      {images.length > 0 && (
        <div className="my-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedImages.length === images.length}
              disabled={isDownloading}
              onChange={(event) =>
                setSelectedIds(
                  event.target.checked ? images.map((file) => file.id) : [],
                )
              }
            />
            Select all images ({images.length})
          </label>
          <Button onClick={handleDownload} disabled={isDownloading}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            {isDownloading
              ? "Preparing download…"
              : selectedImages.length
                ? `Download selected (${selectedImages.length})`
                : `Download all images (${images.length})`}
          </Button>
        </div>
      )}
      <div className="flex flex-col gap-y-4">
        {files.map((file) => (
          <FileRow
            key={file.id}
            file={file}
            selected={selectedIds.includes(file.id)}
            selectionDisabled={isDownloading}
            onSelectionChange={
              images.some((image) => image.id === file.id)
                ? (selected) =>
                    setSelectedIds((ids) =>
                      selected
                        ? [...ids, file.id]
                        : ids.filter((id) => id !== file.id),
                    )
                : undefined
            }
          />
        ))}
        {folders.map((folder) => (
          <FolderRow key={folder.id} folder={folder} />
        ))}
      </div>
      <UploadButton
        className="ut-button:bg-foreground ut-button:ut-uploading:bg-muted-foreground ut-button:ut-readying:bg-muted-foreground mt-8"
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
