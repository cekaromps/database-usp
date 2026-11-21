import { requireSection } from "@/lib/rbac"

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireSection("production")
  return <>{children}</>
}
