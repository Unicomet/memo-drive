import assert from "node:assert/strict";
import test from "node:test";
import { pathToFileURL } from "node:url";
import path from "node:path";

const tsPath = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "../src/lib/content-disposition.ts",
);

const { buildAttachmentContentDisposition } = await import(
  pathToFileURL(tsPath).href
);

test("sets attachment disposition with exact ASCII filename", () => {
  const header = buildAttachmentContentDisposition("report.pdf");
  assert.match(header, /^attachment;/);
  assert.match(header, /filename="report\.pdf"/);
  assert.match(header, /filename\*=UTF-8''report\.pdf/);
});

test("preserves unicode filename via RFC 5987 encoding", () => {
  const header = buildAttachmentContentDisposition("résumé final.docx");
  assert.match(header, /filename\*=UTF-8''r%C3%A9sum%C3%A9%20final\.docx/);
  assert.match(header, /filename="r_sum_ final\.docx"/);
});

test("falls back when name is blank", () => {
  const header = buildAttachmentContentDisposition("   ");
  assert.match(header, /filename="download"/);
});
