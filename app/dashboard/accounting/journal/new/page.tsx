'use client'

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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

const journalFormSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  reference: z.string().optional(),
  description: z.string().min(3, "Deskripsi minimal 3 karakter"),
  lines: z.array(journalLineSchema).min(2, "Jurnal minimal harus memiliki 2 baris (Debit & Kredit)"),
});

type JournalFormValues = z.infer<typeof journalFormSchema>;

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<{ id: string; code: string; name: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 1. Ambil data Master COA & Aktifkan status Mounted hanya di Client-Side
  useEffect(() => {
    setIsMounted(true);
    getAccountsForSelect().then(setAccounts);
  }, []);

  // 2. Setup React Hook Form
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<JournalFormValues>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      date: "", // Dikosongkan dulu saat SSR untuk mencegah perbedaan waktu server-client
      reference: '',
      description: '',
      lines: [
        { accountId: '', debit: 0, credit: 0 },
        { accountId: '', debit: 0, credit: 0 },
      ]
    }
  });

  // Set tanggal hari ini khusus setelah berada di client browser (Aman dari Hydration Mismatch)
  useEffect(() => {
    if (isMounted) {
      setValue("date", new Date().toISOString().split('T')[0]);
    }
  }, [isMounted, setValue]);

  // 3. Setup useFieldArray untuk mengontrol baris secara dinamis
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  // Watch nilai debit & credit untuk menghitung Live Total di bawah tabel
  const watchedLines = watch("lines");
  const totalDebit = watchedLines?.reduce((sum, line) => sum + (Number(line.debit) || 0), 0) || 0;
  const totalCredit = watchedLines?.reduce((sum, line) => sum + (Number(line.credit) || 0), 0) || 0;
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  // 4. Handler Submit Form ke Server Action
  const onSubmit = async (data: JournalFormValues) => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      console.log("1. Memulai submit form, data yang dikirim:", data);

      const result = await createJournalEntry({
        ...data,
        date: new Date(data.date),
        lines: data.lines.map(line => ({
          accountId: line.accountId,
          debit: Number(line.debit),
          credit: Number(line.credit)
        }))
      });

      console.log("2. Respon mentah dari Server Action:", result);

      if (result && result.success === false) {
        setErrorMsg(result.error || "Gagal menyimpan data ke database.");
        setIsSubmitting(false);
        return;
      }

      console.log("3. Server Action sukses! Mencoba mengalihkan halaman...");
      
      // Menggunakan router.push + router.refresh untuk perpindahan mulus
      router.push('/dashboard/accounting/journal');
      router.refresh();

    } catch (error) {
      console.error("Maling Error di Client:", error);
      setErrorMsg("Terjadi kesalahan sistem saat memproses form.");
      setIsSubmitting(false);
    }
  };

  // 💡 JALUR AMAN: Kunci rendering di sini. Jika belum mounted di client, jangan render HTML form dulu!
  if (!isMounted) {
    return (
      <div className="p-6 max-w-5xl mx-auto min-h-screen bg-macos-base text-macos-secondary flex items-center justify-center">
        <p className="text-sm italic animate-pulse">Menyiapkan Form Jurnal...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 min-h-screen bg-macos-base text-macos-primary">
      {/* HEADER PAGE */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-macos-primary">Buat Jurnal Umum Baru</h1>
          <p className="text-sm text-macos-secondary mt-1">Pencatatan transaksi double-entry keuangan perusahaan.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-macos-red/10 border border-macos-red/30 text-macos-red rounded-lg text-sm font-medium">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* WRAPPER MAIN FORM - Ditambahkan proteksi anti-autofill ekstensi browser */}
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        autoComplete="off"
        data-lpignore="true"
        className="space-y-6 bg-macos-secondary p-6 rounded-xl border border-macos-separator shadow-xl"
      >
        
        {/* FIELD ATAS: METADATA JURNAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-macos-secondary tracking-wider mb-2">Tanggal</label>
            <input 
              type="date" 
              {...register("date")} 
              className="w-full px-3 py-2 bg-macos-tertiary border border-macos-separator rounded-lg text-sm text-macos-primary focus:outline-none focus:border-macos-blue" 
            />
            {errors.date && <p className="text-xs text-macos-red mt-1">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-macos-secondary tracking-wider mb-2">Referensi / No. Bukti</label>
            <input 
              type="text" 
              {...register("reference")} 
              placeholder="misal: INV-001, JRN-02" 
              className="w-full px-3 py-2 bg-macos-tertiary border border-macos-separator rounded-lg text-sm text-macos-primary placeholder-macos-tertiary focus:outline-none focus:border-macos-blue" 
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold uppercase text-macos-secondary tracking-wider mb-2">Deskripsi Transaksi</label>
            <input 
              type="text" 
              {...register("description")} 
              placeholder="Keterangan singkat mengenai transaksi finansial ini..." 
              className="w-full px-3 py-2 bg-macos-tertiary border border-macos-separator rounded-lg text-sm text-macos-primary placeholder-macos-tertiary focus:outline-none focus:border-macos-blue" 
            />
            {errors.description && <p className="text-xs text-macos-red mt-1">{errors.description.message}</p>}
          </div>
        </div>

        <hr className="border-macos-separator" />

        {/* TABEL DYNAMIC BARIS JURNAL (DEBIT / KREDIT) */}
        <div>
          <h3 className="text-sm font-bold text-macos-primary mb-3">Item Baris Jurnal</h3>
          <div className="overflow-x-auto rounded-lg border border-macos-separator bg-macos-tertiary">
            <table className="w-full table-fixed min-w-[600px]">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-macos-secondary bg-macos-popover border-b border-macos-separator">
                  <th className="py-2.5 px-3 w-1/2">Akun / Rekening</th>
                  <th className="py-2.5 px-3 w-1/4 text-right">Debit (Rp)</th>
                  <th className="py-2.5 px-3 w-1/4 text-right">Kredit (Rp)</th>
                  <th className="py-2.5 px-3 w-12 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-macos-separator">
                {fields.map((field, index) => (
                  <tr key={field.id} className="hover:bg-macos-popover/40 transition">
                    {/* Select Akun */}
                    <td className="py-2 px-2">
                      <select 
                        {...register(`lines.${index}.accountId` as const)}
                        className="w-full px-2 py-1.5 bg-macos-secondary border border-macos-separator rounded-lg text-sm text-macos-primary focus:outline-none focus:border-macos-blue"
                      >
                        <option value="" className="bg-macos-secondary">-- Pilih Akun COA --</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id} className="bg-macos-secondary">[{acc.code}] - {acc.name}</option>
                        ))}
                      </select>
                    </td>
                    {/* Input Debit */}
                    <td className="py-2 px-2">
                      <input 
                        type="number" 
                        step="0.01" 
                        {...register(`lines.${index}.debit` as const)}
                        className="w-full px-2 py-1.5 bg-macos-secondary border border-macos-separator rounded-lg text-sm font-mono text-right text-macos-primary focus:outline-none focus:border-macos-blue"
                      />
                    </td>
                    {/* Input Kredit */}
                    <td className="py-2 px-2">
                      <input 
                        type="number" 
                        step="0.01" 
                        {...register(`lines.${index}.credit` as const)}
                        className="w-full px-2 py-1.5 bg-macos-secondary border border-macos-separator rounded-lg text-sm font-mono text-right text-macos-primary focus:outline-none focus:border-macos-blue"
                      />
                    </td>
                    {/* Tombol Hapus Baris */}
                    <td className="py-2 px-2 text-center">
                      <button 
                        type="button" 
                        onClick={() => remove(index)}
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

          {/* Tombol Tambah Baris */}
          <button
            type="button"
            onClick={() => append({ accountId: "", debit: 0, credit: 0 })}
            className="mt-3 text-sm font-semibold text-macos-blue hover:text-blue-400 transition"
          >
            + Tambah Baris Baru
          </button>
        </div>

        {/* SUMMARY LIVE INDICATOR OVERVIEW */}
        <div className="p-4 bg-macos-tertiary border border-macos-separator rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium">
          <div className="flex gap-6 text-macos-secondary font-mono">
            <div>Total Debit: <span className="font-bold text-macos-primary">Rp {totalDebit.toLocaleString('id-ID')}</span></div>
            <div>Total Kredit: <span className="font-bold text-macos-primary">Rp {totalCredit.toLocaleString('id-ID')}</span></div>
          </div>
          
          {/* Status Balance Akuntansi */}
          <div>
            {isBalanced ? (
              <span className="px-3 py-1 bg-macos-green/10 text-macos-green text-xs font-bold rounded-full border border-macos-green/30">
                ✓ Jurnal Seimbang
              </span>
            ) : (
              <span className="px-3 py-1 bg-macos-orange/10 text-macos-orange text-xs font-bold rounded-full border border-macos-orange/30">
                ⚠️ Unbalanced (Selisih: Rp {Math.abs(totalDebit - totalCredit).toLocaleString('id-ID')})
              </span>
            )}
          </div>
        </div>

        {/* TOMBOL AKSI SUBMIT */}
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