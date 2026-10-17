import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { SingleStoreDialect } from "drizzle-orm/singlestore-core";

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
    console: { error() {} },
    Date,
    URL,
  });
  return module.exports;
}
const schema = loadTypeScript("../src/server/db/schema.ts", {});
const dialect = new SingleStoreDialect();

function setup() {
  let userId = "account-a";
  const rows = [
    { id: 1, ownerId: "account-a", title: "Mine", description: "Private" },
    {
      id: 2,
      ownerId: "account-b",
      title: "Other account",
      description: "Secret",
    },
  ];
  const predicates = [];
  const db = {
    select() {
      return {
        from() {
          return {
            where(condition) {
              const query = dialect.sqlToQuery(condition);
              predicates.push(query);
              const selected = rows.filter((row) =>
                query.params.length === 1
                  ? row.ownerId === query.params[0]
                  : row.id === query.params[0] &&
                    row.ownerId === query.params[1],
              );
              return Object.assign(Promise.resolve(selected), {
                orderBy() {
                  return Promise.resolve(selected);
                },
              });
            },
          };
        },
      };
    },
    insert() {
      return {
        values(values) {
          return {
            async $returningId() {
              const id = rows.length + 1;
              rows.push({ id, ...values });
              return [{ id }];
            },
          };
        },
      };
    },
    update() {
      return {
        set(values) {
          return {
            async where(condition) {
              const query = dialect.sqlToQuery(condition);
              predicates.push(query);
              const row = rows.find(
                (item) =>
                  item.id === query.params[0] &&
                  item.ownerId === query.params[1],
              );
              if (row) Object.assign(row, values);
              return [{ affectedRows: row ? 1 : 0 }];
            },
          };
        },
      };
    },
    delete() {
      return {
        async where(condition) {
          const query = dialect.sqlToQuery(condition);
          predicates.push(query);
          const index = rows.findIndex(
            (item) =>
              item.id === query.params[0] && item.ownerId === query.params[1],
          );
          if (index >= 0) rows.splice(index, 1);
          return [{ affectedRows: index >= 0 ? 1 : 0 }];
        },
      };
    },
  };
  const queries = loadTypeScript("../src/server/db/queries.ts", {
    "server-only": {},
    "~/server/db": { db },
    "~/server/db/schema": schema,
    "uploadthing/server": { UTApi: class {} },
  });
  const revalidated = [];
  const actions = loadTypeScript("../src/server/note-actions.ts", {
    "@clerk/nextjs/server": { auth: async () => ({ userId }) },
    "next/cache": { revalidatePath: (path) => revalidated.push(path) },
    "./db/queries": queries,
  });
  return {
    ...actions,
    ...queries,
    rows,
    predicates,
    revalidated,
    setUser: (id) => {
      userId = id;
    },
  };
}

test("all note actions reject unauthenticated users", async () => {
  const env = setup();
  env.setUser(null);
  assert.ok((await env.createNote()).error);
  assert.ok(
    (await env.updateNote({ id: 1, title: "x", description: "y" })).error,
  );
  assert.ok((await env.deleteNote(1)).error);
  assert.equal(env.predicates.length, 0);
  assert.equal(env.rows.length, 2);
});

test("new notes are owned by the authenticated account", async () => {
  const env = setup();
  const result = await env.createNote();
  assert.equal(result.note.ownerId, "account-a");
  assert.equal(result.note.title, "");
  assert.equal(result.note.description, "");
  assert.deepEqual(env.revalidated, ["/dashboard/notes"]);
});

test("listing notes filters by account in the SQL predicate", async () => {
  const env = setup();
  const notes = await env.DB_QUERIES.getNotesForUser("account-a");
  assert.equal(notes.length, 1);
  assert.equal(notes[0].id, 1);
  assert.match(env.predicates[0].sql, /owner_id/);
  assert.deepEqual(env.predicates[0].params, ["account-a"]);
});

test("saving persists the title and description for the owner", async () => {
  const env = setup();
  assert.equal(
    (
      await env.updateNote({
        id: 1,
        title: "Changed",
        description: "Saved description",
      })
    ).success,
    true,
  );
  assert.equal(env.rows[0].title, "Changed");
  assert.equal(env.rows[0].description, "Saved description");
  assert.match(env.predicates[0].sql, /`id` = \? and .*`owner_id` = \?/);
  assert.deepEqual(env.predicates[0].params, [1, "account-a"]);
});

test("another account cannot update or delete a note, even with a spoofed ownerId", async () => {
  const env = setup();
  assert.equal(
    (
      await env.updateNote({
        id: 2,
        title: "Hacked",
        description: "Changed",
        ownerId: "account-b",
      })
    ).error,
    "Note not found.",
  );
  assert.equal((await env.deleteNote(2)).error, "Note not found.");
  assert.equal(env.rows[1].title, "Other account");
  assert.equal(env.rows.length, 2);
  for (const query of env.predicates) {
    assert.match(query.sql, /`id` = \? and .*`owner_id` = \?/);
    assert.deepEqual(query.params, [2, "account-a"]);
  }
});

test("deleting a note only removes the current account row", async () => {
  const env = setup();
  assert.equal((await env.deleteNote(1)).success, true);
  assert.equal(env.rows.length, 1);
  assert.equal(env.rows[0].ownerId, "account-b");
});

test("invalid ids and oversized text are rejected before database writes", async () => {
  const env = setup();
  for (const id of [-1, 1.5, "1", Number.MAX_SAFE_INTEGER + 1]) {
    assert.ok(
      (await env.updateNote({ id, title: "x", description: "y" })).error,
    );
    assert.ok((await env.deleteNote(id)).error);
  }
  assert.ok(
    (await env.updateNote({ id: 1, title: "x".repeat(201), description: "y" }))
      .error,
  );
  assert.ok(
    (
      await env.updateNote({
        id: 1,
        title: "x",
        description: "y".repeat(100001),
      })
    ).error,
  );
  assert.equal(env.predicates.length, 0);
});

test("image attachments persist and unsafe or oversized image lists are rejected", async () => {
  const env = setup();
  const images = JSON.stringify(["https://example.com/photo.png"]);
  assert.equal(
    (await env.updateNote({ id: 1, title: "Photo", description: "", images }))
      .success,
    true,
  );
  assert.equal(env.rows[0].images, images);
  for (const invalid of [
    "invalid",
    JSON.stringify(["javascript:alert(1)"]),
    JSON.stringify(Array(11).fill("https://example.com/a.png")),
  ]) {
    assert.ok(
      (
        await env.updateNote({
          id: 1,
          title: "",
          description: "",
          images: invalid,
        })
      ).error,
    );
  }
  assert.equal(env.rows[0].images, images);
});
