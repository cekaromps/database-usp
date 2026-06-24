"use server";
import { prisma } from "@/lib/prisma";

export async function getFinancialReportData(
    startDateStr: string,
    endDateStr: string,
) {
    try {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        const journalLines = await prisma.journalLine.findMany({
            where: {
                journalEntry: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            },
            include: {
                account: true,
            },
        });

        const accountBalances: Record<
            string,
            { code: string; name: string; balance: number }
        > = {};
        journalLines.forEach((line) => {
            const { id, code, name } = line.account;

            if (!accountBalances[id]) {
                accountBalances[id] = { code, name, balance: 0 };
            }

            if (
                code.startsWith("1") ||
                code.startsWith("5") ||
                code.startsWith("6")
            ) {
                accountBalances[id].balance +=
                    Number(line.debit) - Number(line.credit);
            } else {
                accountBalances[id].balance +=
                    Number(line.credit) - Number(line.debit);
            }
        });

        const revenues: (typeof journalLines)[0]["account"][] &
            { balance: number }[] = [];
        const expenses: any[] = [];
        const assets: any[] = [];
        const liabilities: any[] = [];
        const equities: any[] = [];

        Object.values(accountBalances).forEach((acc) => {
            if (acc.code.startsWith("4")) {
                revenues.push(acc);
            } else if (acc.code.startsWith("5") || acc.code.startsWith("6")) {
                expenses.push(acc);
            } else if (acc.code.startsWith("1")) {
                assets.push(acc);
            } else if (acc.code.startsWith("2")) {
                liabilities.push(acc);
            } else if (acc.code.startsWith("3")) {
                equities.push(acc);
            }
        });

        const totalRevenue = revenues.reduce(
            (sum, item) => sum + item.balance,
            0,
        );
        const totalExpense = expenses.reduce(
            (sum, item) => sum + item.balance,
            0,
        );
        const netProfit = totalRevenue - totalExpense;

        return {
            success: true,
            data: {
                revenues,
                expenses,
                assets,
                liabilities,
                equities,
                totalRevenue,
                totalExpense,
                netProfit,
            },
        };
    } catch (error) {
        console.error("Gagal menarik data laporan:", error);
        return { success: false, error: "Gagal memproses laporan keuangan" };
    }
}
