import React from "react";
import { mockFiles, mockFolders } from "~/lib/mock-data";
import { db } from "~/server/db";
import { files, folders } from "~/server/db/schema";

export default function SandboxPage() {
  return (
    <div className="flex flex-col gap-3">
      Seed Function
      <form
        action={async () => {
          "use server";

          const folderInsertions = await db.insert(folders).values(mockFolders);
          const filesInsertion = await db.insert(files).values(mockFiles);

          console.log(folderInsertions);
          console.log(filesInsertion);
        }}
      >
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Seed Database
        </button>
      </form>
    </div>
  );
}
