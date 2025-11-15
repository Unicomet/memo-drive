"use server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { DB_MUTATIONS, DB_QUERIES } from "./db/queries";
import { db } from "./db";
import { files_access, files_table, type folders_table } from "./db/schema";
import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { EmailTemplate } from "~/components/email-welcome";
import { Resend } from "resend";

const uploadThingsApi = new UTApi();
const resend = new Resend(process.env.RESEND_API_KEY);

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

  const fileKey = file.url.replace(
    "https://mdq5gee63i.ufs.sh/dashboard/folder/",
    "",
  );

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

  revalidatePath(`/dashboard/folder/${parent}`);

  return { success: true };
}

export async function removeFolder(folderId: number) {
  const session = await auth();
  if (!session.userId) {
    return { error: "Unauthorized" };
  }

  const result = await DB_MUTATIONS.removeFolder(folderId);
  console.log(result);

  return { success: true };
}

export async function sendOnboardingEmail() {
  try {
    const session = await currentUser();
    const emailAddress = session?.emailAddresses[0]?.emailAddress;
    if (!emailAddress) {
      return { error: "Unauthorized" };
    }

    const firstName = session.firstName ?? "";

    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: [emailAddress],
      subject: "Hello world",
      react: EmailTemplate({ firstName }),
    });

    if (error) {
      return { success: false, data: data };
    }
  } catch (error) {
    console.log(error);
    return { success: false };
  }
  return { success: true };
}

export async function shareFileToUser(fileId: number, emailAddress: string) {
  const session = await auth();
  if (!session?.userId) {
    return { error: "Unauthorized" };
  }

  //Check if this file is already shared with this user

  //Add user so that have access to the file
  const client = await clerkClient();
  const { data, totalCount } = await client.users.getUserList({
    query: emailAddress,
  });

  console.log("Clerk Backend User Search Result:", data);
  if (!data?.[0]) {
    return { error: "User not found" };
  }

  const userId = data[0].id;

  const [result] = await db
    .insert(files_access)
    .values({
      userId: userId,
      fileId: fileId,
    })
    .$returningId();

  if (!result) {
    return { error: "Failed to share file" };
  }

  console.log(result);
  return { success: true };
}
