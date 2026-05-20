import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/session"
import { logoutAction } from "@/app/actions/auth"
import InvoiceForm from "./InvoiceMaker"

export const dynamic = "force-dynamic"

export default async function InvoiceMaker() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get("session")?.value
  const session = await decrypt(cookie)

  return (
    <div className="min-h-screen bg-macos-base text-macos-primary p-10 font-sans antialiased">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-macos-separator">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" // 🌟 Diubah murni kembali ke dashboard pusat
            className="flex items-center justify-center w-10 h-10 bg-macos-tertiary border border-macos-separator rounded-xl text-macos-secondary hover:text-macos-blue hover:border-macos-blue/30 active:scale-95 transition-all cursor-pointer shadow-sm"
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoice Maker</h1>
            <p className="text-sm text-macos-secondary mt-0.5">
              Logged in as: <span className="font-semibold text-macos-primary">{String(session?.username)}</span>
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="px-4 py-2 bg-macos-red text-white text-sm font-medium rounded-md hover:bg-opacity-80 transition cursor-pointer shadow-md">
            Sign Out
          </button>
        </form>
      </div>

      <div className="max-w-4xl mx-auto">
        <InvoiceForm />
      </div>
    </div>
  )
}
