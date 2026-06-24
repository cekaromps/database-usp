import { prisma } from "@/lib/prisma";

export const PATCH = async (
  request: Request,
  { params }: { params: { itemId: string } },
) => {
  try {
    const { isCompleted, notes } = await request.json();

    const updated = await prisma.poTaskItem.update({
      where: { id: params.itemId },
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
