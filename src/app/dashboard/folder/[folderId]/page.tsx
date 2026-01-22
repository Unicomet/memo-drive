import { auth } from "@clerk/nextjs/server";
import DriveContent from "./drive-content";
import { DB_QUERIES } from "~/server/db/queries";
import { db } from "~/server/db";
import { folders_table } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { getStripeSubByUserId } from "~/server/subscriptions/store";
import { redirect } from "next/dist/client/components/navigation";
import { getSubtierForUser } from "~/server/subscriptions/actions/get-subtier";

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
  if (!session.userId) {
    return redirect("/login");
  }

  const subData = await getStripeSubByUserId(session.userId);
  if (subData === null) {
    return (
      <div className="mx-auto my-auto text-xl font-medium">
        You need an active subscription to access your drive. Please upgrade
        your plan.
      </div>
    );
  }

  const subTier = await getSubtierForUser();
  if (subTier === "free") {
    return (
      <div className="mx-auto my-auto text-xl font-medium">
        You need an active subscription to access your drive.
        <p>
          Please upgrade your plan{" "}
          <a href="/pricing" className="font-semibold text-blue-600">
            here
          </a>
        </p>
        <meta httpEquiv="refresh" content="5;url=/pricing" />
      </div>
    );
  }

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
