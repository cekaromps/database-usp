import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }, // 🔥 FIX 1: Ubah tipe params menjadi Promise
) {
    try {
        // 🔥 FIX 2: Wajib jalankan 'await' pada params terlebih dahulu
        const resolvedParams = await params;
        const id = resolvedParams.id;

        console.log("🔍 Menerima request GET untuk ID:", id);

        if (!id || id === "undefined") {
            return NextResponse.json(
                { error: "ID tidak valid atau bernilai undefined" },
                { status: 400 },
            );
        }

        // 🔥 FIX 3: Perbaikan sintaks Prisma dari 'where: id' menjadi 'where: { id }'
        const task = await prisma.poTask.findUnique({
            where: { id },
        });

        if (!task) {
            return NextResponse.json(
                { error: `PO Task dengan ID ${id} tidak ditemukan` },
                { status: 404 },
            );
        }

        const isOverdue =
            task.estimatedDelivery &&
            new Date(task.estimatedDelivery) < new Date() &&
            !task.isCompleted;

        return NextResponse.json(
            {
                ...task,
                isOverdue,
            },
            { status: 200 },
        );
    } catch (error: any) {
        console.error("❌ Error pada GET ID:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
