import type { Role } from "@/lib/generated/prisma/client";
import { SECTION_KEYS, type SectionKey } from "./sections";

type Actor = { role: Role; group: { sections: string[] } | null };

export function allowedSections(u: Actor): SectionKey[] {
  if (u.role === "SUPERADMIN") return SECTION_KEYS;
  if (u.group) return SECTION_KEYS.filter((k) => u.group!.sections.includes(k));
  return SECTION_KEYS; // legacy fallback: adjust to match what ADMIN/USER see today
}

export const canAccess = (u: Actor, s: SectionKey) => allowedSections(u).includes(s);
export const isSuperAdmin = (u: Actor) => u.role === "SUPERADMIN";