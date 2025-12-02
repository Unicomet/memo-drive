import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { files_table, items_roles_users } from "~/server/db/schema";
import { FileRow } from "../../file-row";

export default async function FilePage(props: {
  params: Promise<{ fileId: string }>;
}) {
  const { fileId } = await props.params;

  const parsedFileId = parseInt(fileId);
  if (isNaN(parsedFileId)) {
    return <div>Invalid file ID</div>;
  }

  const session = await auth();

  if (!session.userId) {
    return <div>Please sign in to view this page.</div>;
  }

  const [file] = await db
    .select()
    .from(files_table)
    .where(eq(files_table.id, parsedFileId));

  if (!file) {
    return <div>File not found</div>;
  }

  // Check if the user has permission to access the file
  const [hasAccess] = await db
    .select()
    .from(items_roles_users)
    .where(
      and(
        eq(items_roles_users.itemId, parsedFileId),
        eq(items_roles_users.userId, session.userId),
      ),
    );

  if (file.ownerId !== session.userId && !hasAccess) {
    return <div>You do not have access to this file</div>;
  }

  return (
    <>
      <FileRow file={file} />
    </>
  );
}
