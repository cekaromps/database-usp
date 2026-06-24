// app/dashboard/accounting/coa/page.tsx
import { getGroupedAccounts } from "../_actions/coa";
import { AccountType } from "@prisma/client";
import AddAccountButton from "./_components/AddAcountButton";
// IMPORT TOMBOL EXCEL CLIENT-SIDE YANG BARU KITA BUAT BRAYY
import ExportCOAButton from "./_components/ExportCOA";

// Helper warna badge untuk tiap tipe akun
const typeColors: Record<AccountType, string> = {
    ASSET: "bg-blue-50 text-blue-700 border-blue-200",
    LIABILITY: "bg-red-50 text-red-700 border-red-200",
    EQUITY: "bg-purple-50 text-purple-700 border-purple-200",
    REVENUE: "bg-green-50 text-green-700 border-green-200",
    EXPENSE: "bg-amber-50 text-amber-700 border-amber-200",
};

export default async function ChartOfAccountsPage() {
    const groupedAccounts = await getGroupedAccounts();
    const accountTypes: AccountType[] = [
        "ASSET",
        "LIABILITY",
        "EQUITY",
        "REVENUE",
        "EXPENSE",
    ];

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto bg-macos-base">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-macos-primary">
                        Chart of Accounts (COA)
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Daftar seluruh rekening akuntansi yang digunakan dalam
                        sistem.
                    </p>
                </div>

                {/* TEMPAT TOMBOL AKSI DI SEBELAH KANAN HEADER */}
                <div className="flex items-center gap-2">
                    {/* SUNTIKAN TOMBOL EXCEL BARU (Melempar data COA dari server) */}
                    <ExportCOAButton groupedAccounts={groupedAccounts} />
                    <AddAccountButton />
                </div>
            </div>

            {accountTypes.map((type) => {
                const accounts = groupedAccounts[type] || [];

                return (
                    <div
                        key={type}
                        className="bg-macos-secondary rounded-xl shadow-sm border border-macos-popover overflow-hidden mb-5"
                    >
                        <div className="px-5 py-3 bg-macos-tertiary border-b border-macos-popover flex items-center justify-between">
                            <h3 className="font-semibold text-macos-primary tracking-wide">
                                {type}
                            </h3>
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeColors[type]}`}
                            >
                                {accounts.length} Akun
                            </span>
                        </div>

                        {accounts.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-400 italic">
                                Belum ada akun di bawah kategori ini.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full w-full table-fixed divide-y divide-gray-200 text-left text-sm text-gray-600">
                                    <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase font-medium tracking-wider">
                                        <tr>
                                            <th className="px-6 py-3 w-32 text-macos-primary">
                                                Kode Akun
                                            </th>
                                            <th className="px-6 py-3 w-72 text-macos-primary">
                                                Nama Rekening
                                            </th>
                                            <th className="px-6 py-3 w-full text-macos-primary">
                                                Deskripsi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y w-full divide-gray-200 bg-white">
                                        {accounts.map((account) => (
                                            <tr
                                                key={account.id}
                                                className="hover:bg-gray-50/70 transition"
                                            >
                                                <td className="px-6 py-2 bg-macos-popover font-mono font-semibold text-macos-primary truncate">
                                                    {account.code}
                                                </td>
                                                <td className="px-6 py-2 bg-macos-secondary font-medium text-macos-secondary truncate">
                                                    {account.name}
                                                </td>
                                                <td className="px-6 py-2 bg-macos-secondary text-gray-500 text-macos-primary">
                                                    {account.description || "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
