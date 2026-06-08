import { logoutAction } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { revalidatePath } from "next/cache";
// 🌟 IMPORT KOMPONEN TOMBOL BARU KITA
import DeleteInvoiceButton from "./DeleteInvoiceButton"; 

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

// SERVER ACTION: Tetap bersih dan aman berjalan di sisi server
async function handleDeleteInvoice(formData: FormData) {
  "use server";
  const noInv = formData.get("noInv") as string;
  if (noInv) {
    try {
      await prisma.invoice.deleteMany({
        where: { noInv: noInv },
      });
      revalidatePath("/dashboard/invoice");
    } catch (error) {
      console.error("Failed to delete invoice:", error);
    }
  }
}

export default async function InvoiceListPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  const session = await decrypt(cookie);

  const query = (await searchParams).search || "";

  // 1. Tarik semua data item dari database
  const rawInvoices = await prisma.invoice.findMany({
    where: query
      ? {
          OR: [
            { customer: { contains: query, mode: "insensitive" } },
            { quotationNumber: { contains: query, mode: "insensitive" } },
            { attn: { contains: query, mode: "insensitive" } },
            { noInv: { contains: query, mode: "insensitive" } },
            { fromUser: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });

  // 2. PROSES GROUPING: Kelompokkan berdasarkan Nomor Invoice (noInv)
  const groupedMap: Record<string, {
    id: string;
    noInv: string;
    quotationNumber: string;
    customer: string;
    attn: string;
    dateDelivery: Date | string;
    remark: string;
    totalQty: number;
    grandTotalIdr: number;
    itemsCount: number;
  }> = {};

  rawInvoices.forEach((item) => {
    const key = item.noInv || "NO-NUMBER";
    const itemSubtotal = (item.amountIdr || 0) * (item.qty || 1);

    if (!groupedMap[key]) {
      groupedMap[key] = {
        id: item.id,
        noInv: item.noInv,
        quotationNumber: item.quotationNumber,
        customer: item.customer,
        attn: item.attn,
        dateDelivery: item.dateDelivery,
        remark: item.remark,
        totalQty: item.qty || 0,
        grandTotalIdr: itemSubtotal,
        itemsCount: 1
      };
    } else {
      groupedMap[key].totalQty += (item.qty || 0);
      groupedMap[key].grandTotalIdr += itemSubtotal;
      groupedMap[key].itemsCount += 1;
    }
  });

  const invoices = Object.values(groupedMap);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-macos-base text-macos-primary p-10 font-sans antialiased">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-macos-separator">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-10 h-10 bg-macos-tertiary border border-macos-separator rounded-xl text-macos-secondary hover:text-macos-blue transition shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Invoice Summary Database
            </h1>
            <p className="text-sm text-macos-secondary mt-0.5">
              Logged in as:{" "}
              <span className="font-semibold text-macos-primary">
                {String(session?.username)}
              </span>
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="px-4 py-2 bg-macos-red text-white text-sm font-medium rounded-md hover:bg-opacity-80 transition cursor-pointer shadow-md"
          >
            Sign Out
          </button>
        </form>
      </div>

      {/* SEARCH CONTROL BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-macos-primary">
          Recorded Invoices ({invoices.length})
        </h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <form method="GET" action="/dashboard/invoice" className="w-full sm:w-80">
            <input
              name="search"
              type="text"
              defaultValue={query}
              placeholder="Search customer, invoice number, etc..."
              className="w-full bg-macos-popover border border-macos-separator text-macos-primary rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition shadow-sm"
            />
          </form>
          {query && (
            <Link
              href="/dashboard/invoice"
              className="text-sm font-medium text-macos-blue hover:text-macos-red transition whitespace-nowrap"
            >
              Clear
            </Link>
          )}
        </div>
      </div>

      {/* DISPLAY TABLE SECTION */}
      <div className="overflow-x-auto rounded-xl border border-macos-separator bg-macos-popover shadow-2xl pb-32">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-macos-tertiary text-macos-secondary border-b border-macos-separator font-medium">
              <th className="p-3.5 w-1/5">Customer / To</th>
              <th className="p-3.5">No. Invoice</th>
              <th className="p-3.5">Quotation No</th>
              <th className="p-3.5">Attn</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5 text-center">Total Items</th>
              <th className="p-3.5 text-center">Total Qty</th>
              <th className="p-3.5 text-right">Grand Total (IDR)</th>
              <th className="p-3.5 pl-6">Remark</th>
              <th className="p-3.5 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-macos-separator/40">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-macos-secondary">
                  No recorded invoices found.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.noInv} className="hover:bg-macos-tertiary/40 transition">
                  <td className="p-3.5 text-macos-primary font-medium">{invoice.customer}</td>
                  <td className="p-3.5 text-macos-primary font-bold font-mono">{invoice.noInv}</td>
                  <td className="p-3.5 text-macos-secondary font-mono text-xs">{invoice.quotationNumber}</td>
                  <td className="p-3.5 text-macos-secondary">{invoice.attn}</td>
                  <td className="p-3.5 text-macos-secondary">
                    {(() => {
                      const nextDay = new Date(invoice.dateDelivery);
                      nextDay.setDate(nextDay.getDate() + 1); // Tambah 1 hari
                      return nextDay.toLocaleDateString("id-ID");
                    })()}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-xs rounded border border-neutral-300 font-medium text-macos-secondary">
                      {invoice.itemsCount} Jenis
                    </span>
                  </td>
                  <td className="p-3.5 text-center font-bold text-macos-primary">{invoice.totalQty} PCS</td>
                  <td className="p-3.5 text-right font-bold text-macos-blue text-md">
                    {formatIDR(invoice.grandTotalIdr)}
                  </td>
                  <td className="p-3.5 pl-6 text-macos-secondary italic max-w-[150px] truncate">
                    {invoice.remark}
                  </td>

                  {/* TRIPLE DOT CONTEXT MENU */}
                  <td className="p-3.5 text-center overflow-visible">
                    <div className="relative inline-block text-left group">
                      <span className="p-2 hover:bg-macos-tertiary rounded-md text-macos-secondary hover:text-macos-primary font-bold transition text-md leading-none select-none cursor-pointer">
                        •••
                      </span>

                      {/* Dropdown Box Menu */}
                      <div className="absolute right-2 top-full mt-1 hidden group-hover:block w-44 bg-macos-popover border border-macos-separator rounded-lg shadow-2xl z-50 py-1 overflow-hidden animate-scale-up text-left">
                        <Link
                          href={`/dashboard/invoice/edit?noInv=${invoice.noInv}`}
                          className="w-full px-4 py-2 text-xs text-macos-primary hover:bg-macos-blue hover:text-white transition flex items-center gap-2 font-medium"
                        >
                          ✏️ Edit Invoice Info
                        </Link>
                        <Link
                          href={`/dashboard/invoicemaker/print?noInv=${invoice.noInv}`}
                          className="w-full px-4 py-2 text-xs text-macos-primary hover:bg-macos-blue hover:text-white transition flex items-center gap-2"
                        >
                          📄 View / Print PDF
                        </Link>

                        <div className="border-t border-macos-separator/50 my-1"></div>

                        {/* 🌟 SEKARANG JADI SUPER BERSIH & AMAN MENGGUNAKAN KOMPONEN BARU KITA */}
                        <DeleteInvoiceButton 
                          noInv={invoice.noInv} 
                          deleteAction={handleDeleteInvoice} 
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}