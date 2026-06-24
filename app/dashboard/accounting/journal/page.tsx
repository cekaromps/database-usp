import Link from "next/link";
import { getJournalEntries } from "../_actions/journal";
import ResetJournalButton from "./_components/ResetJournalBtn";

export default async function JournalPage() {
    const entries = await getJournalEntries();

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 min-h-screen bg-macos-base text-macos-primary">
            {/* HEADER SECTION */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-macos-primary">
                        Jurnal Umum
                    </h1>
                    <p className="text-sm text-macos-secondary mt-1">
                        Histori pencatatan kronologis seluruh transaksi
                        keuangan.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* SUNTIKAN TOMBOL DUMP / RESET DATA JURNAL DB */}
                    <ResetJournalButton />
                </div>
                <Link
                    href="/dashboard/accounting/journal/new"
                    className="px-4 py-2 bg-macos-blue text-white rounded-lg text-sm font-medium hover:bg-blue-500 shadow text-center transition"
                >
                    + Tambah Jurnal Baru
                </Link>
            </div>

            {/* TABLE DATA CONTAINER */}
            <div className="bg-macos-secondary rounded-lg shadow-xl border border-macos-separator overflow-hidden">
                {entries.length === 0 ? (
                    <div className="p-12 text-center text-sm text-macos-tertiary italic">
                        Belum ada transaksi yang dicatat. Silakan tambah jurnal
                        baru terlebih dahulu.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-macos-secondary min-w-[800px]">
                            {/* HEADER TABEL */}
                            <thead className="bg-macos-popover border-b border-macos-separator text-xs text-macos-secondary uppercase font-semibold tracking-wider">
                                <tr>
                                    <th className="px-6 py-3.5 w-32">
                                        Tanggal
                                    </th>
                                    <th className="px-6 py-3.5 w-36">
                                        Ref / No. Bukti
                                    </th>
                                    <th className="px-6 py-3.5">
                                        Keterangan / Akun
                                    </th>
                                    <th className="px-6 py-3.5 w-36 text-right">
                                        Debit (Rp)
                                    </th>
                                    <th className="px-6 py-3.5 w-36 text-right">
                                        Kredit (Rp)
                                    </th>
                                    <th className="px-6 py-3.5 w-24 text-center">
                                        Status
                                    </th>
                                </tr>
                            </thead>

                            {/* BODY TABEL */}
                            <tbody className="divide-y divide-macos-separator bg-macos-secondary">
                                {entries.map((entry) => {
                                    const formattedDate = new Date(
                                        entry.date,
                                    ).toLocaleDateString("id-ID", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        timeZone: "Asia/Jakarta",
                                    });

                                    return (
                                        <tr
                                            key={entry.id}
                                            className="align-top hover:bg-macos-tertiary/40 transition"
                                        >
                                            {/* Tanggal Transaksi */}
                                            <td className="px-6 py-4 font-medium text-macos-primary whitespace-nowrap">
                                                {formattedDate}
                                            </td>

                                            {/* Nomor Referensi */}
                                            <td className="px-6 py-4 font-mono text-xs font-semibold text-macos-tertiary whitespace-nowrap">
                                                {entry.reference || "-"}
                                            </td>

                                            {/* Detail Deskripsi & Akun Mutasi */}
                                            <td className="px-6 py-4 space-y-2">
                                                <div className="font-semibold text-macos-primary text-base">
                                                    {entry.description}
                                                </div>

                                                {/* List Breakdown Akun Double-Entry */}
                                                <div className="space-y-1 pl-2 border-l-2 border-macos-separator">
                                                    {entry.lines.map((line) => {
                                                        const isCredit =
                                                            Number(
                                                                line.credit,
                                                            ) > 0;
                                                        return (
                                                            <div
                                                                key={line.id}
                                                                className={`grid grid-cols-12 text-xs py-0.5 ${
                                                                    isCredit
                                                                        ? "pl-6 text-macos-secondary"
                                                                        : "text-macos-primary font-medium"
                                                                }`}
                                                            >
                                                                <span className="col-span-3 font-mono text-macos-tertiary">
                                                                    [
                                                                    {
                                                                        line
                                                                            .account
                                                                            .code
                                                                    }
                                                                    ]
                                                                </span>
                                                                <span className="col-span-9">
                                                                    {
                                                                        line
                                                                            .account
                                                                            .name
                                                                    }
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </td>

                                            {/* Kolom Angka Debit */}
                                            <td className="px-6 py-4 text-right font-mono text-xs">
                                                {/* Spacer penyeimbang judul deskripsi agar angka sejajar dengan item baris */}
                                                <div className="invisible h-6 text-base">
                                                    Header Spacer
                                                </div>
                                                <div className="space-y-1">
                                                    {entry.lines.map((line) => {
                                                        const debitNum = Number(
                                                            line.debit,
                                                        );
                                                        return (
                                                            <div
                                                                key={line.id}
                                                                className="h-5 flex items-center justify-end text-macos-primary"
                                                            >
                                                                {debitNum > 0
                                                                    ? debitNum.toLocaleString(
                                                                          "id-ID",
                                                                          {
                                                                              minimumFractionDigits: 2,
                                                                          },
                                                                      )
                                                                    : "-"}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </td>

                                            {/* Kolom Angka Kredit */}
                                            <td className="px-6 py-4 text-right font-mono text-xs">
                                                <div className="invisible h-6 text-base">
                                                    Header Spacer
                                                </div>
                                                <div className="space-y-1">
                                                    {entry.lines.map((line) => {
                                                        const creditNum =
                                                            Number(line.credit);
                                                        return (
                                                            <div
                                                                key={line.id}
                                                                className="h-5 flex items-center justify-end text-macos-secondary"
                                                            >
                                                                {creditNum > 0
                                                                    ? creditNum.toLocaleString(
                                                                          "id-ID",
                                                                          {
                                                                              minimumFractionDigits: 2,
                                                                          },
                                                                      )
                                                                    : "-"}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </td>

                                            {/* Badge Status Jurnal */}
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <div className="invisible h-6 text-base">
                                                    Header Spacer
                                                </div>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                        entry.status ===
                                                        "POSTED"
                                                            ? "bg-macos-green/10 text-macos-green border-macos-green/20"
                                                            : entry.status ===
                                                                "DRAFT"
                                                              ? "bg-macos-orange/10 text-macos-orange border-macos-orange/20"
                                                              : "bg-macos-tertiary text-macos-secondary border-macos-separator"
                                                    }`}
                                                >
                                                    {entry.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
