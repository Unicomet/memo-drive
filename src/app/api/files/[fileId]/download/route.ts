import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { buildAttachmentContentDisposition } from "~/lib/content-disposition";
import { hasPermission } from "~/lib/auth";
import { db } from "~/server/db";
import { files_table } from "~/server/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId: fileIdParam } = await context.params;
  const fileId = Number(fileIdParam);
  if (!Number.isFinite(fileId) || fileId <= 0) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }

  const [file] = await db
    .select()
    .from(files_table)
    .where(and(eq(files_table.id, fileId)));

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const isOwner = file.ownerId === session.userId;
  const canView =
    isOwner ||
    (await hasPermission(
      session.userId,
      { id: fileId, type: "file" },
      "view",
    ));

  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(file.url);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch file from storage" },
      { status: 502 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Failed to fetch file from storage" },
      { status: 502 },
    );
  }

  const headers = new Headers();
  headers.set(
    "Content-Disposition",
    buildAttachmentContentDisposition(file.name),
  );
  headers.set(
    "Content-Type",
    upstream.headers.get("Content-Type") ?? "application/octet-stream",
  );
  const contentLength = upstream.headers.get("Content-Length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }
  headers.set("Cache-Control", "private, no-store");

  return new NextResponse(upstream.body, {
    status: 200,
    headers,
  });
}
