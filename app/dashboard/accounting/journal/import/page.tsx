"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { importPettyCashExcel } from "../../_actions/journal"; // Server action [109] yang kita buat tadi
import { useRouter } from "next/navigation";
import { getAccountsForSelect } from "@/app/dashboard/accounting/_actions/coa"; // Sesuaikan action-mu
// Tipe data untuk baris tabel preview sebelum di-commit ke DB
type PreviewRow = {
    id: string;
    tanggal: string;
    no_dokumen: string;
    keterangan: string;
    qty: number;
    uom: string;
    job: string;
    jumlah: number;
    type: "INCOME" | "OUT";
    selectedAccountId: string; // ID Akun lawan hasil pilihan dropdown
};

export default function ImportPettyCashPage() {
    const [accounts, setAccounts] = useState<any[]>([]); // Menampung list COA untuk dropdown
    const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();

    // 1. Ambil daftar akun COA dari database pas halaman kebuka
    useEffect(() => {
        async function loadCOA() {
            // Langsung panggil server action brayy
            const data = await getAccountsForSelect();
            const filteredAccounts = (data || []).filter(
                (acc: any) => acc.code !== "109",
            );
            setAccounts(filteredAccounts);
        }
        loadCOA();
    }, []);

    // 2. Handler utama untuk membedah isi file Excel
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const workbook = XLSX.read(bstr, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // defval: "" agar cell yang kosong di Excel tidak bergeser/hilang format kolomnya
            const rawData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: "",
            }) as any[];

            // Cari index baris header template (DATE, DESCRIPTIONS, QTY, dll)
            const headerIndex = rawData.findIndex(
                (row) => row.includes("DESCRIPTIONS") || row.includes("DATE"),
            );
            if (headerIndex === -1) {
                alert(
                    "Waduh brayy, format kolom template Excel-mu tidak dikenali sistem!",
                );
                return;
            }

            const dataRows = rawData.slice(headerIndex + 1);
            const mappedData: PreviewRow[] = [];
            let currentTanggal = ""; // Penahan tanggal berjalan untuk baris detail yang kosong

            dataRows.forEach((row, index) => {
                const txtTanggal = row[0]?.toString().trim();

                // Menangani fleksibilitas letak kolom jika ada kolom ACC.NO (index ke-1) atau langsung DESCRIPTIONS (index ke-2)
                const deskripsi =
                    row[2]?.toString().trim() ||
                    row[1]?.toString().trim() ||
                    "";
                const qty = Number(row[3]) || 0;
                const uom = row[4]?.toString().trim() || "";
                const job = row[5]?.toString().trim() || "";

                // Ambil data nominal rupiah (INCOME di index 6 atau OUT di index 8)
                const incomeIdr = Number(row[6]) || 0;
                const outIdr = Number(row[8]) || 0;

                // Skip baris pembatas saldo bulanan atau baris kosong tak berguna
                if (
                    deskripsi.toUpperCase().includes("SALDO AKHIR") ||
                    deskripsi.toUpperCase().includes("SALDO AWAL") ||
                    (!deskripsi && !incomeIdr && !outIdr)
                ) {
                    return;
                }

                // Kunci tanggal otomatis: jika cell tanggal ada isinya, update variable tanggal utama kita
                if (txtTanggal) {
                    currentTanggal = txtTanggal;
                }

                // Tentukan apakah ini uang masuk (INCOME) atau uang keluar (OUT)
                const isIncome =
                    incomeIdr > 0 ||
                    deskripsi.toUpperCase().startsWith("NO.PR") ||
                    deskripsi.toUpperCase().startsWith("NO. PR");
                const jumlah = isIncome ? incomeIdr : outIdr;

                // Jika tidak ada nominal uangnya, lewati baris ini brayy
                if (jumlah === 0) return;

                // PINTAR: Cari tebakan otomatis akun COA biar kamu ga capek milih dari nol brayy
                const akunTebakan = accounts.find((acc) => {
                    if (isIncome) return acc.code === "401"; // Jika income, arahkan ke Pendapatan

                    const teks = deskripsi.toLowerCase();
                    // Jika mengandung bahan logistik dapur/kantor
                    if (
                        teks.includes("coffee") ||
                        teks.includes("sugar") ||
                        teks.includes("sabun") ||
                        teks.includes("air")
                    ) {
                        return acc.code === "502"; // Masuk ke Beban Pantry / Keperluan Kantor
                    }
                    // Selain itu default tebak ke Beban Material operasional bengkel/pabrik
                    return acc.code === "501";
                });

                mappedData.push({
                    id: index.toString(),
                    tanggal: currentTanggal || "2026-01-01", // Fallback aman jika baris pertama bolong
                    no_dokumen: isIncome
                        ? deskripsi.split("&")[0].trim()
                        : "OUT-PC",
                    keterangan: deskripsi,
                    qty: qty,
                    uom: uom,
                    job: job,
                    jumlah: jumlah,
                    type: isIncome ? "INCOME" : "OUT",
                    selectedAccountId: akunTebakan ? akunTebakan.id : "", // Pasang ID akun hasil tebakan otomatis
                });
            });

            setPreviewData(mappedData);
        };
        reader.readAsBinaryString(file);
    };

    // 3. Fungsi eksekusi kirim data bersih ke backend Server Action
    const handleSaveData = async () => {
        const hasEmptyAccount = previewData.some(
            (row) => !row.selectedAccountId,
        );
        if (hasEmptyAccount) {
            alert(
                "Eits! Ada baris transaksi yang belum kamu tentukan akun lawannya di dropdown brayy.",
            );
            return;
        }

        setIsUploading(true);
        try {
            const result = await importPettyCashExcel(previewData);
            if (result.success) {
                alert(
                    "Mantap jaya brayy! Semua transaksi kas kecil berhasil masuk ke akun [109].",
                );
                router.push("/dashboard/accounting/journal");
            } else {
                alert("Gagal menyimpan brayy: " + result.error);
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi crash jaringan saat memproses mass-import.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-6 bg-macos-primary min-h-screen text-macos-primary space-y-6">
            {/* Header Halaman */}
            <div className="flex justify-between items-center border-b border-macos-separator pb-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">
                        Parser & Import Petty Cash Excel (Akun 109)
                    </h1>
                    <p className="text-xs text-macos-secondary mt-1">
                        Data otomatis berpasangan dengan Rekening Petty Cash
                        [109] di database.
                    </p>
                </div>
                {/* PREVIEW TABEL HASIL PARSE */}
                {previewData.length > 0 && (
                    <button
                        type="button"
                        onClick={handleSaveData}
                        disabled={isUploading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-xs transition shadow-sm"
                    >
                        {isUploading
                            ? "Memproses..."
                            : `🚀 Simpan ${previewData.length} Jurnal ke DB`}
                    </button>
                )}
                {previewData.length > 0 && (
                    <div className="border border-macos-separator rounded-xl overflow-x-auto bg-macos-secondary shadow-sm">
                        <table className="w-full text-sm text-left border-collapse min-w-[1050px]">
                            <thead>
                                <tr className="bg-macos-tertiary text-xs font-semibold uppercase tracking-wider text-macos-secondary border-b border-macos-separator">
                                    <th className="p-3 w-28">Tanggal</th>
                                    <th className="p-3 w-32">Job / Project</th>
                                    <th className="p-3">Keterangan Item</th>
                                    <th className="p-3 w-24 text-center">
                                        Qty / Uom
                                    </th>
                                    <th className="p-3 text-right w-36">
                                        Nominal (Rp)
                                    </th>
                                    <th className="p-3 w-64 bg-macos-blue/10 text-macos-blue font-bold">
                                        📍 Pilih Akun Lawan
                                    </th>

                                    {/* 1. HEADER KOLOM UNTUK BUANG BARIS */}
                                    <th className="p-3 w-24 text-center text-red-500">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-macos-separator">
                                {previewData.map((row, idx) => (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-macos-tertiary/30 transition text-xs"
                                    >
                                        <td className="p-3 font-mono text-macos-secondary">
                                            {row.tanggal}
                                        </td>
                                        <td className="p-3 font-semibold text-macos-blue">
                                            {row.job || "-"}
                                        </td>
                                        <td className="p-3 font-medium">
                                            {row.type === "INCOME" ? (
                                                <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-bold text-[10px] mr-2">
                                                    INCOME
                                                </span>
                                            ) : (
                                                <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-bold text-[10px] mr-2">
                                                    OUT
                                                </span>
                                            )}
                                            {row.keterangan}
                                        </td>
                                        <td className="p-3 text-center font-mono text-macos-secondary">
                                            {row.qty > 0
                                                ? `${row.qty} ${row.uom}`
                                                : "-"}
                                        </td>
                                        <td
                                            className={`p-3 text-right font-mono font-semibold ${row.type === "INCOME" ? "text-green-400" : "text-macos-primary"}`}
                                        >
                                            {row.jumlah.toLocaleString("id-ID")}
                                        </td>

                                        <td className="p-2 bg-macos-blue/5">
                                            <select
                                                value={row.selectedAccountId}
                                                onChange={(e) => {
                                                    const updated = [
                                                        ...previewData,
                                                    ];
                                                    updated[
                                                        idx
                                                    ].selectedAccountId =
                                                        e.target.value;
                                                    setPreviewData(updated);
                                                }}
                                                // Kita tambahkan text-slate-900 (statis gelap) atau sesuaikan dengan text-macos-primary
                                                className="w-full px-2 py-1.5 bg-white text-gray-900 border border-macos-separator rounded-lg text-xs font-medium focus:outline-none focus:border-macos-blue"
                                            >
                                                {/* Kasih warna background gelap/kontras khusus untuk option agar teksnya kelihatan pas diklik */}
                                                <option
                                                    value=""
                                                    className="bg-white text-gray-900"
                                                >
                                                    -- Pilih Akun Lawan --
                                                </option>
                                                {accounts.map((acc) => (
                                                    <option
                                                        key={acc.id}
                                                        value={acc.id}
                                                        className="bg-white text-gray-900 font-mono"
                                                    >
                                                        [{acc.code}] -{" "}
                                                        {acc.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        {/* 2. TOMBOL ACTION UNTUK MENYINGKIRKAN BARIS EXCEL YANG SALAH/SAMPAH */}
                                        <td className="p-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    // Filter array, buang objek yang id-nya sama dengan baris ini
                                                    const updatedData =
                                                        previewData.filter(
                                                            (item) =>
                                                                item.id !==
                                                                row.id,
                                                        );
                                                    setPreviewData(updatedData);
                                                }}
                                                className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded font-semibold text-[11px] transition"
                                                title="Buang dari list import"
                                            >
                                                ✕ Buang
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Input File Drag & Drop */}
            <div className="p-6 border-2 border-dashed border-macos-separator rounded-xl flex flex-col items-center justify-center bg-macos-secondary">
                <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="text-sm text-macos-secondary file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-macos-tertiary file:text-macos-blue file:hover:opacity-80 cursor-pointer"
                />
                <p className="text-[11px] text-macos-secondary mt-3">
                    Mendukung format multi-sheet log bulanan PT. UTAMA PASOGIT
                    SEJAHTERA
                </p>
            </div>

            {/* Preview Tabel Hasil Parse */}
            {previewData.length > 0 && (
                <div className="border border-macos-separator rounded-xl overflow-x-auto bg-macos-secondary shadow-sm">
                    <table className="w-full text-sm text-left border-collapse min-w-[950px]">
                        <thead>
                            <tr className="bg-macos-tertiary text-xs font-semibold uppercase tracking-wider text-macos-secondary border-b border-macos-separator">
                                <th className="p-3 w-28">Tanggal</th>
                                <th className="p-3 w-32">Job / Project</th>
                                <th className="p-3">Keterangan Item</th>
                                <th className="p-3 w-24 text-center">
                                    Qty / Uom
                                </th>
                                <th className="p-3 text-right w-36">
                                    Nominal (Rp)
                                </th>
                                <th className="p-3 w-72 bg-macos-blue/10 text-macos-blue font-bold">
                                    📍 Pilih Akun Lawan (Dropdown)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-macos-separator">
                            {previewData.map((row, idx) => (
                                <tr
                                    key={row.id}
                                    className="hover:bg-macos-tertiary/30 transition text-xs"
                                >
                                    <td className="p-3 font-mono text-macos-secondary">
                                        {row.tanggal}
                                    </td>
                                    <td className="p-3 font-semibold text-macos-blue">
                                        {row.job || "-"}
                                    </td>
                                    <td className="p-3 font-medium">
                                        {row.type === "INCOME" ? (
                                            <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-bold text-[10px] mr-2">
                                                INCOME
                                            </span>
                                        ) : (
                                            <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-bold text-[10px] mr-2">
                                                OUT
                                            </span>
                                        )}
                                        {row.keterangan}
                                    </td>
                                    <td className="p-3 text-center font-mono text-macos-secondary">
                                        {row.qty > 0
                                            ? `${row.qty} ${row.uom}`
                                            : "-"}
                                    </td>
                                    <td
                                        className={`p-3 text-right font-mono font-semibold ${row.type === "INCOME" ? "text-green-400" : "text-macos-primary"}`}
                                    >
                                        {row.jumlah.toLocaleString("id-ID")}
                                    </td>

                                    {/* DROPDOWN PEMILIH AKUN LAWAN */}
                                    <td className="p-2 bg-macos-blue/5">
                                        <select
                                            value={row.selectedAccountId}
                                            onChange={(e) => {
                                                const updated = [
                                                    ...previewData,
                                                ];
                                                updated[idx].selectedAccountId =
                                                    e.target.value;
                                                setPreviewData(updated);
                                            }}
                                            className="w-full px-2 py-1.5 bg-macos-primary border border-macos-separator rounded-lg text-xs text-macos-primary focus:outline-none focus:border-macos-blue"
                                        >
                                            <option value="">
                                                -- Pilih Akun Lawan --
                                            </option>
                                            {accounts.map((acc) => (
                                                <option
                                                    key={acc.id}
                                                    value={acc.id}
                                                >
                                                    [{acc.code}] - {acc.name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
