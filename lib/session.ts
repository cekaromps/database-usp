import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

// This key signs your tokens. Keep it secret!
const secretKey = process.env.AUTH_SECRET || "fallback-secret-at-least-32-chars-long!!"
const encodedKey = new TextEncoder().encode(secretKey)

export type Role = "SUPERADMIN" | "ADMIN" | "USER"

export type SessionPayload = {
  userId: string
  username: string
  role: Role
  isActive: boolean
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(user: {
  id: string
  username: string
  role: Role
  isActive: boolean
}) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
  const session = await encrypt({
    userId: user.id,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
  })

  const cookieStore = await cookies()
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

/**
 * Reads + decrypts the session cookie in one call. Use this in server
 * components / server actions instead of duplicating the cookies() + decrypt()
 * boilerplate.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get("session")?.value
  const session = await decrypt(cookie)
  if (!session?.userId) return null
  return session
}
