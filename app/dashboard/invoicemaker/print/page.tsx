import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/session"
import { redirect } from "next/navigation"
import Link from "next/link"
import Script from "next/script"

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
    <div className="min-h-screen bg-neutral-200 py-8 px-4 font-sans antialiased print:bg-white print:p-0 print:min-h-0">
      
      {/* 🚀 CSS SAKTI: FONT METADATA KECIL & TABEL AGRESIF BESAR */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* --- STYLING DI LAYAR MONITOR (PREVIEW MODE) --- */
        @media screen {
          .a4-container {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            padding: 20mm 15mm !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            border: 1px solid #d4d4d4;
            box-sizing: border-box;
          }
        }

        /* --- STYLING PAS DI-PRINT / SAVE PDF --- */
        @media print {
          @page {
            size: A4;
            margin: 0; 
          }
          
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print-hidden-action {
            display: none !important;
          }

          .a4-container {
            width: 210mm !important;
            height: 297mm !important;
            padding: 20mm 15mm !important; 
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            box-sizing: border-box;
            display: block !important;
          }

          thead {
            display: table-header-group !important;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .footer-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }

        /* 🎯 KONTROL UKURAN STRUKTUR METADATA (DIKECILKAN SEPERTI PERINTAH) */
        .meta-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 12px; /* Diperketat jarak antarkotak */
          margin-top: -12px;
          margin-bottom: 6px;
        }
        .meta-box {
          border: 1px solid #000000;
          border-radius: 5px;
          padding: 8px 10px;
          font-size: 10.5px; /* Font diperkecil dari 12px agar tidak dominan */
          vertical-align: top;
          width: 50%;
          line-height: 1.4;
        }
        .strip-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000000;
          text-align: center;
          font-size: 11px; /* Diperkecil tipis */
          font-weight: bold;
          margin-bottom: 16px;
          background-color: #f9f9f9;
        }
        .strip-table td {
          padding: 6px;
          border: 1px solid #000000;
          width: 33.33%;
        }

        /* 🌟 MASTER TABEL BARANG (DIBUAT BESAR & JELAS) */
        .main-goods-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px; /* Font dinaikkan agar tulisan item barang terlihat besar dan kontras */
        }
        .main-goods-table th {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 10px 8px;
        }
        /* Memberikan tinggi minimal & padding ekstra pada baris item agar tabel terlihat kokoh & besar */
        .main-goods-table tbody tr.item-row td {
          padding: 14px 10px !important; 
          vertical-align: middle;
        }
      `}} />
      
      {/* ACTION BAR CENTRAL */}
      <div className="print-hidden-action max-w-[210mm] mx-auto mb-6 bg-white p-4 rounded-xl shadow border border-neutral-300 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm font-medium text-neutral-600 hover:text-black flex items-center gap-2">
          ← Kembali ke Dashboard Central
        </Link>
        <a 
          id="manual-print-btn"
          href="#print" 
          className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition shadow-md inline-block text-center cursor-pointer select-none"
        >
          🖨️ Cetak / Simpan sebagai PDF Resmi
        </a>
      </div>

      {/* 📄 CONTAINER KERTAS UTAMA */}
      <div className="a4-container text-black">
        
        {/* KOP SURAT */}
        <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-3">
          <div className="flex items-center gap-4">
            <img src="/ups.png" className="h-14 w-auto object-contain select-none" />
            <div>
              <h2 className="text-lg font-bold uppercase tracking-tight text-neutral-900">PT. UTAMA PASOGIT SEJAHTERA</h2>
              <p className="text-[11px] text-neutral-700 font-semibold mt-0.5">Komplek Mahkota Niaga Block B No. 5, Batam Centre . Batam 29432 Indonesia</p>
              <p className="text-[9px] text-neutral-500 font-medium mt-0.5">Email : utamapasogitsejahtera@gmail.com &nbsp;|&nbsp; Tel : (0778) 749 5365</p>
            </div>
          </div>
        </div>

        <div className="text-center mb-4">
          <h1 className="text-sm font-bold uppercase tracking-wider underline decoration-1">QUOTATION</h1>
        </div>

        <table className="meta-table">
          <tbody>
            <tr>
              <td className="meta-box">
                <div className="flex gap-2">
                  <span className="font-bold text-[8px] w-10 shrink-0">To &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</span>
                  <div className="space-y-0.5">
                    <p className="font-black text-neutral-950 text-[8px]">{mainData.customer}</p>
                    <p className="text-neutral-500 text-[8px] leading-tight">Jalan Rambutan, Batamindo Industrial Park, Muka Kuning, Batam, Indonesia</p>
                  </div>
                </div>
              </td>
              <td className="meta-box">
                <div className="flex justify-between items-start w-full">
                  <div className="flex gap-2">
                    <span className="font-bold text-[8px] w-10 shrink-0">From &nbsp;&nbsp;:</span>
                    <p className="font-bold text-neutral-800 text-[8px]">{mainData.fromUser}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-neutral-500 text-[9.5px]">Handphone :</p>
                    <p className="font-black text-neutral-950">{mainData.handphone}</p>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="meta-box">
                <table className="w-full text-[10.5px]">
                  <tbody>
                    <tr>
                      <td className="font-bold text-[8px] w-10 pb-0.5">Attn</td>
                      <td className="text-neutral-900 text-[8px] pb-0.5">: {mainData.attn}</td>
                    </tr>
                    <tr>
                      <td className="font-bold w-10 text-[8px]">CC</td>
                      <td className="text-neutral-900 text-[8px]">: {mainData.cc || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td className="meta-box">
                <table className="w-full text-[10.5px]">
                  <tbody>
                    <tr>
                      <td className="font-bold w-16 text-[8px] pb-0.5">Term</td>
                      <td className="text-neutral-900 text-[8px] pb-0.5">: {mainData.term}</td>
                    </tr>
                    <tr>
                      <td className="font-bold w-16 text-[8px] pb-0.5">Validity</td>
                      <td className="text-neutral-900 text-[8px] pb-0.5">: {mainData.validity}</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-[8px] w-16">Lead Time</td>
                      <td className="text-neutral-900 text-[8px]">: {mainData.leadTime}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* STRIP NOMOR KODE QUOTATION DAN TANGGAL */}
        <table className="strip-table">
          <tbody>
            <tr>
              <td>QUOTATION NO : <span className="font-mono">{mainData.quotationNumber}</span></td>
              <td>DATE : {new Date(mainData.dateDelivery).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, "-").toUpperCase()}</td>
              <td>PAGE : 1/1</td>
            </tr>
          </tbody>
        </table>

        <p className="text-[11px] italic text-neutral-800 mb-3">
          Thank you for your enquiry and we are pleased to quote you our best price as follows :
        </p>

        {/* 🌟 TABEL UTAMA YANG DIPERBESAR (font-size 13.5px & padding longgar) */}
        <div className="border border-black mb-5">
          <table className="main-goods-table">
            <thead>
              <tr className="border-b border-black font-bold text-center bg-neutral-50 text-[11px]">
                <th className="p-2 border-r border-black w-12 text-center">No.</th>
                <th className="p-2 border-r border-black w-16 text-center">Qty</th>
                <th className="p-2 border-r border-black">Description</th>
                <th className="p-2 border-r border-black w-20 text-center">Part No.</th>
                <th className="p-3 border-r border-black w-36 text-right">Unit Price IDR</th>
                <th className="p-3 text-right w-40">Total Amount IDR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {invoiceItems.map((item, index) => (
                <tr key={item.id} className="item-row align-top font-medium">
                  <td className="border-r border-neutral-300 text-center">{index + 1}</td>
                  <td className="border-r border-neutral-300 text-center font-bold text-neutral-950">{item.qty} PCS</td>
                  <td className="border-r border-neutral-300 text-neutral-950 font-bold whitespace-pre-wrap leading-normal">{item.description}</td>
                  <td className="border-r border-neutral-300 text-center font-mono text-neutral-400">-</td>
                  <td className="border-r border-neutral-300 text-right font-mono text-neutral-800 font-semibold">{formatIDR(item.amountIdr)}</td>
                  <td className="text-right font-mono font-black text-neutral-950">{formatIDR(item.amountIdr * item.qty)}</td>
                </tr>
              ))}
              
              {/* Spacer Dinamis Menengah */}
              <tr className="h-10">
                <td className="border-r border-neutral-300"></td>
                <td className="border-r border-neutral-300"></td>
                <td className="border-r border-neutral-300"></td>
                <td className="border-r border-neutral-300"></td>
                <td className="border-r border-neutral-300"></td>
                <td></td>
              </tr>

              <tr className="border-t border-black font-black bg-neutral-50 text-xs">
                <td colSpan={4} className="p-3 text-right uppercase tracking-wider border-r border-black">Total Amount :</td>
                <td colSpan={2} className="p-3 text-right text-base text-neutral-950 font-mono font-black">
                  IDR &nbsp;&nbsp;{formatIDR(totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CONTAINER PENUTUP */}
        <div className="footer-section">
          {/* REMARKS */}
          <div className="border border-black p-3.5 rounded-md text-[11px] font-semibold text-neutral-900 mb-4">
            Remarks : {mainData.remark}
          </div>

          {/* PENUTUP SURAT */}
          <div className="text-[11px] text-neutral-800 space-y-0.5 mb-5">
            <p>Looking forward to your earlier confirmation</p>
            <p>Best Regards</p>
            <p className="italic text-neutral-400 text-[10px] pt-0.5">This Quotation is computer generated and requires no signature</p>
          </div>

          {/* FOOTER NAMA PERUSAHAAN BAWAH */}
          <p className="text-[11px] font-black uppercase text-neutral-900 tracking-wide border-t border-neutral-400 w-52 pt-1.5">
            PT. Utama Pasogit Sejahtera
          </p>
        </div>

      </div>

      {/* RUNTIME CLIENT SCRIPT AUTOMATION */}
      <Script id="print-automation-script" strategy="afterInteractive">
        {`
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.print();
            }
          }, 1000);

          const printBtn = document.getElementById('manual-print-btn');
          if (printBtn) {
            printBtn.addEventListener('click', (e) => {
              e.preventDefault();
              if (typeof window !== 'undefined') {
                window.print();
              }
            });
          }
        `}
      </Script>
    </div>
  )
}