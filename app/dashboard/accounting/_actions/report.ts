"use server";

import { assertSection } from "@/lib/rbac"
import { prisma } from "@/lib/prisma";
import {
    buildIncomeStatement,
    type IncomeStatementData,
} from "@/lib/income-statement";

type AccountBalance = { code: string; name: string; balance: number };

export async function getFinancialReportData(
    startDateStr: string,
    endDateStr: string,
) {
    await assertSection("finance");
    try {
        // Rentang inklusif satu hari penuh (UTC). Tanggal jurnal disimpan pada
        // hari kalender yang sama, baik input manual (00:00Z) maupun import
        // Excel (siang), jadi akhir rentang harus 23:59:59.999 hari terakhir.
        const startDate = new Date(`${startDateStr.slice(0, 10)}T00:00:00.000Z`);
        const endDate = new Date(`${endDateStr.slice(0, 10)}T23:59:59.999Z`);

        const journalLines = await prisma.journalLine.findMany({
            where: {
                journalEntry: {
                    // Hanya jurnal POSTED (DRAFT / VOIDED tidak dihitung)
                    status: "POSTED",
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
            AccountBalance & { type: string }
        > = {};
        journalLines.forEach((line) => {
            const { id, code, name, type } = line.account;

            if (!accountBalances[id]) {
                accountBalances[id] = { code, name, type, balance: 0 };
            }

            // Saldo normal debit: ASSET & EXPENSE. Saldo normal kredit: sisanya.
            if (type === "ASSET" || type === "EXPENSE") {
                accountBalances[id].balance +=
                    Number(line.debit) - Number(line.credit);
            } else {
                accountBalances[id].balance +=
                    Number(line.credit) - Number(line.debit);
            }
        });

        const revenues: AccountBalance[] = [];
        const expenses: AccountBalance[] = [];
        const assets: AccountBalance[] = [];
        const liabilities: AccountBalance[] = [];
        const equities: AccountBalance[] = [];

        const byCode = (a: AccountBalance, b: AccountBalance) =>
            a.code.localeCompare(b.code, undefined, { numeric: true });

        Object.values(accountBalances).forEach(({ type, ...acc }) => {
            // Bulatkan ke sen supaya tidak ada sisa selisih floating point
            const item = { ...acc, balance: Math.round(acc.balance * 100) / 100 };
            if (type === "REVENUE") revenues.push(item);
            else if (type === "EXPENSE") expenses.push(item);
            else if (type === "ASSET") assets.push(item);
            else if (type === "LIABILITY") liabilities.push(item);
            else if (type === "EQUITY") equities.push(item);
        });

        [revenues, expenses, assets, liabilities, equities].forEach((list) =>
            list.sort(byCode),
        );

        const round2 = (n: number) => Math.round(n * 100) / 100;
        const totalRevenue = round2(
            revenues.reduce((sum, item) => sum + item.balance, 0),
        );
        const totalExpense = round2(
            expenses.reduce((sum, item) => sum + item.balance, 0),
        );
        const netProfit = round2(totalRevenue - totalExpense);

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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Laporan Laba Rugi untuk periode [startDate, endDate] (inklusif, yyyy-mm-dd).
 * - Hanya jurnal berstatus POSTED (DRAFT / VOIDED tidak dihitung).
 * - Akun diklasifikasi dari ChartOfAccount.type (REVENUE / EXPENSE).
 */
export async function getIncomeStatement(
    startDate: string,
    endDate: string,
): Promise<
    | { success: true; data: IncomeStatementData }
    | { success: false; error: string }
> {
    await assertSection("finance");

    if (!ISO_DATE.test(startDate) || !ISO_DATE.test(endDate)) {
        return { success: false, error: "Format tanggal tidak valid." };
    }
    // Tanggal jurnal disimpan pada hari kalender yang sama (UTC) baik dari
    // input manual (00:00Z) maupun import Excel (siang), jadi rentang
    // dibuat dari awal hari sampai akhir hari (UTC).
    const from = new Date(`${startDate}T00:00:00.000Z`);
    const to = new Date(`${endDate}T23:59:59.999Z`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        return { success: false, error: "Tanggal tidak valid." };
    }
    if (from > to) {
        return {
            success: false,
            error: "Tanggal awal tidak boleh setelah tanggal akhir.",
        };
    }

    try {
        const accounts = await prisma.chartOfAccount.findMany({
            where: {
                type: { in: ["REVENUE", "EXPENSE"] },
            },
            select: { id: true, code: true, name: true, type: true },
            orderBy: { code: "asc" },
        });

        const grouped = await prisma.journalLine.groupBy({
            by: ["accountId"],
            where: {
                accountId: { in: accounts.map((a) => a.id) },
                journalEntry: {
                    status: "POSTED",
                    date: { gte: from, lte: to },
                },
            },
            _sum: { debit: true, credit: true },
        });

        const sums = grouped.map((g) => ({
            accountId: g.accountId,
            debit: Number(g._sum.debit ?? 0),
            credit: Number(g._sum.credit ?? 0),
        }));

        return {
            success: true,
            data: buildIncomeStatement(startDate, endDate, accounts, sums),
        };
    } catch (error) {
        console.error("Gagal menyusun laporan laba rugi:", error);
        return { success: false, error: "Gagal memproses laporan laba rugi." };
    }
}
