import type { File, Folder } from "~/lib/mock-data";
import {
  FileText,
  ImageIcon,
  Video,
  Music,
  Archive,
  FolderIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";

const getFileIcon = (item: File) => {
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

export function FileRow(props: { file: File }) {
  const { file } = props;

  const IconComponent = getFileIcon(file);
  return (
    <div
      key={file.id}
      className="group hover:bg-card hover:border-border flex cursor-pointer items-center rounded-xl border border-transparent p-5 transition-all duration-200 hover:shadow-sm"
    >
      <a href={file.url} target="_blank" className="flex flex-1">
        <div className="mr-5 flex-shrink-0">
          <IconComponent
            className={cn(
              "h-7 w-7 transition-colors duration-200",
              "text-accent group-hover:text-accent/80",
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground group-hover:text-primary truncate text-base font-semibold transition-colors duration-200">
            {file.name}
          </p>
        </div>
      </a>
      <div className="text-muted-foreground flex items-center space-x-8 text-sm">
        <span className="w-28 text-right font-medium">{file.modified}</span>
        {file.size && (
          <span className="bg-muted w-24 rounded-md px-2 py-1 text-right font-mono text-xs">
            {file.size}
          </span>
        )}
      </div>
    </div>
  );
}

export function FolderRow(props: {
  folder: Folder;
  handleFolderClick: () => void;
}) {
  const { folder, handleFolderClick } = props;

  return (
    <div
      key={folder.id}
      className="group hover:bg-card hover:border-border flex cursor-pointer items-center rounded-xl border border-transparent p-5 transition-all duration-200 hover:shadow-sm"
      onClick={() => handleFolderClick()}
    >
      <div className="mr-5 flex-shrink-0">
        <FolderIcon
          className={cn(
            "h-7 w-7 transition-colors duration-200",
            "text-accent group-hover:text-accent/80",
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground group-hover:text-primary truncate text-base font-semibold transition-colors duration-200">
          {folder.name}
        </p>
      </div>
      <div className="text-muted-foreground flex items-center space-x-8 text-sm">
        <span className="w-28 text-right font-medium">{folder.modified}</span>
        <span className="bg-muted w-24 rounded-md px-2 py-1 text-right font-mono text-xs">
          Folder
        </span>
      </div>
    </div>
  );
}
