import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { canAccessRequirement } from "@/lib/access"
import { requirementForPath } from "@/lib/section-routing"

// NOTE: middleware runs on the Edge runtime, so it can only use jose (not
// prisma/bcrypt). It decodes the same JWT cookie created in lib/session.ts.
const secretKey = process.env.AUTH_SECRET || "fallback-secret-at-least-32-chars-long!!"
const encodedKey = new TextEncoder().encode(secretKey)

type SessionPayload = {
  userId: string
  username: string
  role: "SUPERADMIN" | "ADMIN" | "USER"
  isActive: boolean
  sections?: string[] | null // absent on tokens issued before access groups existed -> treated as null
}

async function readSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ["HS256"] })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function proxy(req: NextRequest) {
  const { nextUrl } = req
  const token = req.cookies.get("session")?.value
  const session = await readSession(token)
  const isLoggedIn = !!session?.userId && session.isActive

  const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
  const isOnAuthPage = nextUrl.pathname === "/signin"

  // 1. Logged out and hitting a protected dashboard route -> signin
  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/signin", req.url))
  }

  // 2. Logged in but not allowed into this section (or into /dashboard/admin, which is
  //    SUPERADMIN-only). This is only a fast first gate based on the JWT; pages, server
  //    actions and API routes re-check against the database (see lib/rbac.ts).
  if (isOnDashboard && isLoggedIn) {
    const requirement = requirementForPath(nextUrl.pathname, nextUrl.searchParams.get("file"))
    const allowed = canAccessRequirement(
      { role: session!.role, sections: session!.sections ?? null },
      requirement,
    )
    if (!allowed) {
      return NextResponse.redirect(new URL("/dashboard?error=forbidden", req.url))
    }
  }

  // 3. Logged in and hitting signin -> bounce to dashboard
  if (isOnAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads/).*)"],
}
