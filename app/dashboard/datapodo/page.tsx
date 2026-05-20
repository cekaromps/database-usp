import { logoutAction } from "@/app/actions/auth"
import { createRecordAction, deleteRecordAction } from "@/app/actions/record"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/session"
import Link from "next/link"
import ExcelUploadForm from "./ExcelUploadForm"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ search?: string }>
}

export default async function DataPoDoPage({ searchParams }: PageProps) {
  const cookieStore = await cookies()
  const cookie = cookieStore.get("session")?.value
  const session = await decrypt(cookie)

  const query = (await searchParams).search || ""

  // Ambil data dengan filter pencarian jika query tersedia
  const records = await prisma.invoiceRecord.findMany({
    where: query
      ? {
          OR: [
            { customer: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { quotationNumber: { contains: query, mode: "insensitive" } },
            { noPo: { contains: query, mode: "insensitive" } },
            { noDo: { contains: query, mode: "insensitive" } },
            { noInv: { contains: query, mode: "insensitive" } },
            { remark: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  })

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Server Action Bridge untuk menangkap parameter hapus secara murni di server side
  async function handleDelete(formData: FormData) {
    "use server"
    const id = formData.get("id") as string
    if (id) {
      await deleteRecordAction(id)
    }
  }

  return (
    <div className="min-h-screen bg-macos-base text-macos-primary p-10 font-sans antialiased">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-macos-separator">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Data PO & DO Tracking</h1>
            <p className="text-sm text-macos-secondary mt-0.5">
              Logged in as: <span className="font-semibold text-macos-primary">{String(session?.username)}</span>
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="px-4 py-2 bg-macos-red text-white text-sm font-medium rounded-md hover:bg-opacity-80 transition cursor-pointer">
            Sign Out
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* MANUAL INPUT FORM SECTION */}
        <div className="lg:col-span-2 bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl">
          <h3 className="text-lg font-semibold mb-4 text-macos-primary">Input New Record</h3>
          <form action={createRecordAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Customer Name *</label>
              <input name="customer" type="text" required className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Description</label>
              <input name="description" type="text" className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Quotation Number *</label>
              <input name="quotationNumber" type="text" required className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">No. PO *</label>
              <input name="noPo" type="text" required className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Delivery Date *</label>
              <input name="dateDelivery" type="date" required className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition scheme-dark" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">No. DO</label>
              <input name="noDo" type="text" className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">No. Invoice *</label>
              <input name="noInv" type="text" required className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Amount (IDR) *</label>
              <input name="amountIdr" type="number" step="any" required className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Remark</label>
              <input name="remark" type="text" placeholder="Catatan tambahan..." className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition" />
            </div>
            <div className="md:col-span-2 mt-2">
              <button type="submit" className="w-full py-2.5 bg-macos-blue text-white rounded-md font-semibold text-sm hover:bg-opacity-90 active:scale-[0.99] transition cursor-pointer shadow-lg">
                Save Record
              </button>
            </div>
          </form>
        </div>

        {/* BULK UPLOAD EXCEL SECTION */}
        <ExcelUploadForm />
      </div>

      {/* SEARCH CONTROL BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-macos-primary">Data List</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <form method="GET" action="/dashboard/datapodo" className="w-full sm:w-80">
            <input
              name="search"
              type="text"
              defaultValue={query}
              placeholder="Search customer, PO, invoice, remark..."
              className="w-full bg-macos-popover border border-macos-separator text-macos-primary rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition shadow-sm"
            />
          </form>
          
          {query ? (
            <Link 
              href="/dashboard/datapodo"
              className="text-sm font-medium text-macos-blue hover:text-macos-red transition cursor-pointer whitespace-nowrap"
            >
              Clear
            </Link>
          ) : (
            <span 
              className="text-sm font-medium text-macos-secondary opacity-40 cursor-not-allowed select-none whitespace-nowrap"
            >
              Clear
            </span>
          )}
        </div>
      </div>

      {/* DISPLAY TABLE SECTION */}
      <div className="overflow-x-auto rounded-xl border border-macos-separator bg-macos-popover shadow-2xl">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-macos-tertiary text-macos-secondary border-b border-macos-separator font-medium">
              <th className="p-3.5">Customer</th>
              <th className="p-3.5">Description</th>
              <th className="p-3.5">Quotation No</th>
              <th className="p-3.5">No. PO</th>
              <th className="p-3.5">Delivery Date</th>
              <th className="p-3.5">No. DO</th>
              <th className="p-3.5">No. Invoice</th>
              <th className="p-3.5 text-right">Amount (IDR)</th>
              <th className="p-3.5 pl-6">Remark</th>
              <th className="p-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-macos-separator/40">
            {records.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-macos-secondary">No records found.</td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="hover:bg-macos-tertiary/40 transition">
                  <td className="p-3.5 text-macos-primary font-medium">{record.customer}</td>
                  <td className="p-3.5 text-macos-secondary">{record.description || "-"}</td>
                  <td className="p-3.5 text-macos-secondary font-mono">{record.quotationNumber}</td>
                  <td className="p-3.5 text-macos-secondary font-mono">{record.noPo}</td>
                  <td className="p-3.5 text-macos-secondary">{new Date(record.dateDelivery).toLocaleDateString("id-ID")}</td>
                  <td className="p-3.5 text-macos-secondary font-mono">{record.noDo || "-"}</td>
                  <td className="p-3.5 text-macos-secondary font-mono">{record.noInv}</td>
                  <td className="p-3.5 text-right font-semibold text-macos-blue">{formatIDR(record.amountIdr)}</td>
                  <td className="p-3.5 pl-6 text-macos-secondary italic">{record.remark || "-"}</td>
                  {/* 🌟 FORM HAPUS BARU: Menggunakan input hidden bawaan HTML biasa tanpa event listener klien */}
                  <td className="p-3.5 text-center">
                    <form action={handleDelete}>
                      <input type="hidden" name="id" value={record.id} />
                      <button type="submit" className="px-2.5 py-1 text-xs font-medium text-macos-red bg-macos-red/10 border border-macos-red/20 rounded hover:bg-macos-red hover:text-white transition cursor-pointer">Delete</button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
