import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Ambil berkas & folder
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const folderId = searchParams.get("folderId") || null;

  const items = await prisma.item.findMany({
    where: search 
      ? { name: { contains: search, mode: "insensitive" } }
      : { parentId: folderId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ success: true, data: items });
}

// DELETE: Hapus berkas/folder
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID dibutuhkan" }, { status: 400 });

  await prisma.item.delete({ where: { id } });
  return NextResponse.json({ success: true });
}