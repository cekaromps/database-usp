import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = async (
  request: Request,
  { params }: { params: { id: string } },
) => {
  try {
    const items = await prisma.poTaskItem.findMany({
      where: { poTaskId: params.id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
