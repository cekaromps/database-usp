"use client";

import { useState, useEffect } from "react";
import { getFinancialReportData } from "./_actions/report";

export default function FinancialReportPage() {
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Set filter range tanggal bawaan bulan ini
    const [startDate, setStartDate] = useState("2026-06-01");
    const [endDate, setEndDate] = useState("2026-06-30");

    useEffect(() => {
        setLoading(true);
        getFinancialReportData(startDate, endDate).then((res) => {
            if (res.success) {
                setReportData(res.data);
            }
            setLoading(false);
        });
    }, [startDate, endDate]);

    if (loading || !reportData) {
        return (
            <div className="p-6 text-center text-sm italic text-macos-secondary animate-pulse">
                Menghitung saldo dan menyusun laporan...
            </div>
        );
    }

    const formatRupiah = (num: number) => {
        return (
            "Rp " + num.toLocaleString("id-ID", { minimumFractionDigits: 2 })
        );
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8 min-h-screen bg-macos-secondary text-macos-primary">
            {/* FILTER TOPBAR BARIS BAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-macos-tertiary p-4 rounded-xl border border-macos-separator">
                <div>
                    <h1 className="text-xl font-bold">
                        Laporan Keuangan Otomatis
                    </h1>
                    <p className="text-xs text-macos-secondary mt-0.5">
                        Real-time kalkulasi dari Jurnal Umum.
                    </p>
                </div>
                <div className="flex gap-2 text-sm">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-2 py-1 bg-macos-secondary border border-macos-separator rounded-md font-mono"
                    />
                    <span className="self-center text-macos-secondary">
                        s/d
                    </span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-2 py-1 bg-macos-secondary border border-macos-separator rounded-md font-mono"
                    />
                </div>
            </div>

            {/* 1. LAPORAN LABA RUGI */}
            <div className="bg-macos-tertiary p-6 rounded-xl border border-macos-separator shadow-xl space-y-4">
                <div className="text-center border-b border-macos-separator pb-3">
                    <h2 className="text-base font-bold uppercase tracking-wide">
                        Laporan Laba Rugi
                    </h2>
                </div>

                <div className="space-y-4 text-sm">
                    <div>
                        <h3 className="font-bold text-macos-blue text-xs uppercase mb-1">
                            Pendapatan
                        </h3>
                        {reportData.revenues.map((r: any) => (
                            <div
                                key={r.code}
                                className="flex justify-between pl-4 py-0.5"
                            >
                                <span>
                                    [{r.code}] {r.name}
                                </span>
                                <span className="font-mono">
                                    {formatRupiah(r.balance)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div>
                        <h3 className="font-bold text-macos-orange text-xs uppercase mb-1">
                            Beban Operasional
                        </h3>
                        {reportData.expenses.map((e: any) => (
                            <div
                                key={e.code}
                                className="flex justify-between pl-4 py-0.5"
                            >
                                <span>
                                    [{e.code}] {e.name}
                                </span>
                                <span className="font-mono">
                                    {formatRupiah(e.balance)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center p-3 bg-macos-secondary rounded-lg font-bold border border-macos-separator">
                        <span
                            className={
                                reportData.netProfit >= 0
                                    ? "text-macos-green"
                                    : "text-macos-red"
                            }
                        >
                            {reportData.netProfit >= 0
                                ? "LABA BERSIH"
                                : "RUGI BERSIH"}
                        </span>
                        <span
                            className={`font-mono text-base ${reportData.netProfit >= 0 ? "text-macos-green" : "text-macos-red"}`}
                        >
                            {formatRupiah(reportData.netProfit)}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. NERACA KEUANGAN */}
            <div className="bg-macos-tertiary p-6 rounded-xl border border-macos-separator shadow-xl space-y-4">
                <div className="text-center border-b border-macos-separator pb-3">
                    <h2 className="text-base font-bold uppercase tracking-wide">
                        Neraca (Balance Sheet)
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    {/* SISI KIRI: ASET */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-bold text-macos-blue text-xs uppercase border-b border-macos-separator pb-1 mb-2">
                                Aset / Aktiva
                            </h3>
                            {reportData.assets.map((a: any) => (
                                <div
                                    key={a.code}
                                    className="flex justify-between py-0.5"
                                >
                                    <span>
                                        [{a.code}] {a.name}
                                    </span>
                                    <span className="font-mono">
                                        {formatRupiah(a.balance)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between font-bold p-2 bg-macos-secondary rounded border border-macos-separator">
                            <span>TOTAL ASET</span>
                            <span className="font-mono">
                                {formatRupiah(
                                    reportData.assets.reduce(
                                        (sum: number, i: any) =>
                                            sum + i.balance,
                                        0,
                                    ),
                                )}
                            </span>
                        </div>
                    </div>

                    {/* SISI KANAN: LIABILITAS & EKUITAS */}
                    <div className="space-y-4 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-bold text-macos-orange text-xs uppercase border-b border-macos-separator pb-1 mb-2">
                                    Liabilitas (Utang)
                                </h3>
                                {reportData.liabilities.map((l: any) => (
                                    <div
                                        key={l.code}
                                        className="flex justify-between py-0.5"
                                    >
                                        <span>
                                            [{l.code}] {l.name}
                                        </span>
                                        <span className="font-mono">
                                            {formatRupiah(l.balance)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <h3 className="font-bold text-macos-green text-xs uppercase border-b border-macos-separator pb-1 mb-2">
                                    Ekuitas & Laba
                                </h3>
                                {reportData.equities.map((eq: any) => (
                                    <div
                                        key={eq.code}
                                        className="flex justify-between py-0.5"
                                    >
                                        <span>
                                            [{eq.code}] {eq.name}
                                        </span>
                                        <span className="font-mono">
                                            {formatRupiah(eq.balance)}
                                        </span>
                                    </div>
                                ))}
                                {/* Otomatisasi penambahan Laba Berjalan dari Laba Rugi ke Modal Neraca */}
                                <div className="flex justify-between py-0.5 text-macos-secondary italic">
                                    <span>Laba Bersih Periode Berjalan</span>
                                    <span className="font-mono">
                                        {formatRupiah(reportData.netProfit)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between font-bold p-2 bg-macos-secondary rounded border border-macos-separator mt-auto">
                            <span>TOTAL LIABILITAS & EKUITAS</span>
                            <span className="font-mono text-macos-green">
                                {formatRupiah(
                                    reportData.liabilities.reduce(
                                        (sum: number, i: any) =>
                                            sum + i.balance,
                                        0,
                                    ) +
                                        reportData.equities.reduce(
                                            (sum: number, i: any) =>
                                                sum + i.balance,
                                            0,
                                        ) +
                                        reportData.netProfit,
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
