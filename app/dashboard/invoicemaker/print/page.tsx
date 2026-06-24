import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import PrintButton from "./_components/PrintButton";

export const dynamic = "force-dynamic";

interface PrintPageProps {
    searchParams: Promise<{ noInv?: string }>;
}

export default async function PrintInvoicePage({
    searchParams,
}: PrintPageProps) {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("session")?.value;
    const session = await decrypt(cookie);

    if (!session?.userId) redirect("/signin");

    const noInv = (await searchParams).noInv || "";

    // Tarik list item barang berdasarkan nomor invoice internal
    const invoiceItems = await prisma.invoice.findMany({
        where: { noInv },
        orderBy: { id: "asc" },
    });

    // Jika data kosong, beri fallback aman
    if (invoiceItems.length === 0) {
        return (
            <div className="p-10 text-center text-macos-secondary">
                <p>Data Invoice / Quotation tidak ditemukan di sistem.</p>
                <Link
                    href="/dashboard"
                    className="text-macos-blue underline mt-4 inline-block"
                >
                    Kembali ke Dashboard
                </Link>
            </div>
        );
    }

    // Pegang baris pertama untuk mengambil data metadata header
    const mainData = invoiceItems[0];

    // Hitung perkalian matematis Grand Total dari seluruh Qty × Unit Price
    const totalAmount = invoiceItems.reduce(
        (sum, item) => sum + item.amountIdr * item.qty,
        0,
    );

    const discount = mainData.discount ?? 0;
    const discountAmount = totalAmount * (discount / 100);
    const grandTotal = totalAmount - discountAmount;

    const formatIDR = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-neutral-200 py-8 px-4 font-sans antialiased print:bg-white print:p-0 print:min-h-0">
            <style
                dangerouslySetInnerHTML={{
                    __html: `
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
            min-height: 297mm !important;
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
          border-spacing: 12px;
          margin-top: -12px;
          margin-bottom: 6px;
        }
        .meta-box {
          border: 1px solid #000000;
          border-radius: 5px;
          padding: 10px 10px;
          font-size: 10.5px;
          vertical-align: top;
          width: 50%;
          line-height: 1.4;
        }
        .strip-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000000;
          text-align: center;
          font-size: 11px;
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
          font-size: 13.5px;
        }
        .main-goods-table th {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 10px 10px;
        }
        .main-goods-table tbody tr.item-row td {
          padding: 14px 10px !important;
          vertical-align: middle;
        }
      `,
                }}
            />

            {/* ACTION BAR CENTRAL */}
            <div className="print-hidden-action max-w-[210mm] mx-auto mb-6 bg-white p-4 rounded-xl shadow border border-neutral-300 flex items-center justify-between">
                <Link
                    href="/dashboard"
                    className="text-sm font-medium text-neutral-600 hover:text-black flex items-center gap-2"
                >
                    ← Kembali ke Dashboard Central
                </Link>
                <PrintButton />
            </div>

            <div className="a4-container text-black">
                {/* KOP SURAT */}
                <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-3">
                    <div className="flex items-center gap-4">
                        <img
                            src="/ups.png"
                            className="h-14 w-auto object-contain select-none"
                        />
                        <div>
                            <h2 className="text-lg font-bold uppercase tracking-tight text-neutral-900">
                                PT. UTAMA PASOGIT SEJAHTERA
                            </h2>
                            <p className="text-[11px] text-neutral-700 font-semibold mt-0.5">
                                Komplek Mahkota Niaga Block B No. 5, Batam
                                Centre . Batam 29432 Indonesia
                            </p>
                            <p className="text-[9px] text-neutral-500 font-medium mt-0.5">
                                Email : utamapasogitsejahtera@gmail.com
                                &nbsp;|&nbsp; Tel : (0778) 749 5365
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-center mb-4">
                    <h1 className="text-sm font-bold uppercase tracking-wider underline decoration-1">
                        QUOTATION
                    </h1>
                </div>

                {/* METADATA TABLES */}
                <table className="meta-table">
                    <tbody>
                        <tr>
                            {/* KOLOM KIRI: TO & ADDRESS */}
                            <td className="meta-box">
                                <div className="flex gap-2">
                                    <span className="font-bold text-[10px] w-10 shrink-0">
                                        To &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
                                    </span>
                                    <div className="space-y-0.5">
                                        <p className="font-black text-neutral-950 text-[10px]">
                                            {mainData.customer}
                                        </p>
                                        {/* 🌟 MENAMPILKAN ALAMAT AUTO-FILL */}
                                        <p className="text-neutral-500 text-[10px] leading-tight">
                                            {mainData.address || "-"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2 pt-2 border-t border-neutral-200/50">
                                    <span className="font-bold text-[10px] w-10 shrink-0">
                                        Attn &nbsp;&nbsp;&nbsp;:
                                    </span>
                                    <p className="text-neutral-900 text-[10px]">
                                        {mainData.attn}
                                    </p>
                                </div>
                                <div className="flex gap-2 mt-1">
                                    <span className="font-bold text-[10px] w-10 shrink-0">
                                        CC &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
                                    </span>
                                    <p className="text-neutral-900 text-[10px]">
                                        {mainData.cc}
                                    </p>
                                </div>
                            </td>

                            {/* KOLOM KANAN: FROM, TERM, VALIDITY */}
                            <td className="meta-box">
                                <div className="flex justify-between items-start w-full mb-2 pb-2 border-b border-neutral-200/50">
                                    <div className="flex gap-2">
                                        <span className="font-bold text-[10px] w-10 shrink-0">
                                            From &nbsp;&nbsp;:
                                        </span>
                                        <p className="font-bold text-neutral-800 text-[10px]">
                                            {mainData.fromUser}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-neutral-500 text-[9px] leading-none">
                                            Handphone :
                                        </p>
                                        <p className="font-black text-neutral-950 text-[10px] mt-0.5">
                                            {mainData.handphone}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-y-0.5 text-[10px]">
                                    <span className="font-bold text-neutral-600">
                                        Term
                                    </span>
                                    <span className="col-span-2">
                                        : {mainData.term}
                                    </span>
                                    <span className="font-bold text-neutral-600">
                                        Validity
                                    </span>
                                    <span className="col-span-2">
                                        : {mainData.validity}
                                    </span>
                                    <span className="font-bold text-neutral-600">
                                        Lead Time
                                    </span>
                                    <span className="col-span-2">
                                        : {mainData.leadTime}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* STRIP KODE QUOTATION DAN TANGGAL */}
                <table className="strip-table">
                    <tbody>
                        <tr>
                            <td>
                                QUOTATION NO :{" "}
                                <span className="font-mono">
                                    {mainData.quotationNumber}
                                </span>
                            </td>
                            <td>
                                DATE :{" "}
                                {(() => {
                                    const deliveryDate = new Date(
                                        mainData.dateDelivery,
                                    );
                                    deliveryDate.setDate(
                                        deliveryDate.getDate() + 1,
                                    );
                                    return deliveryDate
                                        .toLocaleDateString("id-ID", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "2-digit",
                                        })
                                        .replace(/ /g, "-");
                                })()}
                            </td>
                            <td>PAGE : 1 / 1</td>
                        </tr>
                    </tbody>
                </table>

                <p className="text-[11px] italic text-neutral-800 mb-3">
                    Thank you for your enquiry and we are pleased to quote you
                    our best price as follows :
                </p>

                {/* 🌟 MASTER TABEL DATA BARANG (BESAR DAN TEGAS) */}
                <div className="border border-black overflow-hidden mb-4">
                    <table className="main-goods-table">
                        <thead>
                            <tr className="border-b border-black font-bold text-center bg-neutral-50 text-[11px]">
                                <th className="p-2 border-r border-black w-10">
                                    No
                                </th>
                                <th className="p-2 border-r border-black w-16">
                                    Qty
                                </th>
                                <th className="p-2 border-r border-black text-left">
                                    Description of Goods
                                </th>
                                <th className="p-2 border-r border-black w-16">
                                    Part No
                                </th>
                                <th className="p-3 border-r border-black w-36 text-right">
                                    Unit Price IDR
                                </th>
                                <th className="p-3 text-right w-40">
                                    Total Amount IDR
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-300">
                            {invoiceItems.map((item, index) => (
                                <tr key={item.id} className="item-row">
                                    <td className="border-r border-neutral-300 text-center text-neutral-500 font-medium">
                                        {index + 1}
                                    </td>
                                    <td className="border-r border-neutral-300 text-center font-bold text-neutral-900">
                                        {item.qty}{" "}
                                        {(item.unit ?? "pcs").toUpperCase()}
                                    </td>

                                    <td className="border-r border-neutral-300 text-neutral-900 font-semibold">
                                        <div className="whitespace-pre-wrap text-md break-words">
                                            {item.description}
                                        </div>
                                        {(() => {
                                            const mats =
                                                item.materials &&
                                                item.materials.length > 0
                                                    ? item.materials
                                                    : item.material &&
                                                        item.material !== "-"
                                                      ? [item.material]
                                                      : [];
                                            return mats.length > 0 ? (
                                                <div className="text-[10px] text-neutral-500 font-mono font-medium mt-1 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200 inline-block">
                                                    Material: {mats.join(" | ")}
                                                </div>
                                            ) : null;
                                        })()}
                                        {item.processes &&
                                            item.processes !== "-" && (
                                                <div className="text-[10px] text-neutral-500 font-mono font-medium mt-1 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200 inline-block">
                                                    Process: {item.processes}
                                                </div>
                                            )}
                                    </td>

                                    <td className="border-r border-neutral-300 text-center font-mono text-neutral-400">
                                        -
                                    </td>
                                    <td className="border-r border-neutral-300 text-right font-mono text-neutral-800">
                                        {formatIDR(item.amountIdr)}
                                    </td>
                                    <td className="text-right font-mono font-bold text-neutral-950">
                                        {formatIDR(item.amountIdr * item.qty)}
                                    </td>
                                </tr>
                            ))}

                            {/* SUBTOTAL ROW */}
                            <tr className="border-t border-neutral-300 text-[11px]">
                                <td
                                    colSpan={4}
                                    className="p-2 text-right text-neutral-500 border-r border-black"
                                >
                                    Subtotal :
                                </td>
                                <td
                                    colSpan={2}
                                    className="p-2 text-right font-mono text-neutral-600"
                                >
                                    IDR &nbsp;&nbsp;{formatIDR(totalAmount)}
                                </td>
                            </tr>

                            {/* DISCOUNT ROW — only show if discount > 0 */}
                            {discount > 0 && (
                                <tr className="text-[11px]">
                                    <td
                                        colSpan={4}
                                        className="p-2 text-right text-red-600 border-r border-black"
                                    >
                                        Discount ({discount}%) :
                                    </td>
                                    <td
                                        colSpan={2}
                                        className="p-2 text-right font-mono text-red-600"
                                    >
                                        - IDR &nbsp;&nbsp;
                                        {formatIDR(discountAmount)}
                                    </td>
                                </tr>
                            )}

                            {/* GRAND TOTAL ROW */}
                            <tr className="border-t-2 border-black font-black bg-neutral-50 text-[12px]">
                                <td
                                    colSpan={4}
                                    className="p-3 text-right uppercase tracking-wider border-r border-black"
                                >
                                    Grand Total :
                                </td>
                                <td
                                    colSpan={2}
                                    className="p-3 text-right text-neutral-950 font-mono font-black text-md"
                                >
                                    IDR &nbsp;&nbsp;{formatIDR(grandTotal)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* REMARKS REMARKS */}
                <div className="border border-black p-3 rounded-md text-[11px] font-bold text-neutral-900 mb-5 bg-neutral-50/50">
                    Remarks :{" "}
                    <span className="font-medium italic text-neutral-700">
                        {mainData.remark}
                    </span>
                </div>

                {/* SALUT & SIGNATURE */}
                <div className="footer-section flex justify-between items-end text-[11px] pt-4">
                    <div className="text-neutral-800 space-y-1">
                        <p>Looking forward to your earlier confirmation</p>
                        <p>Best Regards</p>
                        <p className="italic text-neutral-400 text-[10px] pt-4">
                            This Quotation is computer generated and requires no
                            signature
                        </p>

                        <p className="font-bold text-neutral-800 uppercase text-[10px]">
                            PT UTAMA PASOGIT SEJAHTERA
                        </p>
                    </div>
                </div>
            </div>

            {/* AUTO PRINT TRIGGER */}
            <Script id="print-automation-handler" strategy="afterInteractive">
                {`
          // 1. Jalankan fungsi popup cetak otomatis 1 detik setelah halaman termuat sempurna
          setTimeout(() => {
            window.print();
          }, 1000);

          // 2. Ikat fungsi klik manual pada tombol atas agar tetap berfungsi jika popup tidak sengaja tertutup
          const printBtn = document.getElementById('print-document-trigger');
          if (printBtn) {
            printBtn.addEventListener('click', () => {
              window.print();
            });
          }
        `}
            </Script>
        </div>
    );
}
