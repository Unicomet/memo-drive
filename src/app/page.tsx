import { db } from "~/server/db";
import DriveContent from "./drive-content";
import {
  files as filesSchema,
  folders as foldersSchema,
} from "~/server/db/schema";

export default async function GoogleDriveClone() {
  const files = await db.select().from(filesSchema);
  const folders = await db.select().from(foldersSchema);

  return <DriveContent files={files} folders={folders} />;
}
