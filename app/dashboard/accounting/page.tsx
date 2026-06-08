import { prisma } from "@/lib/prisma";

async function getAccountingSummary() {
    const lines = await prisma.journalLine.findMany({
        include: {
            account: true,
        },
    })

    let totalAsset = 0;
    let totalRevenue = 0;

    lines.forEach(line => {
        if (line.account.type === 'ASSET') {
            totalAsset += Number(line.debit) - Number(line.credit);
        } else if (line.account.type === 'REVENUE') {
            totalRevenue += Number(line.credit) - Number(line.debit);
        }
    });
    return { totalAsset, totalRevenue };
}

export default async function AccountingDashboardPage() {
    const summary = await getAccountingSummary();

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl text-macos-popover font-bold tracking-tight">Accounting Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 bg-white rounded-xl shadow border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">Total Nilai Aset</p>
                    <p className="text-2xl font-bold mt-1">
                        Rp {summary.totalAsset.toLocaleString('id-ID')}
                    </p>
                </div>
                <div className="p-4 bg-white rounded-xl shadow border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">Pendapatan Bulan Ini</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">
                        Rp {summary.totalRevenue.toLocaleString('id-ID')}
                    </p>
                </div>
            </div>
        </div>
    )
}