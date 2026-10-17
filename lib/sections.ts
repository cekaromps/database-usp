// lib/sections.ts  (the single source of truth, put your real 5 here)
export const SECTIONS = {
  HRD: { label: "HRD", path: "/dashboard/HRD" },
  finance:    { label: "Finance",    path: "/dashboard/finance" },
  design:     { label: "Design",     path: "/dashboard/design" },
  production:      { label: "Production",      path: "/dashboard/production" },
  users:       { label: "Users",       path: "/dashboard/admin/users" },
} as const;

export type SectionKey = keyof typeof SECTIONS;
export const SECTION_KEYS = Object.keys(SECTIONS) as SectionKey[];