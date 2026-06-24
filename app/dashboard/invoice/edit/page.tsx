import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateInvoiceAction } from "@/app/actions/record";

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
                    <input
                        type="hidden"
                        name="originalNoInv"
                        value={invoice.noInv}
                    />
                    <input
                        type="hidden"
                        name="originalQuotationNumber"
                        value={invoice.quotationNumber}
                    />
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                            Quotation Number *
                        </label>
                        <input
                            name="quotationNumber"
                            type="text"
                            required
                            defaultValue={invoice.quotationNumber}
                            className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue font-mono font-semibold"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                                Customer / To *
                            </label>
                            <input
                                name="customer"
                                type="text"
                                required
                                defaultValue={invoice.customer}
                                className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                                Attn *
                            </label>
                            <input
                                name="attn"
                                type="text"
                                required
                                defaultValue={invoice.attn}
                                className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                                CC
                            </label>
                            <input
                                name="cc"
                                type="text"
                                defaultValue={invoice.cc}
                                className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                                Term *
                            </label>
                            <input
                                name="term"
                                type="text"
                                required
                                defaultValue={invoice.term}
                                className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                                Validity *
                            </label>
                            <input
                                name="validity"
                                type="text"
                                required
                                defaultValue={invoice.validity}
                                className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                                Lead Time *
                            </label>
                            <input
                                name="leadTime"
                                type="text"
                                required
                                defaultValue={invoice.leadTime}
                                className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                                Date *
                            </label>
                            <input
                                name="dateDelivery"
                                type="date"
                                required
                                defaultValue={formattedDate}
                                className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue scheme-dark"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                                No. Invoice *
                            </label>
                            <input
                                name="noInv"
                                type="text"
                                required
                                defaultValue={invoice.noInv}
                                className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue font-semibold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                                From *
                            </label>
                            <input
                                name="fromUser"
                                type="text"
                                required
                                defaultValue={invoice.fromUser}
                                className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                                Handphone *
                            </label>
                            <input
                                name="handphone"
                                type="text"
                                required
                                defaultValue={invoice.handphone}
                                className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 focus:outline-none focus:border-macos-blue"
                            />
                        </div>

                        {/* SEKSI SPESIFIKASI BARANG DAN HARGA */}
                        <div className="border-t border-macos-separator/40 pt-4">
                            <h3 className="text-sm font-semibold mb-3 text-macos-primary">
                                Invoice Items
                            </h3>

                            <div className="space-y-4">
                                {invoices.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="border border-macos-separator rounded-xl p-4 bg-macos-tertiary/20"
                                    >
                                        {/* hidden id item */}
                                        <input
                                            type="hidden"
                                            name={`items[${index}].id`}
                                            value={item.id}
                                        />

                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-macos-blue">
                                                ITEM #{index + 1}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs mb-1.5 text-macos-secondary">
                                                    Description
                                                </label>

                                                <textarea
                                                    name={`items[${index}].description`}
                                                    defaultValue={
                                                        item.description
                                                    }
                                                    rows={4}
                                                    suppressHydrationWarning
                                                    className="w-full bg-macos-tertiary border border-macos-separator rounded-md p-2"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs mb-1.5 text-macos-secondary">
                                                    Qty
                                                </label>

                                                <input
                                                    type="number"
                                                    name={`items[${index}].qty`}
                                                    defaultValue={item.qty}
                                                    className="w-full bg-macos-tertiary border border-macos-separator rounded-md p-2"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs mb-1.5 text-macos-secondary">
                                                    Amount IDR
                                                </label>

                                                <input
                                                    type="number"
                                                    step="any"
                                                    name={`items[${index}].amountIdr`}
                                                    defaultValue={
                                                        item.amountIdr
                                                    }
                                                    className="w-full bg-macos-tertiary border border-macos-separator rounded-md p-2"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
