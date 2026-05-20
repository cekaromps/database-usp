import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client/extension"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Check if user exists
    const exists = await prisma.user.findUnique({ where: { username } })
    if (exists) {
      return NextResponse.json({ error: "Username taken" }, { status: 400 })
    }

    // Hash password and save
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, password: hashedPassword }
    })

    return NextResponse.json({ message: "User registered" }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Error creating user" }, { status: 500 })
  }
}
