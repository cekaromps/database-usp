import Link from "next/link";

export default function AccountingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-macos-secondary">
            <header className="bg-macos-secondary border-b border-gray-200 px-6 py-3 flex items-center gap-6">
                <h2 className="font-semibold text-macos-primary border-r pr-6 border-gray-300">
                    Modul Akuntansi
                </h2>
                <nav className="flex gap-4 text-sm font-medium text-gray-600">
                    <Link
                        href="/dashboard/accounting"
                        className="hover:text-blue-600 text-macos-secondary transition"
                    >
                        Ringkasan
                    </Link>
                    <Link
                        href="/dashboard/accounting/coa"
                        className="hover:text-blue-600 text-macos-secondary transition"
                    >
                        Chart of Accounts
                    </Link>
                    <Link
                        href="/dashboard/accounting/journal"
                        className="hover:text-blue-600 text-macos-secondary transition"
                    >
                        Jurnal Umum
                    </Link>
                    <Link
                        href="/dashboard/accounting/journal/import"
                        className="hover:text-blue-600 text-macos-secondary transition"
                    >
                        Import Excel
                    </Link>
                </nav>
            </header>

            {/* Konten Halaman */}
            <main className="flex-1">{children}</main>
        </div>
    );
}
