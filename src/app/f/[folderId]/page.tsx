import { auth } from "@clerk/nextjs/server";
import DriveContent from "./drive-content";
import { DB_QUERIES } from "~/server/db/queries";
import { db } from "~/server/db";
import { folders_table } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export default async function GoogleDriveClone(params: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = await params.params;
  const parsedFolderId = parseInt(folderId);
  if (isNaN(parsedFolderId)) {
    return (
      <div className="mx-auto my-auto text-xl font-medium">
        Invalid folder ID
      </div>
    );
  }

  const session = await auth();

  const [currentFolder] = await db
    .select({
      ownerId: folders_table.ownerId,
    })
    .from(folders_table)
    .where(eq(folders_table.id, parsedFolderId));

  if (currentFolder?.ownerId !== session.userId) {
    return (
      <div className="mx-auto my-auto text-xl font-medium">
        You do not have access to this folder
      </div>
    );
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
