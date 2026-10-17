"use server"

import { createSession, deleteSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

export async function loginAction(formData: FormData) {
  const usernameInput = formData.get("username") as string
  const passwordInput = formData.get("password") as string

  if (!usernameInput || !passwordInput) return "Missing fields"

  // Standardize case format to avoid capitalization mismatches
  const username = usernameInput.trim().toLowerCase()

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { group: { select: { sections: true } } },
    })

    if (!user) {
      return "Invalid credentials" // User not found
    }

    if (!user.isActive) {
      return "Akun ini telah dinonaktifkan. Hubungi admin."
    }

    const isValid = await bcrypt.compare(passwordInput, user.password)

    if (!isValid) {
      return "Invalid credentials" // Password mismatch
    }

    await createSession(user)
  } catch (error) {
    console.error("Login Server Error:", error)
    return "Authentication failed"
  }

  redirect("/dashboard")
}

export async function logoutAction() {
  await deleteSession()
  redirect("/signin")
}
