import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { name, parentId } = await req.json();
  const folder = await prisma.item.create({
    data: { name, type: "FOLDER", parentId: parentId || null }
  });
  return NextResponse.json({ success: true, data: folder });
}