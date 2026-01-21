"use server";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { DB_MUTATIONS, DB_QUERIES } from "./db/queries";
import { db } from "./db";
import {
  files_table,
  items_roles_users,
  type folders_table,
} from "./db/schema";
import { resend } from "@upstash/qstash";
import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { hasPermission, ID_ROLES } from "~/lib/auth";
import { client } from "./queue";
import { env } from "~/env";
import { getStripeSubByUserId } from "./subscriptions/store";
import { trace } from "@opentelemetry/api";

const uploadThingsApi = new UTApi();
const clerkClientBackend = await clerkClient();

// Initialize the wide event with request context
const event: Record<string, unknown> = {
  // request_id: ctx.get("requestId"),
  timestamp: new Date().toISOString(),
  // method: ctx.req.method,
  // path: ctx.req.path,
  service: process.env.SERVICE_NAME,
  version: process.env.SERVICE_VERSION,
  deployment_id: process.env.DEPLOYMENT_ID,
  region: process.env.REGION,
};

export async function deleteFolder(folderId: number) {
  const session = await auth();
  if (!session.userId) {
    return { error: "Unauthorized" };
  }

  await DB_QUERIES.deleteFolderById(folderId);
}

export async function deleteFile(fileId: number) {
  return await trace
    .getTracer("server-actions")
    .startActiveSpan("deleteFile", async (span) => {
      try {
        const session = await auth();
        if (!session.userId) {
          return { success: false, error: "Unauthorized" };
        }

        // Add user context
        const subscription = await getStripeSubByUserId(session.userId);

        let subscriptionId: string | null = null;
        if (subscription !== null && subscription.status !== "none") {
          subscriptionId = subscription.subscriptionId;
        }

        span.setAttributes({
          "user.id": session.userId,
          "user.subscriptionId": subscriptionId ?? "",
          // "user.account_age_days": daysSince(user.createdAt),
          // "user.lifetime_value_cents": user.ltv,
        });

        const [fileData] = await db
          .select({ ownerId: files_table.ownerId })
          .from(files_table)
          .where(eq(files_table.id, fileId));

        const isOwner = fileData?.ownerId === session.userId;

        const resource = {
          id: fileId,
          type: "file" as const,
        };

        const isAuthorized =
          (await hasPermission(session.userId, resource, "delete")) || isOwner;
        if (!isAuthorized) {
          return {
            success: false,
            error: "You are not allowed to delete this file",
          };
        }

        const [file] = await db
          .select()
          .from(files_table)
          .where(and(eq(files_table.id, fileId)));

        if (!file) {
          return { success: false, error: "File not found" };
        }

        const fileKey = file.url.replace(
          "https://mdq5gee63i.ufs.sh/dashboard/folder/",
          "",
        );

        const utApiResult = await uploadThingsApi.deleteFiles(fileKey);

        if (!utApiResult.success) {
          return {
            success: false,
            error: "Failed to delete file from storage",
          };
        }

        console.log(utApiResult);

        const deletedFileFromDb = await DB_QUERIES.deleteFileById(fileId);

        console.log(deletedFileFromDb);

        const c = await cookies();

        c.set("force-refresh", JSON.stringify(Math.random()));

        return { success: true, error: null };
      } finally {
        span.end();
      }
    });
}

export async function sendOnboardingEmail() {
  const session = await currentUser();

  if (!session) {
    return { error: "Unauthorized" };
  }

  if (!session.emailAddresses[0]?.emailAddress) {
    return { error: "Not found email" };
  }
  const emailAddress = session?.emailAddresses[0]?.emailAddress;

  if (!session.firstName) {
    return { error: "Not found first name" };
  }
  const firstName = session.firstName;

  //This is the old way using our custom background job endpoint (slower)
  // await client.publishJSON({
  //   url: `${process.env.HOST}/api/background-jobs/send-email`,
  //   body: {
  //     type: "send-onboarding-email",
  //     to: session.emailAddresses[0]?.emailAddress,
  //     firstName,
  //   },
  // });

  await client.publishJSON({
    api: {
      name: "email",
      provider: resend({ token: env.RESEND_API_KEY }),
    },
    body: {
      from: "Acme <onboarding@resend.dev>",
      to: [emailAddress],
      subject: `Welcome to Drive Clone, ${firstName}!`,
      html: `<p>We give you a warm welcome, ${firstName}!</p>`,
    },
  });

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

export async function shareFileToUser(fileId: number, emailAddress: string) {
  const session = await auth();
  if (!session?.userId) {
    return { error: "Unauthorized" };
  }

  //Check if this file is already shared with this user

  //Add user so that have access to the file
  const { data, totalCount } = await clerkClientBackend.users.getUserList({
    query: emailAddress,
  });

  if (data.length === 0) {
    return { error: "User not found" };
  }

  console.log("Clerk Backend User Search Result:", data);
  if (!data?.[0]) {
    return { error: "User not found" };
  }

  const userId = data[0].id;

  const [result] = await db
    .insert(items_roles_users)
    .values({
      userId: userId,
      itemId: fileId,
      role: ID_ROLES.ADMIN, // Viewer role
    })
    .$returningId();

  if (!result) {
    return { error: "Failed to share file" };
  }

  console.log(result);
  return { success: true };
}

export async function getInvitedUsers(fileId: number) {
  try {
    const invitedUsers = await db
      .select({
        userId: items_roles_users.userId,
        role: items_roles_users.role,
      })
      .from(items_roles_users)
      .where(eq(items_roles_users.itemId, fileId));

    console.log("Invited: ", invitedUsers);
    console.log(invitedUsers.map((invited) => invited.userId));

    if (invitedUsers.length === 0) {
      return { data: [], error: null };
    }

    const invitedUsersData = await clerkClientBackend.users.getUserList({
      userId: invitedUsers.map((invited) => invited.userId),
    });

    console.log("Invited Users Data: ", invitedUsersData);

    // console.log(
    //   invitedUsers.find(
    //     (invited) => invited.userId === "user_33S8IjBHQpRu46IJYnpPL7vHdgM",
    //   )!.role,
    // );

    const data = invitedUsersData.data.map((userData) => {
      const invited = invitedUsers.find(
        (invited) => invited.userId === userData.id,
      );
      if (!invited) {
        console.error(
          `Invited user not found for id (from Stripe) ${userData.id} in DB`,
        );
        throw new Error(
          `Invited user not found for id (from Stripe) ${userData.id} in DB`,
        );
      }

      const emailAddress = userData.emailAddresses?.[0]?.emailAddress;
      if (!emailAddress) {
        console.error(
          `Email address not found for id (from Stripe) ${userData.id} in DB`,
        );
        throw new Error(
          `Email address not found for user id (from Stripe) ${userData.id}`,
        );
      }

      const fullName = [userData.firstName, userData.lastName]
        .filter(Boolean)
        .join(" ");

      return {
        emailAddress,
        fullName,
        role: invited.role,
      };
    });

    console.log(data);

    return { data, error: null };
  } catch (e) {
    console.error("error: Failed to get invited users", e);
    return { data: null, error: "Failed to get invited users" };
  }
}
