import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DB_QUERIES } from "~/server/db/queries";
import NotesBoard from "./notes-board";

export default async function NotesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const notes = await DB_QUERIES.getNotesForUser(userId);
  return <NotesBoard key={userId} initialNotes={notes} />;
}
