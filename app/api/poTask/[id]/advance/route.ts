import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskStage } from "@/lib/generated/prisma/enums";

const STAGE_ORDER: TaskStage[] = [
    "DRAWING",
    "MATERIAL",
    "TOOLING",
    "PRODUCTION",
    "SUBCON",
    "FINISHED",
];

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }, // 🔥 FIX 1: Ubah tipe params menjadi Promise
) {
    try {
        // 🔥 FIX 2: Wajib jalankan 'await' pada params terlebih dahulu
        const resolvedParams = await params;
        const id = resolvedParams.id;

        console.log("🚀 SERVER LOG: Menerima request advance untuk ID:", id);

        if (!id || id === "undefined") {
            return NextResponse.json(
                { error: "ID tidak valid atau bernilai undefined di URL" },
                { status: 400 },
            );
        }

        // Cari task berdasarkan ID
        const task = await prisma.poTask.findUnique({ where: { id } });

        if (!task) {
            return NextResponse.json(
                { error: `Task dengan ID ${id} tidak ditemukan` },
                { status: 404 },
            );
        }

        // Cek jika task sudah selesai
        if (task.isCompleted || task.currentStage === "FINISHED") {
            return NextResponse.json(
                { message: "Task is already fully completed." },
                { status: 400 },
            );
        }

        // Hitung tahap berikutnya
        const currentIndex = STAGE_ORDER.indexOf(task.currentStage);
        const nextStage = STAGE_ORDER[currentIndex + 1];

        let updateData: any = {};

        if (nextStage === "FINISHED") {
            updateData = {
                currentStage: "FINISHED",
                isCompleted: true,
            };
        } else {
            updateData = {
                currentStage: nextStage,
            };
        }

        // Update ke database
        const updatedTask = await prisma.poTask.update({
            where: { id },
            data: updateData,
        });

        console.log(
            `✅ SERVER LOG: Berhasil update ID ${id} ke tahap ${nextStage}`,
        );

        return NextResponse.json({
            message: `Advanced to ${nextStage}`,
            task: updatedTask,
        });
    } catch (error: any) {
        console.error("❌ SERVER LOG ERROR:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
