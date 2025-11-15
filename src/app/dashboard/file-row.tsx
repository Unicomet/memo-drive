"use client";

import {
  FileText,
  ImageIcon,
  Video,
  Music,
  Archive,
  FolderIcon,
  Trash2Icon,
  Share2Icon,
} from "lucide-react";
import { cn } from "~/lib/utils";
import type { files_table } from "~/server/db/schema";
import { type folders_table } from "../../server/db/schema";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { deleteFile, removeFolder } from "~/server/actions";
import { useRouter } from "next/navigation";
import { DialogShareFile } from "./file/[fileId]/_components/dialog-share-file";
import { useShareFileDialog } from "../_providers/shareFileDialog/use-share-file-dialog";

const getFileIcon = (item: typeof files_table.$inferSelect) => {
  switch (item.fileType) {
    case "document":
      return FileText;
    case "image":
      return ImageIcon;
    case "video":
      return Video;
    case "audio":
      return Music;
    case "archive":
      return Archive;
    default:
      return FileText;
  }
};

const getFormattedDate = (date: Date) => {
  return date.toLocaleDateString();
};

export function FileRow(props: { file: typeof files_table.$inferSelect }) {
  const { file } = props;
  const {
    isOpen: isShareDialogOpen,
    setIsOpen: setShareDialogOpen,
    setFileId: setShareDialogFileId,
  } = useShareFileDialog();

  const IconComponent = getFileIcon(file);
  return (
    <div
      key={file.id}
      className="hover:border-gray-100m group flex cursor-pointer items-center rounded-xl border-b p-5 transition-all duration-200"
    >
      <a href={file.url} target="_blank" className="flex flex-1">
        <div className="mr-5 flex items-center gap-6">
          <IconComponent
            className={cn(
              "h-7 w-7 transition-colors duration-200",
              "text-accent group-hover:text-accent/80",
            )}
          />
          <p className="text-foreground group-hover:text-primary truncate text-base font-semibold transition-colors duration-200">
            {file.name}
          </p>
        </div>
      </a>
      <div className="flex-1"></div>
      <div className="text-muted-foreground flex items-center space-x-8 text-sm">
        <Button
          size="icon"
          className="border-border hover:bg-muted h-9 w-9 rounded-full border bg-transparent transition-colors duration-200"
          aria-label="Share file"
          onClick={() => {
            console.log(isShareDialogOpen);
            setShareDialogFileId(file.id);
            setShareDialogOpen(true);
          }}
        >
          <Share2Icon className="h-5 w-5 text-white" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="border-border hover:bg-muted h-9 w-9 rounded-full border bg-transparent transition-colors duration-200"
          onClick={async () => {
            await deleteFile(file.id);
          }}
          aria-label="Delete file"
        >
          <Trash2Icon className="h-5 w-5 text-red-500" />
        </Button>
        <span className="w-28 text-right font-medium">
          {getFormattedDate(file.updatedAt)}
        </span>
        {file.size && (
          <span className="bg-muted flex w-20 justify-center rounded-md px-2 py-1 text-center font-mono text-xs">
            {Math.round(file.size / 1000)} KB
          </span>
        )}
      </div>
    </div>
  );
}

export function FolderRow(props: {
  folder: typeof folders_table.$inferSelect;
}) {
  const { folder } = props;
  const router = useRouter();

  return (
    <div className="group flex cursor-pointer items-center rounded-xl border-b p-5 transition-all duration-200 hover:border-gray-100">
      <Link
        href={`/dashboard/folder/${folder.id}`}
        className="mr-5 flex items-center gap-6"
      >
        <div className="mr-5 flex items-center gap-6">
          <FolderIcon
            className={cn(
              "h-7 w-7 transition-colors duration-200",
              "text-accent group-hover:text-accent/80",
            )}
          />
          <p className="text-foreground group-hover:text-primary truncate text-base font-semibold transition-colors duration-200">
            {folder.name}
          </p>
        </div>
      </Link>
      <div className="flex-1"></div>
      <div className="text-muted-foreground flex items-center space-x-8 text-sm">
        <Button
          variant="ghost"
          size="icon"
          className="border-border hover:bg-muted h-9 w-9 rounded-full border bg-transparent transition-colors duration-200"
          onClick={async () => {
            await removeFolder(folder.id);
            router.refresh();
          }}
        >
          <Trash2Icon className="h-5 w-5 text-red-500" />
        </Button>
        <span className="w-28 text-right font-medium">
          {getFormattedDate(folder.updatedAt)}
        </span>
        <span className="bg-muted flex w-20 justify-center rounded-md px-2 py-1 text-center font-mono text-xs">
          Folder
        </span>
      </div>
    </div>
  );
}
