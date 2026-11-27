"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { getIncomeStatement } from "../../_actions/report";
import {
    formatAccounting,
    type IncomeStatementData,
} from "@/lib/income-statement";

const COMPANY_KEY = "accounting:companyName";
const DEFAULT_COMPANY =
    process.env.NEXT_PUBLIC_COMPANY_NAME || "Nama Perusahaan";

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function IncomeStatementPage() {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [company, setCompany] = useState(DEFAULT_COMPANY);
    const [data, setData] = useState<IncomeStatementData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Default: tanggal 1 bulan ini s/d hari ini (diset di client supaya
    // sesuai zona waktu pengguna dan tidak bentrok saat hydration).
    useEffect(() => {
        const now = new Date();
        setStartDate(toISO(new Date(now.getFullYear(), now.getMonth(), 1)));
        setEndDate(toISO(now));
        try {
            const saved = localStorage.getItem(COMPANY_KEY);
            if (saved) setCompany(saved);
        } catch {
            /* localStorage tidak tersedia, pakai default */
        }
    }, []);

    useEffect(() => {
        if (!startDate || !endDate) return;
        let cancelled = false;
        setLoading(true);
        getIncomeStatement(startDate, endDate)
            .then((res) => {
                if (cancelled) return;
                if (res.success) {
                    setData(res.data);
                    setError(null);
                } else {
                    setData(null);
                    setError(res.error);
                }
            })
            .catch(() => {
                if (cancelled) return;
                setData(null);
                setError("Gagal memuat laporan.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [startDate, endDate]);

    const handleCompanyChange = (value: string) => {
        setCompany(value);
        try {
            localStorage.setItem(COMPANY_KEY, value);
        } catch {
            /* abaikan */
        }
    };

    // Cetak / Simpan sebagai PDF lewat dialog cetak browser.
    // Judul dokumen dipakai browser sebagai nama file PDF.
    const handlePrint = () => {
        const prevTitle = document.title;
        document.title = `Laporan_Laba_Rugi_${startDate}_${endDate}`;
        const restore = () => {
            document.title = prevTitle;
            window.removeEventListener("afterprint", restore);
        };
        window.addEventListener("afterprint", restore);
        window.print();
    };

    const handleExcel = () => {
        if (!data) return;
        const rows: (string | number)[][] = [
            [company],
            ["Laporan Laba Rugi"],
            [
                `Periode dari tanggal ${data.startDate} sampai dengan tanggal ${data.endDate}`,
            ],
            [data.endDate],
            [],
            ["Pendapatan"],
            ...data.revenues.map((r) => [`   ${r.name}`, r.amount]),
            ["Total — Pendapatan", data.totalRevenue],
            [],
            ["Beban"],
            ...data.expenses.map((r) => [`   ${r.name}`, -r.amount]),
            ["Total — Beban", -data.totalExpense],
            [],
            ["Laba (Rugi) Bersih", data.netIncome],
        ];

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws["!cols"] = [{ wch: 48 }, { wch: 20 }];
        // Angka negatif tampil dalam kurung, seperti di PDF.
        Object.keys(ws).forEach((key) => {
            if (key.startsWith("!")) return;
            if (ws[key].t === "n") ws[key].z = "#,##0.00;(#,##0.00)";
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laba Rugi");
        XLSX.writeFile(
            wb,
            `Laporan_Laba_Rugi_${data.startDate}_${data.endDate}.xlsx`,
        );
    };

    const isEmpty =
        !!data && data.revenues.length === 0 && data.expenses.length === 0;

    return (
        <div className="min-h-screen bg-macos-base text-macos-primary p-6 space-y-6 print:min-h-0 print:bg-white print:p-0">
            {/* Ukuran kertas saat cetak / simpan PDF */}
            <style>{`@page { size: A4; margin: 18mm; }`}</style>

            {/* TOOLBAR (tidak ikut tercetak) */}
            <div className="max-w-3xl mx-auto flex flex-col gap-3 bg-macos-tertiary p-4 rounded-xl border border-macos-separator print:hidden">
                <div>
                    <h1 className="text-lg font-bold">Laporan Laba Rugi</h1>
                    <p className="text-xs text-macos-secondary mt-0.5">
                        Dihitung dari Jurnal Umum berstatus POSTED.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        aria-label="Tanggal awal"
                        className="px-2 py-1 bg-macos-secondary border border-macos-separator rounded-md font-mono"
                    />
                    <span className="text-macos-secondary">s/d</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        aria-label="Tanggal akhir"
                        className="px-2 py-1 bg-macos-secondary border border-macos-separator rounded-md font-mono"
                    />
                    <input
                        type="text"
                        value={company}
                        onChange={(e) => handleCompanyChange(e.target.value)}
                        aria-label="Nama perusahaan"
                        placeholder="Nama perusahaan"
                        className="px-2 py-1 bg-macos-secondary border border-macos-separator rounded-md min-w-56 flex-1"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handlePrint}
                        disabled={!data}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg text-xs transition shadow-sm"
                    >
                        Cetak / Simpan PDF
                    </button>
                    <button
                        type="button"
                        onClick={handleExcel}
                        disabled={!data}
                        className="px-3.5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg text-xs transition shadow-sm"
                    >
                        Export Excel (.xlsx)
                    </button>
                </div>
            </div>

            {error && (
                <div className="max-w-3xl mx-auto text-sm text-macos-red print:hidden">
                    {error}
                </div>
            )}

            {loading && !data && (
                <div className="text-center text-sm italic text-macos-secondary animate-pulse print:hidden">
                    Menyusun laporan...
                </div>
            )}

            {/* KERTAS LAPORAN */}
            {data && (
                <div
                    className={`mx-auto w-full max-w-[794px] bg-white text-black px-12 py-10 shadow-lg print:max-w-none print:p-0 print:shadow-none ${
                        loading ? "opacity-60" : ""
                    }`}
                >
                    <div className="text-center mb-8 space-y-0.5">
                        <h2 className="text-lg font-bold">
                            {company || "\u00A0"}
                        </h2>
                        <h3 className="text-base font-bold">
                            Laporan Laba Rugi
                        </h3>
                        <p className="text-sm">
                            Periode dari tanggal {data.startDate} sampai dengan
                            tanggal {data.endDate}
                        </p>
                        <p className="text-sm">{data.endDate}</p>
                    </div>

                    <table className="w-full text-sm border-collapse tabular-nums">
                        <colgroup>
                            <col />
                            <col className="w-48" />
                        </colgroup>
                        <tbody>
                            <tr>
                                <th
                                    colSpan={2}
                                    className="text-left font-bold pt-1 pb-1"
                                >
                                    Pendapatan
                                </th>
                            </tr>
                            {data.revenues.map((r) => (
                                <tr key={r.code}>
                                    <td className="pl-6 py-0.5">{r.name}</td>
                                    <td className="text-right py-0.5">
                                        {formatAccounting(r.amount)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="font-bold">
                                <td className="pt-1.5 border-t border-black">
                                    Total — Pendapatan
                                </td>
                                <td className="pt-1.5 text-right border-t border-black">
                                    {formatAccounting(data.totalRevenue)}
                                </td>
                            </tr>

                            <tr>
                                <td colSpan={2} className="h-5" />
                            </tr>

                            <tr>
                                <th
                                    colSpan={2}
                                    className="text-left font-bold pb-1"
                                >
                                    Beban
                                </th>
                            </tr>
                            {data.expenses.map((r) => (
                                <tr key={r.code}>
                                    <td className="pl-6 py-0.5">{r.name}</td>
                                    <td className="text-right py-0.5">
                                        {formatAccounting(-r.amount)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="font-bold">
                                <td className="pt-1.5 border-t border-black">
                                    Total — Beban
                                </td>
                                <td className="pt-1.5 text-right border-t border-black">
                                    {formatAccounting(-data.totalExpense)}
                                </td>
                            </tr>

                            <tr>
                                <td colSpan={2} className="h-5" />
                            </tr>

                            <tr className="font-bold">
                                <td className="py-1.5 border-t border-b-[3px] border-black [border-bottom-style:double]">
                                    Laba (Rugi) Bersih
                                </td>
                                <td className="py-1.5 text-right border-t border-b-[3px] border-black [border-bottom-style:double]">
                                    {formatAccounting(data.netIncome)}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {isEmpty && (
                        <p className="mt-6 text-center text-sm italic text-gray-500">
                            Tidak ada transaksi pendapatan atau beban pada
                            periode ini.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
