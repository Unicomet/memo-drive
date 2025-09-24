"use server";
import { auth } from "@clerk/nextjs/server";
import { DB_MUTATIONS, DB_QUERIES } from "./db/queries";
import { db } from "./db";
import { files_table, type folders_table } from "./db/schema";
import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const uploadThingsApi = new UTApi();

export async function deleteFolder(folderId: number) {
  const session = await auth();
  if (!session.userId) {
    return { error: "Unauthorized" };
  }

  await DB_QUERIES.deleteFolderById(folderId);
}

export async function deleteFile(fileId: number) {
  const session = await auth();
  if (!session.userId) {
    return { error: "Unauthorized" };
  }

  const [file] = await db
    .select()
    .from(files_table)
    .where(
      and(eq(files_table.id, fileId), eq(files_table.ownerId, session.userId)),
    );

  if (!file) {
    return { error: "File not found" };
  }

  const fileKey = file.url.replace("https://mdq5gee63i.ufs.sh/f/", "");

  const utApiResult = await uploadThingsApi.deleteFiles(fileKey);

  if (!utApiResult.success) {
    return { error: "Failed to delete file from storage" };
  }

  console.log(utApiResult);

  const deletedFileFromDb = await DB_QUERIES.deleteFileById(fileId);

  console.log(deletedFileFromDb);

  const c = await cookies();

  c.set("force-refresh", JSON.stringify(Math.random()));

  return { success: true };
}

export async function createFolder(name: string, parent: number) {
  const session = await auth();
  if (!session.userId) {
    return { error: "Unauthorized" };
  }

  const newFolder: typeof folders_table.$inferInsert = {
    name,
    parent,
    ownerId: session.userId,
  };
  await DB_MUTATIONS.createFolder(newFolder);

  revalidatePath(`/f/${parent}`);

  return { success: true };
}
