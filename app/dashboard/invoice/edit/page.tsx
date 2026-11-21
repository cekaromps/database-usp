import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateInvoiceAction } from "@/app/actions/record";
import EditableItems from "./EditableItems";

export const dynamic = "force-dynamic";

interface EditPageProps {
    searchParams: Promise<{ noInv?: string }>;
}

export default async function EditInvoicePage({ searchParams }: EditPageProps) {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("session")?.value;
    const session = await decrypt(cookie);

    if (!session?.userId) redirect("/signin");

    const noInv = (await searchParams).noInv || "";

    // ambil semua item dalam invoice yg sama
    const invoices = await prisma.invoice.findMany({
        where: { noInv },
        orderBy: { createdAt: "asc" },
    });

    if (invoices.length === 0) {
        return (
            <div className="p-10 text-center text-macos-secondary">
                <p>Data Invoice tidak ditemukan.</p>
            </div>
        );
    }

    // ambil invoice pertama sebagai header/master data
    const invoice = invoices[0];

    const formattedDate = new Date(invoice.dateDelivery)
        .toISOString()
        .split("T")[0];

    const field =
        "w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue";
    const label = "block text-xs font-medium text-macos-secondary mb-1.5";

    return (
        <div className="min-h-screen bg-macos-base text-macos-primary p-10 font-sans antialiased">
            {/* HEADER SECTION */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-macos-separator">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/invoice"
                        className="flex items-center justify-center w-10 h-10 bg-macos-tertiary border border-macos-separator rounded-xl text-macos-secondary hover:text-macos-blue transition shadow-sm"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Edit Record Detail
                        </h1>
                        <p className="text-sm text-macos-secondary mt-0.5">
                            Quotation No:{" "}
                            <span className="font-mono font-semibold text-macos-primary">
                                {invoice.quotationNumber}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* FORM INPUT UPDATE (MACOS PREMIUM DESIGN) */}
            <div className="max-w-3xl mx-auto bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl">
                <form action={updateInvoiceAction} className="space-y-6">
                    {/* Kirim ID secara rahasia sebagai penanda identitas baris data */}
                    <input type="hidden" name="originalNoInv" value={invoice.noInv} />
                    <input
                        type="hidden"
                        name="originalQuotationNumber"
                        value={invoice.quotationNumber}
                    />
                    <div className="md:col-span-2">
                        <label className={label}>Quotation Number *</label>
                        <input
                            name="quotationNumber"
                            type="text"
                            required
                            defaultValue={invoice.quotationNumber}
                            className={`${field} font-mono font-semibold`}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <label className={label}>Customer / To *</label>
                            <input name="customer" type="text" required defaultValue={invoice.customer} className={field} />
                        </div>
                        <div>
                            <label className={label}>Attn *</label>
                            <input name="attn" type="text" required defaultValue={invoice.attn} className={field} />
                        </div>
                        <div>
                            <label className={label}>CC</label>
                            <input name="cc" type="text" defaultValue={invoice.cc} className={field} />
                        </div>
                        <div>
                            <label className={label}>Term *</label>
                            <input name="term" type="text" required defaultValue={invoice.term} className={field} />
                        </div>
                        <div>
                            <label className={label}>Validity *</label>
                            <input name="validity" type="text" required defaultValue={invoice.validity} className={field} />
                        </div>
                        <div>
                            <label className={label}>Lead Time *</label>
                            <input name="leadTime" type="text" required defaultValue={invoice.leadTime} className={field} />
                        </div>
                        <div>
                            <label className={label}>Date *</label>
                            <input name="dateDelivery" type="date" required defaultValue={formattedDate} className={`${field} scheme-dark`} />
                        </div>
                        <div>
                            <label className={label}>No. Invoice *</label>
                            <input name="noInv" type="text" required defaultValue={invoice.noInv} className={`${field} font-semibold`} />
                        </div>
                        <div>
                            <label className={label}>From *</label>
                            <input name="fromUser" type="text" required defaultValue={invoice.fromUser} className={field} />
                        </div>
                        <div>
                            <label className={label}>Handphone *</label>
                            <input name="handphone" type="text" required defaultValue={invoice.handphone} className={field} />
                        </div>

                        {/* SEKSI SPESIFIKASI BARANG DAN HARGA */}
                        <div className="border-t border-macos-separator/40 pt-4">
                            <h3 className="text-sm font-semibold mb-3 text-macos-primary">
                                Invoice Items
                            </h3>

                            <EditableItems
                                initialItems={invoices.map((it) => ({
                                    id: it.id,
                                    description: it.description,
                                    qty: it.qty,
                                    amountIdr: it.amountIdr,
                                }))}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 justify-end border-t border-macos-separator/40 pt-4">
                        <Link
                            href="/dashboard/invoice"
                            className="px-4 py-2 bg-macos-tertiary text-macos-primary rounded-md text-xs font-medium hover:bg-opacity-80 transition"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-macos-blue text-white rounded-md text-xs font-semibold hover:bg-opacity-90 transition shadow-lg cursor-pointer"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}