import assert from "node:assert/strict";
import { test } from "node:test";
import { createNoteSaver } from "../src/app/dashboard/notes/note-saver.ts";

const initial = { title: "Title", description: "Description" };

test("polling accepts remote text without writing it back", async () => {
  let values = initial;
  let writes = 0;
  const saver = createNoteSaver(
    initial,
    () => values,
    async () => {
      writes++;
      return true;
    },
    () => {},
  );
  const remote = { title: "Remote title", description: "Remote description" };
  assert.equal(saver.acceptRemote(remote), true);
  values = remote;
  assert.equal(await saver.save(), true);
  assert.equal(writes, 0);
});

test("polling preserves unsaved edits and outstanding saves", async () => {
  let values = { ...initial, title: "Local edit" };
  let release;
  const saver = createNoteSaver(
    initial,
    () => values,
    async () => {
      await new Promise((resolve) => {
        release = resolve;
      });
      return true;
    },
    () => {},
  );
  assert.equal(saver.acceptRemote(initial), false);
  const saving = saver.save();
  values = initial;
  assert.equal(saver.acceptRemote(initial), false);
  values = { ...initial, title: "Local edit" };
  release();
  await saving;
});

test("unchanged notes do not write to the database", async () => {
  let writes = 0;
  const saver = createNoteSaver(
    initial,
    () => initial,
    async () => {
      writes++;
      return true;
    },
    () => {},
  );
  assert.equal(await saver.save(), true);
  assert.equal(writes, 0);
});

test("saving persists the title and description and marks them saved", async () => {
  const values = { title: "New title", description: "New description" };
  let saved;
  const writes = [];
  const saver = createNoteSaver(
    initial,
    () => values,
    async (value) => {
      writes.push(value);
      return true;
    },
    (value) => {
      saved = value;
    },
  );
  assert.equal(saver.hasChanges(), true);
  assert.equal(await saver.save(), true);
  assert.deepEqual(writes, [values]);
  assert.deepEqual(saved, values);
  assert.equal(saver.hasChanges(), false);
});

test("edits during an outstanding save are serialized and the newest text wins", async () => {
  let values = { title: "First edit", description: "First description" };
  let release;
  const writes = [];
  const saver = createNoteSaver(
    initial,
    () => values,
    async (value) => {
      writes.push(value);
      if (writes.length === 1)
        await new Promise((resolve) => {
          release = resolve;
        });
      return true;
    },
    () => {},
  );
  const first = saver.save();
  values = { title: "Latest edit", description: "Latest description" };
  const second = saver.save();
  const third = saver.save();
  assert.equal(writes.length, 1);
  release();
  assert.deepEqual(await Promise.all([first, second, third]), [
    true,
    true,
    true,
  ]);
  assert.deepEqual(writes, [
    { title: "First edit", description: "First description" },
    values,
  ]);
  assert.equal(saver.hasChanges(), false);
});

test("failed saves preserve changes and allow retry", async () => {
  const values = { title: "Unsaved", description: "Keep these edits" };
  let succeed = false;
  let savedCount = 0;
  const saver = createNoteSaver(
    initial,
    () => values,
    async () => succeed,
    () => {
      savedCount++;
    },
  );
  assert.equal(await saver.save(), false);
  assert.equal(saver.hasChanges(), true);
  assert.equal(savedCount, 0);
  succeed = true;
  assert.equal(await saver.save(), true);
  assert.equal(saver.hasChanges(), false);
  assert.equal(savedCount, 1);
});

test("image-only changes save and remote refresh cannot overwrite unsaved attachments", async () => {
  const original = { ...initial, images: "[]" };
  let values = { ...original, images: '["https://example.com/photo.png"]' };
  let persisted;
  const saver = createNoteSaver(
    original,
    () => values,
    async (snapshot) => {
      persisted = snapshot;
      return true;
    },
    () => {},
  );
  assert.equal(saver.acceptRemote(original), false);
  assert.equal(await saver.save(), true);
  assert.equal(persisted.images, values.images);
  assert.equal(saver.hasChanges(), false);
});
