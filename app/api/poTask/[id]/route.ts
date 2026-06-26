import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToAll } from "@/lib/sendPush";

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const { doNumber } = body;

    if (typeof doNumber !== "string") {
      return NextResponse.json(
        { error: "doNumber must be a string" },
        { status: 400 },
      );
    }

    const task = await prisma.poTask.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const trimmed = doNumber.trim();

    // only auto-finish if it's actually reached the last stage
    const atFinalStage = task.currentStage === "FINISHED";
    const currentStageItems = task.items.filter(
      (i) => i.stage === task.currentStage,
    );
    const allItemsDone = currentStageItems.every((i) => i.isCompleted);

    const shouldComplete = trimmed !== "" && atFinalStage && allItemsDone;

    const updated = await prisma.poTask.update({
      where: { id },
      data: {
        doNumber: trimmed === "" ? null : trimmed,
        isCompleted: shouldComplete ? true : task.isCompleted,
      },
    });
    if (shouldComplete) {
      await sendPushToAll(
        `${updated.poNumber} completed`,
        `DO Number ${updated.doNumber} - task finished`,
        { taskId: updated.id },
      );
    } else {
      await sendPushToAll(
        `${updated.poNumber} updated`,
        `DO Number set to ${updated.doNumber}`,
        { taskId: updated.id },
      );
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

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
