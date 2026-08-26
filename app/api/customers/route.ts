import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar customer" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const code = String(body.code || "")
      .trim()
      .toUpperCase();
    const name = String(body.name || "").trim();
    const address = String(body.address || "").trim();

    if (!code || !name || !address) {
      return NextResponse.json(
        { error: "Code, Name, dan Address wajib diisi semua" },
        { status: 400 },
      );
    }

    if (code.length > 3) {
      return NextResponse.json(
        { error: "Code maksimal 3 karakter (sesuai skema database)" },
        { status: 400 },
      );
    }

    const existing = await prisma.customer.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: `Code "${code}" sudah dipakai oleh customer lain` },
        { status: 409 },
      );
    }

    const customer = await prisma.customer.create({
      data: { code, name, address },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error("Failed to create customer:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan customer baru ke database" },
      { status: 500 },
    );
  }
}
