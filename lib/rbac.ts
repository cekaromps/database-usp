import { redirect } from "next/navigation"
import { getSession, type Role, type SessionPayload } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { canAccessSection, hasFullAccess } from "@/lib/access"
import type { SectionKey } from "@/lib/sections"
import { sectionForDrivePath } from "@/lib/section-routing"

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

/**
 * Reads the CURRENT role / active flag / access group from the database instead of
 * trusting the 7-day JWT, so deactivating a user, demoting them, or editing their
 * group takes effect on the very next request.
 */
async function loadFreshSession(): Promise<SessionPayload | null> {
  const session = await getSession()
  if (!session) return null
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { username: true, role: true, isActive: true, group: { select: { sections: true } } },
  })
  if (!user || !user.isActive) return null
  return {
    userId: session.userId,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    sections: user.group ? user.group.sections : null,
  }
}

/** Returns the session or redirects to /signin if not authenticated / deactivated. */
export async function requireUser(): Promise<SessionPayload> {
  const session = await loadFreshSession()
  if (!session) redirect("/signin")
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

/** Page/layout guard: user must be allowed into `section`. */
export async function requireSection(section: SectionKey): Promise<SessionPayload> {
  const session = await requireUser()
  if (!canAccessSection(session, section)) {
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
  const session = await loadFreshSession()
  if (!session) return null
  if (!allowed.includes(session.role)) return null
  return session
}

/** Server action / route handler guard: allowed into ANY of the given sections. */
export async function checkSection(
  sections: SectionKey | SectionKey[],
): Promise<SessionPayload | null> {
  const session = await loadFreshSession()
  if (!session) return null
  const list = Array.isArray(sections) ? sections : [sections]
  return list.some((s) => canAccessSection(session, s)) ? session : null
}

/**
 * Guard for anything that touches the file drive. The first folder of the path
 * (HRD / Finance / Production / Design) decides which section is required.
 * Paths outside a known root need full access (superadmin or no group).
 */
export async function checkDrivePath(drivePath: string | null | undefined): Promise<SessionPayload | null> {
  const session = await loadFreshSession()
  if (!session) return null
  const section = sectionForDrivePath(drivePath)
  if (section) return canAccessSection(session, section) ? session : null
  return hasFullAccess(session) ? session : null
}

/** Page guard for unmapped pages: only SUPERADMIN or users without an access group. */
export async function requireFullAccess(): Promise<SessionPayload> {
  const session = await requireUser()
  if (!hasFullAccess(session)) redirect("/dashboard?error=forbidden")
  return session
}

/** Page guard for the drive file viewers (?file=Root/...). */
export async function requireDrivePath(drivePath: string | null | undefined): Promise<SessionPayload> {
  const session = await checkDrivePath(drivePath)
  if (!session) redirect("/dashboard?error=forbidden")
  return session
}

/**
 * Server-action guard. Every export of a "use server" file is a public POST endpoint,
 * so each one must call this (or checkRole) itself. Throws instead of redirecting.
 */
export async function assertSection(sections: SectionKey | SectionKey[]): Promise<SessionPayload> {
  const session = await checkSection(sections)
  if (!session) throw new Error("Forbidden")
  return session
}

export async function assertFullAccess(): Promise<SessionPayload> {
  const session = await loadFreshSession()
  if (!session || !hasFullAccess(session)) throw new Error("Forbidden")
  return session
}
