import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) => {
  try {
    const { itemId } = await params;
    const { isCompleted, notes } = await request.json();

    const updated = await prisma.poTaskItem.update({
      where: { id: itemId },
      data: {
        ...(isCompleted !== undefined && { isCompleted }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
