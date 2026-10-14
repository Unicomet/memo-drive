"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DB_MUTATIONS } from "./db/queries";

const noteIdSchema = z.number().int().positive().safe();
const noteSchema = z.object({
  id: noteIdSchema,
  title: z.string().max(200),
  description: z.string().max(10000),
});

export async function createNote() {
  const { userId } = await auth();
  if (!userId) return { error: "Please sign in to create notes." };
  try {
    const note = await DB_MUTATIONS.createNote(userId);
    revalidatePath("/dashboard/notes");
    return { note };
  } catch (error) {
    console.error("Failed to create note", error);
    return { error: "Could not create your note. Please try again." };
  }
}

export async function updateNote(input: unknown) {
  const { userId } = await auth();
  if (!userId) return { error: "Please sign in to save notes." };
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success)
    return {
      error:
        "Titles can have up to 200 characters and descriptions up to 10,000.",
    };
  const { id, ...values } = parsed.data;
  try {
    const updated = await DB_MUTATIONS.updateNote(userId, id, values);
    if (!updated) return { error: "Note not found." };
    revalidatePath("/dashboard/notes");
    return { success: true };
  } catch (error) {
    console.error("Failed to update note", error);
    return { error: "Could not save your note. Your edits are still here." };
  }
}

export async function deleteNote(input: unknown) {
  const { userId } = await auth();
  if (!userId) return { error: "Please sign in to delete notes." };
  const parsed = noteIdSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid note." };
  try {
    const deleted = await DB_MUTATIONS.deleteNote(userId, parsed.data);
    if (!deleted) return { error: "Note not found." };
    revalidatePath("/dashboard/notes");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete note", error);
    return { error: "Could not delete your note. Please try again." };
  }
}
