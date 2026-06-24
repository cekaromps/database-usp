"use client";

import { useState, useEffect } from "react";
import {
    useForm,
    useFieldArray,
    Control,
    UseFormRegister,
    FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createJournalEntry } from "../../_actions/journal";
import { getAccountsForSelect } from "../../_actions/coa";
import { useRouter } from "next/navigation";

const journalLineSchema = z.object({
    accountId: z.string().min(1, "Akun wajib dipilih"),
    debit: z.preprocess((val) => Number(val) || 0, z.number().min(0)),
    credit: z.preprocess((val) => Number(val) || 0, z.number().min(0)),
});

const journalInvoiceSchema = z.object({
    invoiceNo: z.string().min(1, "No. Invoice wajib diisi"),
    lines: z
        .array(journalLineSchema)
        .min(
            2,
            "Setiap invoice minimal harus memiliki 2 baris (Debit & Kredit)",
        ),
});

const journalFormSchema = z.object({
    date: z.string().min(1, "Tanggal wajib diisi"),
    reference: z.string().optional(),
    description: z.string().min(3, "Deskripsi minimal 3 karakter"),
    job: z.string().optional(),
    invoices: z
        .array(journalInvoiceSchema)
        .min(1, "Minimal harus ada 1 invoice di dalam jurnal ini"),
});

type JournalFormValues = z.infer<typeof journalFormSchema>;
type Account = { id: string; code: string; name: string };

// =========================================================
// SUB-KOMPONEN: satu blok Invoice + baris Debit/Kredit miliknya.
// Dipisah jadi komponen sendiri karena useFieldArray TIDAK BOLEH
// dipanggil di dalam .map() pada komponen utama.
// =========================================================
function InvoiceLinesBlock({
    invoiceIndex,
    control,
    register,
    errors,
    accounts,
    onRemoveInvoice,
    canRemoveInvoice,
}: {
    invoiceIndex: number;
    control: Control<JournalFormValues>;
    register: UseFormRegister<JournalFormValues>;
    errors: FieldErrors<JournalFormValues>;
    accounts: Account[];
    onRemoveInvoice: () => void;
    canRemoveInvoice: boolean;
}) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `invoices.${invoiceIndex}.lines` as const,
    });

    const invoiceErrors = errors.invoices?.[invoiceIndex];

    return (
        <div className="border border-macos-separator rounded-xl p-4 bg-macos-tertiary/40 space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                    <label className="block text-xs font-semibold uppercase text-macos-secondary tracking-wider mb-2">
                        No. Invoice
                    </label>
                    <input
                        type="text"
                        {...register(
                            `invoices.${invoiceIndex}.invoiceNo` as const,
                        )}
                        placeholder="misal: INV-2026-001"
                        className="w-full px-3 py-2 bg-macos-secondary border border-macos-separator rounded-lg text-sm text-macos-primary placeholder-macos-tertiary focus:outline-none focus:border-macos-blue"
                    />
                    {invoiceErrors?.invoiceNo && (
                        <p className="text-xs text-macos-red mt-1">
                            {invoiceErrors.invoiceNo.message as string}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onRemoveInvoice}
                    disabled={!canRemoveInvoice}
                    className="mt-6 text-xs font-semibold text-macos-red hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed transition"
                >
                    Hapus Invoice
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-macos-separator bg-macos-tertiary">
                <table className="w-full table-fixed min-w-[700px]">
                    <thead>
                        <tr className="text-left text-xs font-semibold uppercase tracking-wider text-macos-secondary bg-macos-popover border-b border-macos-separator">
                            <th className="py-2.5 px-3 w-1/2">
                                Akun / Rekening
                            </th>
                            <th className="py-2.5 px-3 w-1/4 text-right">
                                Debit (Rp)
                            </th>
                            <th className="py-2.5 px-3 w-1/4 text-right">
                                Kredit (Rp)
                            </th>
                            <th className="py-2.5 px-3 w-12 text-center">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-macos-separator">
                        {fields.map((field, lineIndex) => (
                            <tr
                                key={field.id}
                                className="hover:bg-macos-popover/40 transition"
                            >
                                <td className="py-2 px-2">
                                    <select
                                        {...register(
                                            `invoices.${invoiceIndex}.lines.${lineIndex}.accountId` as const,
                                        )}
                                        className="w-full px-2 py-1.5 bg-macos-secondary border border-macos-separator rounded-lg text-sm text-macos-primary focus:outline-none focus:border-macos-blue"
                                    >
                                        <option
                                            value=""
                                            className="bg-macos-secondary"
                                        >
                                            -- Pilih Akun COA --
                                        </option>
                                        {accounts.map((acc) => (
                                            <option
                                                key={acc.id}
                                                value={acc.id}
                                                className="bg-macos-secondary"
                                            >
                                                [{acc.code}] - {acc.name}
                                            </option>
                                        ))}
                                    </select>
                                    {invoiceErrors?.lines?.[lineIndex]
                                        ?.accountId && (
                                        <p className="text-xs text-macos-red mt-1 pl-1">
                                            {
                                                invoiceErrors.lines[lineIndex]
                                                    ?.accountId
                                                    ?.message as string
                                            }
                                        </p>
                                    )}
                                </td>
                                <td className="py-2 px-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0"
                                        {...register(
                                            `invoices.${invoiceIndex}.lines.${lineIndex}.debit` as const,
                                        )}
                                        className="w-full px-2 py-1.5 bg-macos-secondary border border-macos-separator rounded-lg text-sm font-mono text-right text-macos-primary focus:outline-none focus:border-macos-blue"
                                    />
                                </td>
                                <td className="py-2 px-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0"
                                        {...register(
                                            `invoices.${invoiceIndex}.lines.${lineIndex}.credit` as const,
                                        )}
                                        className="w-full px-2 py-1.5 bg-macos-secondary border border-macos-separator rounded-lg text-sm font-mono text-right text-macos-primary focus:outline-none focus:border-macos-blue"
                                    />
                                </td>
                                <td className="py-2 px-2 text-center">
                                    <button
                                        type="button"
                                        onClick={() => remove(lineIndex)}
                                        disabled={fields.length <= 2}
                                        className="text-macos-red hover:text-red-400 text-sm disabled:opacity-20 disabled:cursor-not-allowed transition"
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <button
                type="button"
                onClick={() => append({ accountId: "", debit: 0, credit: 0 })}
                className="text-xs font-semibold text-macos-blue hover:text-blue-400 transition"
            >
                + Tambah Baris
            </button>
        </div>
    );
}

// =========================================================
// KOMPONEN UTAMA
// =========================================================
export default function NewJournalEntryPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const getLocalTodayString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        setIsMounted(true);
        getAccountsForSelect().then(setAccounts);
    }, []);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<JournalFormValues>({
        resolver: zodResolver(journalFormSchema),
        defaultValues: {
            date: getLocalTodayString(),
            reference: "",
            description: "",
            job: "",
            invoices: [
                {
                    invoiceNo: "",
                    lines: [
                        { accountId: "", debit: 0, credit: 0 },
                        { accountId: "", debit: 0, credit: 0 },
                    ],
                },
            ],
        },
    });

    useEffect(() => {
        if (isMounted) {
            setValue("date", new Date().toISOString().split("T")[0]);
        }
    }, [isMounted, setValue]);

    const {
        fields: invoiceFields,
        append: appendInvoice,
        remove: removeInvoice,
    } = useFieldArray({
        control,
        name: "invoices",
    });

    // Live total dihitung dari SELURUH invoice & baris di dalamnya
    const watchedInvoices = watch("invoices");
    const totalDebit =
        watchedInvoices?.reduce(
            (sum, inv) =>
                sum +
                (inv.lines?.reduce(
                    (lineSum, line) => lineSum + (Number(line.debit) || 0),
                    0,
                ) || 0),
            0,
        ) || 0;
    const totalCredit =
        watchedInvoices?.reduce(
            (sum, inv) =>
                sum +
                (inv.lines?.reduce(
                    (lineSum, line) => lineSum + (Number(line.credit) || 0),
                    0,
                ) || 0),
            0,
        ) || 0;
    const isBalanced = totalDebit === totalCredit && totalDebit > 0;

    const onSubmit = async (data: JournalFormValues) => {
        setErrorMsg(null);
        setIsSubmitting(true);

        try {
            const result = await createJournalEntry({
                date: new Date(data.date),
                reference: data.reference || "",
                description: data.description,
                job: data.job || "",
                invoices: data.invoices.map((inv) => ({
                    invoiceNo: inv.invoiceNo,
                    lines: inv.lines.map((line) => ({
                        accountId: line.accountId,
                        debit: Number(line.debit),
                        credit: Number(line.credit),
                    })),
                })),
            });

            if (result && result.success === false) {
                setErrorMsg(
                    result.error || "Gagal menyimpan data ke database.",
                );
                setIsSubmitting(false);
                return;
            }

            router.push("/dashboard/accounting/journal");
            router.refresh();
        } catch (error) {
            console.error("Error saat submit jurnal:", error);
            setErrorMsg("Terjadi kesalahan sistem saat memproses form.");
            setIsSubmitting(false);
        }
    };

    if (!isMounted) {
        return (
            <div className="p-6 max-w-5xl mx-auto min-h-screen bg-macos-base text-macos-secondary flex items-center justify-center">
                <p className="text-sm italic animate-pulse">
                    Menyiapkan Form Jurnal...
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 min-h-screen bg-macos-base text-macos-primary">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-macos-primary">
                        Buat Jurnal Umum Baru
                    </h1>
                    <p className="text-sm text-macos-secondary mt-1">
                        Satu referensi jurnal dapat mencakup beberapa invoice
                        sekaligus.
                    </p>
                </div>
            </div>

            {errorMsg && (
                <div className="p-4 bg-macos-red/10 border border-macos-red/30 text-macos-red rounded-lg text-sm font-medium">
                    ⚠️ {errorMsg}
                </div>
            )}

            <form
                onSubmit={handleSubmit(onSubmit)}
                autoComplete="off"
                data-lpignore="true"
                className="space-y-6 bg-macos-secondary p-6 rounded-xl border border-macos-separator shadow-xl"
            >
                {/* METADATA JURNAL (qty & uom dihapus) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-macos-secondary tracking-wider mb-2">
                            Tanggal
                        </label>
                        <input
                            type="date"
                            {...register("date")}
                            className="w-full px-3 py-2 bg-macos-tertiary border border-macos-separator rounded-lg text-sm text-macos-primary focus:outline-none focus:border-macos-blue"
                        />
                        {errors.date && (
                            <p className="text-xs text-macos-red mt-1">
                                {errors.date.message}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase text-macos-secondary tracking-wider mb-2">
                            Referensi / No. Bukti
                        </label>
                        <input
                            type="text"
                            {...register("reference")}
                            placeholder="misal: INV-001, JRN-02"
                            className="w-full px-3 py-2 bg-macos-tertiary border border-macos-separator rounded-lg text-sm text-macos-primary placeholder-macos-tertiary focus:outline-none focus:border-macos-blue"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase text-macos-secondary tracking-wider mb-2">
                            JOB / PROYEK
                        </label>
                        <input
                            type="text"
                            {...register("job")}
                            placeholder="Kode Proyek (e.g. PRJ-01)"
                            className="w-full px-3 py-2 bg-macos-tertiary border border-macos-separator rounded-lg text-sm text-macos-primary placeholder-macos-tertiary focus:outline-none focus:border-macos-blue"
                        />
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-xs font-semibold uppercase text-macos-secondary tracking-wider mb-2">
                            Deskripsi Transaksi
                        </label>
                        <input
                            type="text"
                            {...register("description")}
                            placeholder="Keterangan singkat mengenai transaksi finansial ini..."
                            className="w-full px-3 py-2 bg-macos-tertiary border border-macos-separator rounded-lg text-sm text-macos-primary placeholder-macos-tertiary focus:outline-none focus:border-macos-blue"
                        />
                        {errors.description && (
                            <p className="text-xs text-macos-red mt-1">
                                {errors.description.message}
                            </p>
                        )}
                    </div>
                </div>

                <hr className="border-macos-separator" />

                {/* DAFTAR INVOICE, MASING-MASING DENGAN BARIS DEBIT/KREDIT SENDIRI */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-macos-primary">
                        Invoice Dalam Jurnal Ini
                    </h3>

                    {invoiceFields.map((field, invoiceIndex) => (
                        <InvoiceLinesBlock
                            key={field.id}
                            invoiceIndex={invoiceIndex}
                            control={control}
                            register={register}
                            errors={errors}
                            accounts={accounts}
                            onRemoveInvoice={() => removeInvoice(invoiceIndex)}
                            canRemoveInvoice={invoiceFields.length > 1}
                        />
                    ))}

                    <button
                        type="button"
                        onClick={() =>
                            appendInvoice({
                                invoiceNo: "",
                                lines: [
                                    { accountId: "", debit: 0, credit: 0 },
                                    { accountId: "", debit: 0, credit: 0 },
                                ],
                            })
                        }
                        className="text-sm font-semibold text-macos-blue hover:text-blue-400 transition"
                    >
                        + Tambah Invoice
                    </button>
                </div>

                {/* SUMMARY LIVE INDICATOR OVERVIEW */}
                <div className="p-4 bg-macos-tertiary border border-macos-separator rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium">
                    <div className="flex gap-6 text-macos-secondary font-mono">
                        <div>
                            Total Debit:{" "}
                            <span className="font-bold text-macos-primary">
                                Rp {totalDebit.toLocaleString("id-ID")}
                            </span>
                        </div>
                        <div>
                            Total Kredit:{" "}
                            <span className="font-bold text-macos-primary">
                                Rp {totalCredit.toLocaleString("id-ID")}
                            </span>
                        </div>
                    </div>
                    <div>
                        {isBalanced ? (
                            <span className="px-3 py-1 bg-macos-green/10 text-macos-green text-xs font-bold rounded-full border border-macos-green/30">
                                ✓ Jurnal Seimbang
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-macos-orange/10 text-macos-orange text-xs font-bold rounded-full border border-macos-orange/30">
                                ⚠️ Unbalanced (Selisih: Rp{" "}
                                {Math.abs(
                                    totalDebit - totalCredit,
                                ).toLocaleString("id-ID")}
                                )
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border border-macos-separator rounded-lg text-sm font-medium hover:bg-macos-tertiary text-macos-secondary transition"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={!isBalanced || isSubmitting}
                        className="px-5 py-2 bg-macos-blue text-white font-semibold rounded-lg text-sm shadow hover:bg-blue-500 disabled:opacity-20 disabled:cursor-not-allowed transition"
                    >
                        {isSubmitting ? "Menyimpan..." : "Posting Jurnal"}
                    </button>
                </div>
            </form>
        </div>
    );
}
