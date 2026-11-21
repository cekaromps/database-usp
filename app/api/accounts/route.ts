import { checkSection } from "@/lib/rbac"
// app/api/accounts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await checkSection("finance"))) return Response.json({ error: "Forbidden" }, { status: 403 })
  try {
    // Ambil semua akun COA dari database, urutkan berdasarkan kode akun
    const accounts = await prisma.account.findMany({
      orderBy: {
        code: "asc",
      },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Gagal mengambil data COA untuk dropdown brayy:", error);
    return NextResponse.json(
      { error: "Gagal memuat data akun" },
      { status: 500 },
    );
  }
}
