/** Build a Content-Disposition attachment header that preserves the exact filename. */
export function buildAttachmentContentDisposition(filename: string): string {
  const safeName = filename.trim() || "download";
  const fallback = safeName
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(safeName).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
