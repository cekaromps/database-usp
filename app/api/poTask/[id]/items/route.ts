import { checkSection } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  if (!(await checkSection(["production", "finance"]))) return Response.json({ error: "Forbidden" }, { status: 403 })
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const items = await prisma.poTaskItem.findMany({
      where: { poTaskId: id },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
