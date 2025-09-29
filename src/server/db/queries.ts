import "server-only";

import { db } from "~/server/db";
import {
  files_table as filesSchema,
  folders_table as foldersSchema,
} from "~/server/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { create } from "domain";

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
  getFolderById: async function (folderId: number) {
    const folder = await db
      .select()
      .from(foldersSchema)
      .where(eq(foldersSchema.id, folderId));
    return folder[0];
  },
  deleteFolderById: async function (folderId: number) {
    return await db.delete(foldersSchema).where(eq(foldersSchema.id, folderId));
  },
  deleteFileById: async function (fileId: number) {
    return await db.delete(filesSchema).where(eq(filesSchema.id, fileId));
  },
  getRootFolderForUser: async function (userId: string) {
    const rootFolder = await db
      .select()
      .from(foldersSchema)
      .where(
        and(eq(foldersSchema.ownerId, userId), isNull(foldersSchema.parent)),
      );
    return rootFolder[0];
  },
};

export const DB_MUTATIONS = {
  createFile: async function (file: typeof filesSchema.$inferInsert) {
    return await db.insert(filesSchema).values(file);
  },
  onboardUser: async function (userId: string) {
    const [rootFolder] = await DB_MUTATIONS.createFolder({
      name: "Root",
      ownerId: userId,
      parent: null,
    });

    const rootFolderId = rootFolder?.id;

    if (!rootFolderId) {
      throw new Error("Error creating root folder");
    }

    await db.insert(foldersSchema).values([
      { name: "Documents", ownerId: userId, parent: rootFolderId },
      { name: "Pictures", ownerId: userId, parent: rootFolderId },
      { name: "Videos", ownerId: userId, parent: rootFolderId },
    ]);

    return rootFolderId;
  },
  createFolder: async function (folder: typeof foldersSchema.$inferInsert) {
    return await db.insert(foldersSchema).values(folder).$returningId();
  },
  removeFolder: async function (folderId: number) {
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`
        CREATE TEMPORARY TABLE table_folder_tree (
            id BIGINT PRIMARY KEY
        )
      `);
      await tx.execute(sql`
        INSERT INTO table_folder_tree (id)
        WITH RECURSIVE folder_tree AS (
          SELECT id
          FROM drive_tutorial_folders
          WHERE id = ${folderId}

          UNION ALL

          SELECT f.id
          FROM drive_tutorial_folders f
          INNER JOIN folder_tree ft ON f.parent = ft.id
        )
        SELECT id FROM folder_tree;
     `);
      await tx.execute(sql`
        DELETE FROM drive_tutorial_files
        WHERE parent IN (SELECT id FROM table_folder_tree);
      `);
      await tx.execute(sql`
        DELETE FROM drive_tutorial_folders
        WHERE id IN (SELECT id FROM table_folder_tree)
      `);
    });

    console.log(result);
  },
};
