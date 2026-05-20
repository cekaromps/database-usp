import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { updateInvoiceAction } from "@/app/actions/record"

export const dynamic = "force-dynamic"

interface EditPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function EditInvoicePage({ searchParams }: EditPageProps) {
  const cookieStore = await cookies()
  const cookie = cookieStore.get("session")?.value
  const session = await decrypt(cookie)

  if (!session?.userId) redirect("/signin")

  const id = (await searchParams).id || ""

  // Cari data invoice lama berdasarkan parameter ID unik
  const invoice = await prisma.invoice.findUnique({
    where: { id }
  })

  if (!invoice) {
    return (
      <div className="p-10 text-center text-macos-secondary">
        <p>Data Invoice tidak ditemukan atau sudah dihapus.</p>
        <Link href="/dashboard/invoice" className="text-macos-blue underline mt-4 inline-block">Kembali ke List</Link>
      </div>
    )
  }

  // Format tanggal YYYY-MM-DD agar bisa dibaca sempurna oleh tag input type="date"
  const formattedDate = new Date(invoice.dateDelivery).toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-macos-base text-macos-primary p-10 font-sans antialiased">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-macos-separator">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/invoice" className="flex items-center justify-center w-10 h-10 bg-macos-tertiary border border-macos-separator rounded-xl text-macos-secondary hover:text-macos-blue transition shadow-sm">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Record Detail</h1>
            <p className="text-sm text-macos-secondary mt-0.5">Quotation No: <span className="font-mono font-semibold text-macos-primary">{invoice.quotationNumber}</span></p>
          </div>
        </div>
      </div>

      {/* FORM INPUT UPDATE (MACOS PREMIUM DESIGN) */}
      <div className="max-w-3xl mx-auto bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl">
        <form action={updateInvoiceAction} className="space-y-6">
          {/* Kirim ID secara rahasia sebagai penanda identitas baris data */}
          <input type="hidden" name="id" value={invoice.id} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Customer / To *</label>
              <input name="customer" type="text" required defaultValue={invoice.customer} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Attn *</label>
              <input name="attn" type="text" required defaultValue={invoice.attn} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">CC</label>
              <input name="cc" type="text" defaultValue={invoice.cc} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Term *</label>
              <input name="term" type="text" required defaultValue={invoice.term} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Validity *</label>
              <input name="validity" type="text" required defaultValue={invoice.validity} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Lead Time *</label>
              <input name="leadTime" type="text" required defaultValue={invoice.leadTime} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Date *</label>
              <input name="dateDelivery" type="date" required defaultValue={formattedDate} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue scheme-dark" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">No. Invoice *</label>
              <input name="noInv" type="text" required defaultValue={invoice.noInv} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">From *</label>
              <input name="fromUser" type="text" required defaultValue={invoice.fromUser} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Handphone *</label>
              <input name="handphone" type="text" required defaultValue={invoice.handphone} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue" />
            </div>

            {/* SEKSI SPESIFIKASI BARANG DAN HARGA */}
            <div className="md:col-span-2 border-t border-macos-separator/40 pt-4 mt-2">
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Item Description *</label>
              <input name="description" type="text" required defaultValue={invoice.description} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Qty *</label>
              <input name="qty" type="number" min="1" required defaultValue={invoice.qty} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Unit Price (Amount IDR) *</label>
              <input name="amountIdr" type="number" step="any" required defaultValue={invoice.amountIdr} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue font-semibold text-macos-blue" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Remark</label>
              <input name="remark" type="text" defaultValue={invoice.remark} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue italic" />
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end border-t border-macos-separator/40 pt-4">
            <Link href="/dashboard/invoice" className="px-4 py-2 bg-macos-tertiary text-macos-primary rounded-md text-xs font-medium hover:bg-opacity-80 transition">Cancel</Link>
            <button type="submit" className="px-4 py-2 bg-macos-blue text-white rounded-md text-xs font-semibold hover:bg-opacity-90 transition shadow-lg cursor-pointer">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  )
}
