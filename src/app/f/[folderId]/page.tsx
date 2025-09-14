import DriveContent from "./drive-content";
import { DB_QUERIES } from "~/server/db/queries";

export default async function GoogleDriveClone(params: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = await params.params;

  const parsedFolderId = parseInt(folderId);
  if (isNaN(parsedFolderId)) {
    return <div>Invalid folder ID</div>;
  }

  const [files, folders, folderParents] = await Promise.all([
    DB_QUERIES.getAllFilesInFolder(parsedFolderId),
    DB_QUERIES.getAllFoldersInFolder(parsedFolderId),
    DB_QUERIES.getAllParentsForFolder(parsedFolderId),
  ]);

  return (
    <DriveContent
      files={files}
      folders={folders}
      folderParents={folderParents}
      currentFolderId={parsedFolderId}
    />
  );
}
