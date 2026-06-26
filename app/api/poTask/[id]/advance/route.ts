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

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const task = await prisma.poTask.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (task.isCompleted) {
      return NextResponse.json(
        { error: "Task already completed" },
        { status: 400 },
      );
    }

    const currentStageItems = task.items.filter(
      (i) => i.stage === task.currentStage,
    );
    const allChecked = currentStageItems.every((i) => i.isCompleted);
    if (currentStageItems.length > 0 && !allChecked) {
      return NextResponse.json(
        { error: "Complete all items in current stage first" },
        { status: 400 },
      );
    }

    const currentIndex = STAGE_ORDER.indexOf(task.currentStage);
    const nextStage = STAGE_ORDER[currentIndex + 1];

    const updated = await prisma.poTask.update({
      where: { id },
      data: {
        currentStage: nextStage ?? task.currentStage,
      },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
