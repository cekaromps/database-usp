import { prisma } from "@/lib/prisma"
import { checkRole } from "@/lib/rbac"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

// Both endpoints below are for admin/superadmin use only (e.g. programmatic
// access). The primary UI for this lives at /dashboard/admin/users.

export async function GET() {
  const session = await checkRole(["SUPERADMIN", "ADMIN"])
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const session = await checkRole(["SUPERADMIN", "ADMIN"])
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { username, password, role } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const requestedRole = role === "ADMIN" || role === "SUPERADMIN" ? role : "USER"

  // Only a SUPERADMIN may create ADMIN/SUPERADMIN accounts. A plain ADMIN can
  // only create regular USER accounts.
  if (requestedRole !== "USER" && session.role !== "SUPERADMIN") {
    return NextResponse.json(
      { error: "Only a superadmin can create admin accounts" },
      { status: 403 },
    )
  }

  const normalizedUsername = String(username).trim().toLowerCase()

  const exists = await prisma.user.findUnique({ where: { username: normalizedUsername } })
  if (exists) {
    return NextResponse.json({ error: "Username taken" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const newUser = await prisma.user.create({
    data: { username: normalizedUsername, password: hashedPassword, role: requestedRole },
    select: { id: true, username: true, role: true, isActive: true, createdAt: true },
  })

  return NextResponse.json(newUser, { status: 201 })
}
