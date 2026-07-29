import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ filename: string }>;
  },
) {
  const { filename } = await params;
  const filePath = path.join(process.cwd(), "uploads", "ecom", filename);

  try {
    const file = await fs.readFile(filePath);
    const ext = path.extname(filename).toLowerCase();

    const contentType =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Not found", {
      status: 404,
    });
  }
}
