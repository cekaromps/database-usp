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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type, size, parentId, contentData } = body;

    const parsedSize = size ? parseInt(size.toString()) : 0;

    let finalType = "FILE"; 
    if (type) {
      finalType = type.toUpperCase(); 
    }

    let cleanContentData = contentData;

    const newItem = await prisma.item.create({
      data: {
        name: name,
        type: finalType as any, 
        size: isNaN(parsedSize) ? 0 : parsedSize,
        parentId: parentId || null,
        contentData: cleanContentData, 
      },
    });

    return NextResponse.json({ success: true, data: newItem });
  } catch (error: any) {
    console.error("❌ EROR UTAMA DI POST FILEMAN ROUTE:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Gagal menyimpan ke database" 
    }, { status: 500 });
  }
}
