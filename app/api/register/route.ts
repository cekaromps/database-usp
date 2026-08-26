import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const normalizedUsername = String(username).trim().toLowerCase()

    const exists = await prisma.user.findUnique({ where: { username: normalizedUsername } })
    if (exists) {
      return NextResponse.json({ error: "Username taken" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Public registration always creates a plain USER account. Role escalation
    // must go through an authenticated admin via /api/users or the admin UI.
    await prisma.user.create({
      data: { username: normalizedUsername, password: hashedPassword, role: "USER" },
    })

    return NextResponse.json({ message: "User registered" }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error creating user" }, { status: 500 })
  }
}
