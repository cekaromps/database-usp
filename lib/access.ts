// Pure permission logic, shared by proxy.ts (edge) and server code.
import type { SectionKey } from "@/lib/sections"
import { ASSIGNABLE_SECTION_KEYS, type AssignableSectionKey, type PathRequirement } from "@/lib/section-routing"

export type Role = "SUPERADMIN" | "ADMIN" | "USER"

/**
 * `sections`:
 *   - null  -> no access group assigned: legacy behaviour, all sections.
 *   - array -> restricted to exactly those sections.
 * SUPERADMIN always has everything regardless of group.
 */
export type Access = { role: Role; sections: string[] | null }

/** Assignable sections the user may open ("users" is handled separately: SUPERADMIN only). */
export function allowedSections(a: Access): AssignableSectionKey[] {
  if (a.role === "SUPERADMIN" || a.sections === null) return ASSIGNABLE_SECTION_KEYS
  return ASSIGNABLE_SECTION_KEYS.filter((k) => a.sections!.includes(k))
}

export function hasFullAccess(a: Access) {
  return a.role === "SUPERADMIN" || a.sections === null
}

export function canAccessSection(a: Access, section: SectionKey) {
  if (section === "users") return a.role === "SUPERADMIN"
  return allowedSections(a).includes(section)
}

export function canAccessRequirement(a: Access, req: PathRequirement) {
  switch (req.kind) {
    case "open":
      return true
    case "superadmin":
      return a.role === "SUPERADMIN"
    case "section":
      return canAccessSection(a, req.section)
    case "full-access":
      return hasFullAccess(a)
  }
}
