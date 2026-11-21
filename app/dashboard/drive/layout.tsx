import { requireFullAccess } from "@/lib/rbac"

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireFullAccess()
  return <>{children}</>
}
