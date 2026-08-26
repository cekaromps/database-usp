import { redirect } from "next/navigation"
import { getSession, type Role, type SessionPayload } from "@/lib/session"

/**
 * Role hierarchy used across the app:
 *  - SUPERADMIN: full access. Only a SUPERADMIN can create/edit/delete other
 *    ADMIN or SUPERADMIN accounts.
 *  - ADMIN: can manage regular USER accounts (create/deactivate/delete/reset
 *    password) but cannot touch ADMIN or SUPERADMIN accounts.
 *  - USER: regular dashboard access only, no user-management access.
 */
export const ROLE_RANK: Record<Role, number> = {
  USER: 0,
  ADMIN: 1,
  SUPERADMIN: 2,
}

export function isAtLeast(role: Role, minimum: Role) {
  return ROLE_RANK[role] >= ROLE_RANK[minimum]
}

/** Returns the session or redirects to /signin if not authenticated / deactivated. */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session || !session.isActive) {
    redirect("/signin")
  }
  return session
}

/**
 * Returns the session if the user's role is one of `allowed`, otherwise
 * redirects to /dashboard with a `?error=forbidden` flag. Use inside server
 * components (pages/layouts).
 */
export async function requireRole(allowed: Role[]): Promise<SessionPayload> {
  const session = await requireUser()
  if (!allowed.includes(session.role)) {
    redirect("/dashboard?error=forbidden")
  }
  return session
}

/**
 * Same role check but for use inside server actions / route handlers, where
 * redirecting isn't appropriate. Returns null when unauthorized instead of
 * throwing, so callers can return a friendly error string.
 */
export async function checkRole(allowed: Role[]): Promise<SessionPayload | null> {
  const session = await getSession()
  if (!session || !session.isActive) return null
  if (!allowed.includes(session.role)) return null
  return session
}
