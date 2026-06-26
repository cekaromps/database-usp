import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const POST = async (request: Request) => {
  try {
    const { token } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }
    await prisma.pushToken.upsert({
      where: { token },
      update: {},
      create: { token },
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
