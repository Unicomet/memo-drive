import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { createConnection } from "mysql2/promise";
import { drizzle } from "drizzle-orm/singlestore";

// Run explicitly with node --env-file=.env.local tests/notes-db.integration.mjs.
// Only this run's randomly named test owners are created and cleaned up.
const require = createRequire(import.meta.url);
function loadTypeScript(path, mocks) {
  const source = ts.transpileModule(
    readFileSync(new URL(path, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    require: (name) => (name in mocks ? mocks[name] : require(name)),
    console,
    Date,
  });
  return module.exports;
}
const conn = await createConnection({
  host: process.env.SINGLESTORE_HOST,
  port: Number(process.env.SINGLESTORE_PORT),
  user: process.env.SINGLESTORE_USER,
  password: process.env.SINGLESTORE_PASS,
  database: process.env.SINGLESTORE_DB_NAME,
  ssl: {},
});
const schema = loadTypeScript("../src/server/db/schema.ts", {});
const db = drizzle(conn, { schema });
const { DB_QUERIES, DB_MUTATIONS } = loadTypeScript(
  "../src/server/db/queries.ts",
  { "server-only": {}, "~/server/db": { db }, "~/server/db/schema": schema },
);
const runId = randomUUID();
const ownerA = `notes-test-a-${runId}`;
const ownerB = `notes-test-b-${runId}`;
try {
  const noteA = await DB_MUTATIONS.createNote(ownerA);
  const noteB = await DB_MUTATIONS.createNote(ownerB);
  assert.equal(noteA.ownerId, ownerA);
  assert.equal(noteB.ownerId, ownerB);
  console.log(
    "PASS live SingleStore: create notes linked to separate accounts",
  );
  let notesA = await DB_QUERIES.getNotesForUser(ownerA);
  assert.equal(notesA.length, 1);
  assert.equal(notesA[0].id, noteA.id);
  console.log("PASS live SingleStore: account-scoped listing");
  assert.equal(
    await DB_MUTATIONS.updateNote(ownerA, noteA.id, {
      title: "Live save check",
      description: "Description persisted to SingleStore",
    }),
    true,
  );
  notesA = await DB_QUERIES.getNotesForUser(ownerA);
  assert.equal(notesA[0].title, "Live save check");
  assert.equal(notesA[0].description, "Description persisted to SingleStore");
  console.log("PASS live SingleStore: save and reload title and description");
  assert.equal(
    await DB_MUTATIONS.updateNote(ownerB, noteA.id, {
      title: "Unauthorized",
      description: "Unauthorized",
    }),
    false,
  );
  notesA = await DB_QUERIES.getNotesForUser(ownerA);
  assert.equal(notesA[0].title, "Live save check");
  console.log("PASS live SingleStore: cross-account updates rejected");
  assert.equal(await DB_MUTATIONS.deleteNote(ownerB, noteA.id), false);
  assert.equal((await DB_QUERIES.getNotesForUser(ownerA)).length, 1);
  console.log("PASS live SingleStore: cross-account deletion rejected");
  assert.equal(await DB_MUTATIONS.deleteNote(ownerA, noteA.id), true);
  assert.equal((await DB_QUERIES.getNotesForUser(ownerA)).length, 0);
  assert.equal((await DB_QUERIES.getNotesForUser(ownerB)).length, 1);
  console.log(
    "PASS live SingleStore: owner deletion preserves the other account",
  );
} finally {
  await conn.execute(
    "DELETE FROM drive_tutorial_notes WHERE owner_id IN (?, ?)",
    [ownerA, ownerB],
  );
  await conn.end();
  console.log("Cleaned up this run’s test notes.");
}
