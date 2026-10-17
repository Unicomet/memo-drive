import { zip, type Zippable } from "fflate";

interface DownloadImage {
  id: number;
  name: string;
  url?: string;
}

export async function downloadImages(images: DownloadImage[]) {
  if (!images.length) return;

  const entries: Zippable = Object.create(null) as Zippable;
  // Fetch sequentially to avoid overloading storage with large selections.
  for (const image of images) {
    const response = await fetch(
      image.url ?? `/api/files/${image.id}/download`,
    );
    if (!response.ok) {
      throw new Error(`Could not download ${image.name}. Please try again.`);
    }
    // Prefix with the file id to keep duplicate names and unsafe paths distinct.
    const name = `${image.id}-${image.name.replace(/[/\\\x00-\x1f]/g, "_")}`;
    entries[name] = new Uint8Array(await response.arrayBuffer());
  }

  const archive = await new Promise<Uint8Array<ArrayBuffer>>(
    (resolve, reject) => {
      zip(entries, { level: 0 }, (error, data) => {
        if (error) reject(error);
        else resolve(new Uint8Array(data));
      });
    },
  );
  const url = URL.createObjectURL(
    new Blob([archive], { type: "application/zip" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "images.zip";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadImage(url: string) {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error("Could not download image. Please try again.");
  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = new URL(url).pathname.split("/").pop() || "image";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
