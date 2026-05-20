import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/session"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

interface PrintPageProps {
  searchParams: Promise<{ noInv?: string }>
}

export default async function PrintInvoicePage({ searchParams }: PrintPageProps) {
  const cookieStore = await cookies()
  const cookie = cookieStore.get("session")?.value
  const session = await decrypt(cookie)

  if (!session?.userId) redirect("/signin")

  const noInv = (await searchParams).noInv || ""
  
  // Tarik list item barang berdasarkan nomor invoice internal
  const invoiceItems = await prisma.invoice.findMany({
    where: { noInv },
    orderBy: { id: "asc" }
  })

  // Jika data kosong, beri fallback aman
  if (invoiceItems.length === 0) {
    return (
      <div className="p-10 text-center text-macos-secondary">
        <p>Data Invoice / Quotation tidak ditemukan di sistem.</p>
        <Link href="/dashboard" className="text-macos-blue underline mt-4 inline-block">Kembali ke Dashboard</Link>
      </div>
    )
  }

  const mainData = invoiceItems[0]

  // Hitung perkalian matematis Grand Total dari seluruh Qty × Unit Price
  const totalAmount = invoiceItems.reduce((sum, item) => sum + (item.amountIdr * item.qty), 0)

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-8 font-sans antialiased print:bg-white print:p-0">
      
      {/* 🌟 ACTION BAR PERBAIKAN: Menggunakan tag <a> href="javascript:window.print()" murni tanpa properti onClick */}
      <div className="max-w-4xl mx-auto mb-6 bg-white p-4 rounded-xl shadow border border-neutral-200 flex items-center justify-between print:hidden">
        <Link href="/dashboard" className="text-sm font-medium text-neutral-600 hover:text-black flex items-center gap-2">
          ← Kembali ke Dashboard Central
        </Link>
        <a 
          href="javascript:window.print()" // 👈 Trik HTML Native untuk memicu cetak tanpa melanggar aturan Server Component
          className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition shadow-md inline-block text-center"
        >
          🖨️ Cetak / Simpan sebagai PDF Resmi
        </a>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-12 border border-neutral-300 shadow-xl print:border-none print:shadow-none print:p-0 text-black">
        
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
          <div className="flex items-center gap-4">
            <img src="/ups.png" className="h-16 w-auto object-contain select-none" />
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-neutral-900">PT. UTAMA PASOGIT SEJAHTERA</h2>
              <p className="text-xs text-neutral-700 font-semibold mt-0.5">Komplek Mahkota Niaga Block B No. 5, Batam Centre . Batam 29432 Indonesia</p>
              <p className="text-[10px] text-neutral-500 font-medium mt-0.5">Email : utamapasogitsejahtera@gmail.com &nbsp;|&nbsp; Tel : (0778) 749 5365</p>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-md font-bold uppercase tracking-wider underline decoration-1">QUOTATION</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs font-medium">
          <div className="border border-black p-3 rounded-md flex gap-2">
            <span className="font-bold w-12 shrink-0">To &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</span>
            <div className="text-neutral-900 space-y-0.5">
              <p className="font-black">{mainData.customer}</p>
              <p className="text-neutral-500 text-[11px] leading-snug">Jalan Rambutan, Batamindo Industrial Park, Muka Kuning, Batam, Indonesia</p>
            </div>
          </div>

          <div className="border border-black p-3 rounded-md flex justify-between">
            <div className="flex gap-2">
              <span className="font-bold w-12 shrink-0">From &nbsp;&nbsp;:</span>
              <p className="font-semibold text-neutral-800">{mainData.fromUser}</p>
            </div>
            <div className="text-right">
              <p className="text-neutral-500 text-[11px]">Handphone :</p>
              <p className="font-bold text-neutral-900">{mainData.handphone}</p>
            </div>
          </div>

          <div className="border border-black p-3 rounded-md grid grid-cols-3 gap-y-1">
            <span className="font-bold">Attn</span><span className="col-span-2">: {mainData.attn}</span>
            <span className="font-bold">CC</span><span className="col-span-2">: {mainData.cc}</span>
          </div>

          <div className="border border-black p-3 rounded-md grid grid-cols-3 gap-y-1">
            <span className="font-bold">Term</span><span className="col-span-2">: {mainData.term}</span>
            <span className="font-bold">Validity</span><span className="col-span-2">: {mainData.validity}</span>
            <span className="font-bold">Lead Time</span><span className="col-span-2">: {mainData.leadTime}</span>
          </div>
        </div>

        {/* STRIP NOMOR KODE QUOTATION DAN TANGGAL */}
        <div className="grid grid-cols-3 border border-black text-center text-xs font-bold uppercase mb-6 divide-x divide-black bg-neutral-50">
          <div className="p-2">Quotation No : <span className="font-mono">{mainData.quotationNumber}</span></div>
          <div className="p-2">Date : {new Date(mainData.dateDelivery).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, "-")}</div>
          <div className="p-2">Page : 1/1</div>
        </div>

        <p className="text-xs italic text-neutral-800 mb-4">
          Thank you for your enquiry and we are pleased to quote you our best price as follows :
        </p>

        {/* TABEL ITEM BARANG BERGARIS UTAMA */}
        <div className="border border-black overflow-hidden mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black font-bold text-center bg-neutral-50">
                <th className="p-2 border-r border-black w-12">No.</th>
                <th className="p-2 border-r border-black w-16">Qty</th>
                <th className="p-2 border-r border-black">Description</th>
                <th className="p-2 border-r border-black w-20">Part No.</th>
                <th className="p-3 border-r border-black w-36 text-right">Unit Price IDR</th>
                <th className="p-3 text-right w-40">Total Amount IDR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {invoiceItems.map((item, index) => (
                <tr key={item.id} className="align-top font-medium">
                  <td className="p-2.5 border-r border-neutral-300 text-center">{index + 1}</td>
                  <td className="p-2.5 border-r border-neutral-300 text-center font-bold">{item.qty} PCS</td>
                  <td className="p-2.5 border-r border-neutral-300 text-neutral-900 font-semibold whitespace-pre-wrap">{item.description}</td>
                  <td className="p-2.5 border-r border-neutral-300 text-center font-mono">-</td>
                  <td className="p-3 border-r border-neutral-300 text-right font-mono text-neutral-800">{formatIDR(item.amountIdr)}</td>
                  <td className="p-3 text-right font-mono font-bold text-neutral-900">{formatIDR(item.amountIdr * item.qty)}</td>
                </tr>
              ))}
              
              <tr className="h-40">
                <td className="border-r border-neutral-300"></td>
                <td className="border-r border-neutral-300"></td>
                <td className="border-r border-neutral-300"></td>
                <td className="border-r border-neutral-300"></td>
                <td className="border-r border-neutral-300"></td>
                <td></td>
              </tr>

              <tr className="border-t border-black font-black bg-neutral-50 text-xs">
                <td colSpan={4} className="p-3 text-right uppercase tracking-wider border-r border-black">Total Amount :</td>
                <td colSpan={2} className="p-3 text-right text-sm text-neutral-950 font-mono font-black">
                  IDR &nbsp;&nbsp;{formatIDR(totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border border-black p-4 rounded-md text-xs font-semibold text-neutral-900 mb-6">
          Remarks : {mainData.remark}
        </div>

        <div className="text-xs text-neutral-800 space-y-1 mb-8">
          <p>Looking forward to your earlier confirmation</p>
          <p>Best Regards</p>
          <p className="italic text-neutral-500 text-[11px] pt-1">This Quotation is computer generated and requires no signature</p>
        </div>

        <p className="text-xs font-black uppercase text-neutral-900 tracking-wide border-t border-neutral-400 w-52 pt-1.5">
          PT. Utama Pasogit Sejahtera
        </p>

      </div>

      {/* TRIGGER CETAK OTOMATIS */}
      <script dangerouslySetInnerHTML={{ __html: `
        setTimeout(() => {
          window.print();
        }, 1000);
      `}} />
    </div>
  )
}
