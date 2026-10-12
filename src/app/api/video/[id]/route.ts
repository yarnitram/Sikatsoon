import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const filePath = path.resolve(process.cwd(), "storage", "downloads", `${id}.mp4`);

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Video not found", { status: 404 });
  }

  const stat = fs.statSync(filePath);
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Length": stat.size.toString(),
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const filePath = path.resolve(process.cwd(), "storage", "downloads", `${id}.mp4`);

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Video not found", { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = request.headers.get("range");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });
    const readable = Readable.toWeb(fileStream) as ReadableStream;

    return new NextResponse(readable, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": "video/mp4",
      },
    });
  }

  const fileStream = fs.createReadStream(filePath);
  const readable = Readable.toWeb(fileStream) as ReadableStream;

  return new NextResponse(readable, {
    status: 200,
    headers: {
      "Content-Length": fileSize.toString(),
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
    },
  });
}
