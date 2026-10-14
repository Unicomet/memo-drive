import "server-only";

import { db } from "~/server/db";
import {
  files_table as filesSchema,
  folders_table as foldersSchema,
  notes_table as notesSchema,
} from "~/server/db/schema";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
import { UTApi } from "uploadthing/server";

const uploadThingsApi = new UTApi();

export const DB_QUERIES = {
  getNotesForUser: async function (userId: string) {
    return db
      .select()
      .from(notesSchema)
      .where(eq(notesSchema.ownerId, userId))
      .orderBy(desc(notesSchema.createdAt), desc(notesSchema.id));
  },
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
  createNote: async function (userId: string) {
    const [created] = await db
      .insert(notesSchema)
      .values({
        ownerId: userId,
        title: "",
        description: "",
      })
      .$returningId();
    if (!created) throw new Error("Failed to create note");
    const [note] = await db
      .select()
      .from(notesSchema)
      .where(
        and(eq(notesSchema.id, created.id), eq(notesSchema.ownerId, userId)),
      );
    if (!note) throw new Error("Failed to load new note");
    return note;
  },
  updateNote: async function (
    userId: string,
    noteId: number,
    values: Pick<typeof notesSchema.$inferInsert, "title" | "description">,
  ) {
    const [result] = await db
      .update(notesSchema)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(notesSchema.id, noteId), eq(notesSchema.ownerId, userId)));
    return result.affectedRows > 0;
  },
  deleteNote: async function (userId: string, noteId: number) {
    const [result] = await db
      .delete(notesSchema)
      .where(and(eq(notesSchema.id, noteId), eq(notesSchema.ownerId, userId)));
    return result.affectedRows > 0;
  },
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
    await db.transaction(async (tx) => {
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

      const geturlFilesToDelete = (await tx.execute(sql`
        SELECT url FROM drive_tutorial_files
        WHERE parent IN (SELECT id FROM table_folder_tree);
      `)) as unknown as { url: string }[][];

      const urlFilesToDelete = geturlFilesToDelete[0];

      console.log(urlFilesToDelete);

      await tx.execute(sql`
        DELETE FROM drive_tutorial_files
        WHERE parent IN (SELECT id FROM table_folder_tree);
      `);
      await tx.execute(sql`
        DELETE FROM drive_tutorial_folders
        WHERE id IN (SELECT id FROM table_folder_tree)
      `);

      if (!urlFilesToDelete || urlFilesToDelete.length === 0) {
        tx.rollback();
        return;
      }

      for (const { url } of urlFilesToDelete) {
        const fileKey = url.split("/").pop();
        if (!fileKey) {
          console.error("Invalid file URL in database:", url);
          continue;
        }

        const utApiResult = await uploadThingsApi.deleteFiles(fileKey);

        if (!utApiResult.success) {
          console.error("Failed to delete file from uploadthing", url);
          tx.rollback();
          return;
        }
      }
    });
  },
};
