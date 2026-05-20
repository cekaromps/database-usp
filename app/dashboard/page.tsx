import { logoutAction } from "@/app/actions/auth"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/session"
import { redirect } from "next/navigation"
import Link from "next/link" // 👈 Menggunakan Link bawaan Next.js untuk navigasi tanpa refresh

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get("session")?.value
  const session = await decrypt(cookie)

  if (!session?.userId) {
    redirect("/signin")
  }

  return (
    <div className="min-h-screen bg-macos-base text-macos-primary p-10 font-sans antialiased">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-macos-separator">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Central</h1>
            <p className="text-sm text-macos-secondary mt-0.5">
              Masuk sebagai: <span className="font-semibold text-macos-primary">{String(session?.username)}</span>
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="px-4 py-2 bg-macos-red text-white text-sm font-medium rounded-md hover:bg-opacity-80 transition cursor-pointer font-medium shadow-md">
            Sign Out
          </button>
        </form>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-macos-primary tracking-tight">Aplikasi & Menu Sistem</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          
          <Link 
            href="/dashboard/datapodo" 
            className="group flex flex-col justify-between p-6 bg-macos-popover border border-macos-separator rounded-2xl shadow-xl hover:shadow-2xl hover:border-macos-blue/50 active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-macos-blue flex items-center justify-center text-white text-lg font-bold shadow-md shadow-macos-blue/20">
                📦
              </div>
              <span className="text-xs font-semibold text-macos-blue bg-macos-blue/10 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                Buka →
              </span>
            </div>
            <div>
              <h4 className="text-md font-bold text-macos-primary tracking-tight">Data PO & DO</h4>
              <p className="text-xs text-macos-secondary mt-1 leading-relaxed">
                Pelacakan pesanan, input nota DO/Invoice, import data dari berkas Excel.
              </p>
            </div>
          </Link>

          <Link 
            href="/dashboard/invoicemaker" 
            className="group flex flex-col justify-between p-6 bg-macos-popover border border-macos-separator rounded-2xl shadow-xl hover:shadow-2xl hover:border-macos-blue/50 active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-macos-blue flex items-center justify-center text-white text-lg font-bold shadow-md shadow-macos-blue/20">
                📃
              </div>
              <span className="text-xs font-semibold text-macos-blue bg-macos-blue/10 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                Buka →
              </span>
            </div>
            <div>
              <h4 className="text-md font-bold text-macos-primary tracking-tight">Invoice Maker</h4>
              <p className="text-xs text-macos-secondary mt-1 leading-relaxed">
                Buat invoice, data langsung tersimpan ke database
              </p>
            </div>
          </Link>
          {/* 🌟 AKTIFKAN KARTU MENU KE-3 MENJADI DATA LIST INVOICE */}
<Link 
  href="/dashboard/invoice" 
  className="group flex flex-col justify-between p-6 bg-macos-popover border border-macos-separator rounded-2xl shadow-xl hover:shadow-2xl hover:border-macos-blue/50 active:scale-[0.98] transition-all duration-200 cursor-pointer"
>
  <div className="flex items-center justify-between mb-4">
    <div className="w-10 h-10 rounded-xl bg-macos-blue flex items-center justify-center text-white text-lg font-bold shadow-md shadow-macos-blue/20">
      📊
    </div>
    <span className="text-xs font-semibold text-macos-blue bg-macos-blue/10 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
      Buka →
    </span>
  </div>
  <div>
    <h4 className="text-md font-bold text-macos-primary tracking-tight">Invoice Records List</h4>
    <p className="text-xs text-macos-secondary mt-1 leading-relaxed">
      Lihat histori seluruh quotation multi-item, cari dokumen berdasarkan nama PT, serta cetak ulang lembar PDF.
    </p>
  </div>
</Link>


          <div className="flex flex-col justify-between p-6 bg-macos-popover/40 border border-macos-separator border-dashed rounded-2xl opacity-60 select-none">
            <div className="w-10 h-10 rounded-xl bg-macos-tertiary border border-macos-separator flex items-center justify-center text-lg">
              👥
            </div>
            <div className="mt-8">
              <h4 className="text-md font-semibold text-macos-secondary tracking-tight">Manajemen User</h4>
              <p className="text-xs text-macos-tertiary mt-1">
                Manajemen akun
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
