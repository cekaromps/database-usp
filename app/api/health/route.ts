import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "healthy", database: "connected" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Database connection failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: "Database unreachable",
      },
      { status: 503 },
    );
  }
}
