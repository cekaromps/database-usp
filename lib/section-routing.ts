// Routing/permission helpers built on top of YOUR lib/sections.ts (which stays the
// single source of truth for keys, labels and paths). Edge-safe: proxy.ts imports it.
import { SECTIONS, SECTION_KEYS, type SectionKey } from "@/lib/sections"

/**
 * "users" (user management) is in SECTIONS so it can show as a dashboard card, but it is
 * SUPERADMIN-only and can never be granted to an account type. Only these keys appear as
 * checkboxes and are accepted when saving a group.
 */
export type AssignableSectionKey = Exclude<SectionKey, "users">
export const ASSIGNABLE_SECTION_KEYS = SECTION_KEYS.filter(
  (k): k is AssignableSectionKey => k !== "users",
)

export function isAssignableSection(v: unknown): v is AssignableSectionKey {
  return typeof v === "string" && (ASSIGNABLE_SECTION_KEYS as string[]).includes(v)
}

/** Drive root folder of a section = last segment of its path (HRD, finance, ...), case-insensitive. */
function driveRoot(key: SectionKey) {
  return SECTIONS[key].path.split("/").filter(Boolean).pop()!.toLowerCase()
}

/**
 * Which section does a /dashboard/* URL belong to? Add new pages here.
 * ASSUMPTION: invoice/invoicemaker/accounting/datapodo are Finance; ecom and
 * outstandingpo are Production -- change if that's wrong.
 */
const PATH_RULES: [prefix: string, section: AssignableSectionKey][] = [
  ["/dashboard/hrd", "HRD"],
  ["/dashboard/finance", "finance"],
  ["/dashboard/invoicemaker", "finance"],
  ["/dashboard/invoice", "finance"],
  ["/dashboard/accounting", "finance"],
  ["/dashboard/datapodo", "finance"],
  ["/dashboard/production", "production"],
  ["/dashboard/outstandingpo", "production"],
  ["/dashboard/ecom", "production"],
  ["/dashboard/design", "design"],
]

/** Pages that open a drive file (?file=Root/...); the section comes from the root folder. */
const FILE_VIEWER_PREFIXES = ["/dashboard/word", "/dashboard/excel", "/dashboard/pdf"]

/**
 * Resolve "." / ".." segments BEFORE deciding which root folder a path lives in, so
 * "Production/../HRD/x" is treated as HRD (not Production). Returns null if the path
 * climbs above the drive root.
 */
export function normalizeDrivePath(drivePath: string | null | undefined): string[] | null {
  const out: string[] = []
  for (const seg of (drivePath ?? "").split(/[\\/]+/)) {
    if (seg === "" || seg === ".") continue
    if (seg === "..") {
      if (out.length === 0) return null
      out.pop()
    } else out.push(seg)
  }
  return out
}

export function sectionForDrivePath(drivePath: string | null | undefined): AssignableSectionKey | null {
  const root = normalizeDrivePath(drivePath)?.[0]?.toLowerCase()
  if (!root) return null
  return ASSIGNABLE_SECTION_KEYS.find((k) => driveRoot(k) === root) ?? null
}

export type PathRequirement =
  | { kind: "open" } // any logged-in user (the /dashboard home itself)
  | { kind: "superadmin" } // /dashboard/admin/* (user management)
  | { kind: "section"; section: AssignableSectionKey }
  | { kind: "full-access" } // unmapped page: only superadmin / users with no account type

export function requirementForPath(pathname: string, fileParam?: string | null): PathRequirement {
  const p = pathname.toLowerCase().replace(/\/+$/, "") || "/"
  if (p === "/dashboard") return { kind: "open" }
  if (p.startsWith("/dashboard/admin")) return { kind: "superadmin" }

  if (FILE_VIEWER_PREFIXES.some((x) => p === x || p.startsWith(x + "/"))) {
    const s = sectionForDrivePath(fileParam)
    return s ? { kind: "section", section: s } : { kind: "full-access" }
  }

  for (const [prefix, section] of PATH_RULES) {
    if (p === prefix || p.startsWith(prefix + "/")) return { kind: "section", section }
  }
  return { kind: "full-access" }
}
