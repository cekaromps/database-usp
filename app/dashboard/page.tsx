import { logoutAction } from "@/app/actions/auth"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/session"
import { redirect } from "next/navigation"

// CRITICAL: Force this page to render live on every request
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get("session")?.value
  const session = await decrypt(cookie)

  // Backup fallback protection: if cookie verification fails, kick out instantly
  if (!session?.userId) {
    redirect("/signin")
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Welcome, {String(session?.username)}!</h1>
      <form action={logoutAction}>
        <button type="submit" style={{ padding: "8px 16px", background: "red", color: "white" }}>
          Sign Out
        </button>
      </form>
    </div>
  )
}
