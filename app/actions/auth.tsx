"use server"

import { signIn } from "../../lib/auth"
import { AuthError } from "next-auth"
import { createSession, deleteSession } from "@/lib/session"
import {prisma} from "@/lib/prisma"
import bcrypt from "bcryptjs"
import {redirect} from "next/navigation"

export async function signupAction(formData: FormData) {
  const usernameInput = formData.get("username") as string
  const passwordInput = formData.get("password") as string

  if (!usernameInput || !passwordInput) return "Missing fields"

  const username = usernameInput.trim().toLowerCase() // Standardize here too

  try {
    const exists = await prisma.user.findUnique({ where: { username } })
    if (exists) return "Username already taken"

    const hashedPassword = await bcrypt.hash(passwordInput, 10)
    const user = await prisma.user.create({
      data: { username, password: hashedPassword }
    })

    await createSession(user.id, user.username)
  } catch (error) {
    console.error(error)
    return "Database transaction failed"
  }

  redirect("/dashboard") 
}


export async function loginAction(formData: FormData) {
  const usernameInput = formData.get("username") as string
  const passwordInput = formData.get("password") as string

  if (!usernameInput || !passwordInput) return "Missing fields"

  // Standardize case format to avoid capitalization mismatches
  const username = usernameInput.trim().toLowerCase() 

  try {
    const user = await prisma.user.findUnique({ 
      where: { username } 
    })

    // Debug tracking (Check your terminal logs to see what prints!)
    console.log("Database Lookup Result:", user)

    if (!user) {
      return "Invalid credentials" // User not found
    }

    // Explicitly compare the plain text with the database hash string
    const isValid = await bcrypt.compare(passwordInput, user.password)
    console.log("Password Match Status:", isValid)

    if (!isValid) {
      return "Invalid credentials" // Password mismatch
    }

    // Set the cookie session securely
    await createSession(user.id, user.username)

  } catch (error) {
    console.error("Login Server Error:", error)
    return "Authentication failed"
  }

  // Redirect after successfully creating the cookie context
  redirect("/dashboard") 
}

export async function logoutAction() {
    await deleteSession();
    redirect("/signin")
}
