import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Sesuaikan path prisma client kamu

// 1. POST: Menyimpan File Baru beserta Isinya
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, size, parentId, contentData } = body;

    const newFile = await prisma.item.create({
      data: {
        name,
        type: "FILE", // Pastikan "FILE" ini sesuai dengan enum ItemType kamu
        size: size ? Number(size) : null,
        parentId: parentId || null, // Sekarang bisa langsung isi parentId dengan aman!
        contentData: contentData || null, // Otomatis disimpan sebagai JSON beneran oleh Prisma
      },
    });

    return NextResponse.json({ success: true, data: newFile });
  } catch (error) {
    console.error("Gagal menyimpan file:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}

// 2. GET: Mengambil Konten File Spesifik untuk Preview
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID berkas dibutuhkan" }, { status: 400 });
    }

    const fileItem = await prisma.item.findUnique({
      where: { id },
    });

    if (!fileItem) {
      return NextResponse.json({ success: false, error: "Berkas tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: fileItem });
  } catch (error) {
    console.error("Gagal memuat detail file:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}