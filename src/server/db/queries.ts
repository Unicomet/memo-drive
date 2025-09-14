import { db } from "~/server/db";
import {
  files_table as filesSchema,
  folders_table as foldersSchema,
} from "~/server/db/schema";
import { eq } from "drizzle-orm";

export const DB_QUERIES = {
  getAllParentsForFolder: async function (folderId: number) {
    const breadCrumbs = [];
    // let currentFolder = await db.select().from(foldersSchema).where(foldersSchema.Id) find((folder) => folder.id === currentFolderId);
    let currentFolderId: number | null = folderId;
    while (currentFolderId !== null) {
      const currentFolder = await db
        .select()
        .from(foldersSchema)
        .where(eq(foldersSchema.id, currentFolderId));
      if (!currentFolder[0]) {
        throw new Error("Parent folder not found");
      }
      breadCrumbs.unshift(currentFolder[0]);
      currentFolderId = currentFolder[0].parent;
    }
    return breadCrumbs;
  },
  getAllFilesInFolder: async function (folderId: number) {
    return await db
      .select()
      .from(filesSchema)
      .where(eq(filesSchema.parent, folderId));
  },
  getAllFoldersInFolder: async function (folderId: number) {
    return await db
      .select()
      .from(foldersSchema)
      .where(eq(foldersSchema.parent, folderId));
  },
};

export const DB_MUTATIONS = {
  createFile: async function (file: typeof filesSchema.$inferInsert) {
    return await db.insert(filesSchema).values(file);
  },
};
