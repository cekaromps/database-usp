// Pure helpers for the Laporan Laba Rugi (income statement).
// No Prisma / server imports here, so it can be used from both server
// actions and client components, and is easy to unit test.

export type IncomeStatementRow = {
    code: string;
    name: string;
    /** Natural-sign amount: revenue = credit - debit, expense = debit - credit */
    amount: number;
};

export type IncomeStatementData = {
    startDate: string; // yyyy-mm-dd
    endDate: string; // yyyy-mm-dd
    revenues: IncomeStatementRow[];
    expenses: IncomeStatementRow[];
    totalRevenue: number;
    totalExpense: number;
    netIncome: number;
};

export type StatementAccount = {
    id: string;
    code: string;
    name: string;
    type: string; // "REVENUE" | "EXPENSE" | others (ignored)
};

export type AccountLineSum = {
    accountId: string;
    debit: number;
    credit: number;
};

/** Round to cents; avoids 0.1 + 0.2 style float noise. */
export const round2 = (n: number): number => Math.round(n * 100) / 100;

const byCode = (a: IncomeStatementRow, b: IncomeStatementRow) =>
    a.code.localeCompare(b.code, undefined, { numeric: true });

export function buildIncomeStatement(
    startDate: string,
    endDate: string,
    accounts: StatementAccount[],
    sums: AccountLineSum[],
): IncomeStatementData {
    const sumByAccount = new Map(sums.map((s) => [s.accountId, s]));

    const revenues: IncomeStatementRow[] = [];
    const expenses: IncomeStatementRow[] = [];

    for (const acc of accounts) {
        const s = sumByAccount.get(acc.id);
        if (!s) continue;

        if (acc.type === "REVENUE") {
            const amount = round2(s.credit - s.debit);
            if (amount !== 0) {
                revenues.push({ code: acc.code, name: acc.name, amount });
            }
        } else if (acc.type === "EXPENSE") {
            const amount = round2(s.debit - s.credit);
            if (amount !== 0) {
                expenses.push({ code: acc.code, name: acc.name, amount });
            }
        }
    }

    revenues.sort(byCode);
    expenses.sort(byCode);

    const totalRevenue = round2(revenues.reduce((t, r) => t + r.amount, 0));
    const totalExpense = round2(expenses.reduce((t, r) => t + r.amount, 0));

    return {
        startDate,
        endDate,
        revenues,
        expenses,
        totalRevenue,
        totalExpense,
        netIncome: round2(totalRevenue - totalExpense),
    };
}

/**
 * Accounting number format used in the report:
 *   71100000   -> "71,100,000.00"
 *   -21000000  -> "(21,000,000.00)"
 */
export function formatAccounting(n: number): string {
    const s = Math.abs(n).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return n < 0 ? `(${s})` : s;
}
