// Pure Statement-of-Account logic: no database, no file IO.
// Everything that touches Prisma lives in lib/soa.ts; the Excel layout lives in lib/soa-xlsx.ts.

/** PPh 23 withholding on services. */
export const PPH23_RATE = 0.02;

/**
 * PPh 23 is only withheld on service lines. Goods lines are written "SUPPLY ..." on the
 * statements (see 098-UPS.SOA/II/2026: the SUPPLY lines are excluded from the tax base).
 * Change this single function if finance ever needs a different rule.
 */
export function isGoodsLine(description: string): boolean {
  return /^\s*supply\b/i.test(description);
}

// ---------- period helpers (a period is "YYYY-MM", month boundaries are Asia/Jakarta, UTC+7) ----------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export function isValidPeriod(period: unknown): period is string {
  return typeof period === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
}

/** [start, end) of the period in Asia/Jakarta time. */
export function periodRange(period: string): { start: Date; end: Date } {
  if (!isValidPeriod(period)) throw new Error(`Invalid period: ${period}`);
  const [y, m] = period.split("-").map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    start: new Date(`${y}-${pad(m)}-01T00:00:00+07:00`),
    end: new Date(`${ny}-${pad(nm)}-01T00:00:00+07:00`),
  };
}

/** "2026-02" -> "Feb-26" (same label as the printed statements). */
export function periodLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return `${MONTHS[m - 1]}-${String(y).slice(-2)}`;
}

/** The calendar month (Asia/Jakarta) that contains `date`, as "YYYY-MM". */
export function periodOf(date: Date): string {
  const jkt = new Date(date.getTime() + 7 * 3600 * 1000);
  return `${jkt.getUTCFullYear()}-${String(jkt.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function previousPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

/** "098" + "2026-02" -> "098-UPS.SOA/II/2026" */
export function statementNumber(customerCode: string, period: string): string {
  const [y, m] = period.split("-").map(Number);
  return `${customerCode}-UPS.SOA/${ROMAN[m - 1]}/${y}`;
}

// ---------- statement model ----------

export type SoaLine = {
  qty: number;
  unit: string;
  description: string;
  price: number; // unit price, IDR
  amount: number; // qty * price, IDR
};

export type SoaBlock = {
  no: number;
  quoteNo: string;
  quoteDate: string | null; // ISO
  poNo: string;
  poDate: string | null;
  doNo: string;
  doDate: string | null;
  invNo: string;
  invDate: string | null;
  lines: SoaLine[];
};

export type SoaStatementData = {
  customerId: number;
  customerCode: string;
  customerName: string;
  customerAddress: string;
  period: string;
  statementNumber: string;
  blocks: SoaBlock[];
  totalIdr: number;
  taxableIdr: number; // service lines only
  pph23Idr: number;
  netIdr: number;
};

/** Document references (quote / DO / invoice) that the Despact tables do not hold themselves. */
export type PoRefs = {
  quoteNo?: string;
  quoteDate?: Date | null;
  doNo?: string;
  doDate?: Date | null;
  invNo?: string;
  invDate?: Date | null;
};

export type ClosedItem = {
  itemId: number;
  despactId: number;
  registrationNumber: string; // the customer PO number
  poDate: Date;
  closedAt: Date;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const clean = (v: string | undefined | null) => {
  const s = (v ?? "").trim();
  return s === "-" ? "" : s;
};

export function computeTotals(blocks: SoaBlock[]) {
  let total = 0;
  let taxable = 0;
  for (const b of blocks) {
    for (const l of b.lines) {
      total += l.amount;
      if (!isGoodsLine(l.description)) taxable += l.amount;
    }
  }
  total = round2(total);
  taxable = round2(taxable);
  const pph23 = Math.round(taxable * PPH23_RATE); // withholding is booked in whole rupiah
  return { totalIdr: total, taxableIdr: taxable, pph23Idr: pph23, netIdr: round2(total - pph23) };
}

export function buildStatement(input: {
  customer: { id: number; code: string; name: string; address: string };
  period: string;
  items: ClosedItem[];
  refs: Map<string, PoRefs>; // key = registrationNumber
}): SoaStatementData {
  const { customer, period, items, refs } = input;

  // one block per despact (= one customer PO), in the order they were closed
  const byDespact = new Map<number, ClosedItem[]>();
  for (const it of items) {
    const list = byDespact.get(it.despactId) ?? [];
    list.push(it);
    byDespact.set(it.despactId, list);
  }
  const groups = [...byDespact.entries()]
    .map(([id, list]) => ({
      id,
      list: list.sort((a, b) => a.itemId - b.itemId),
      firstClosed: Math.min(...list.map((i) => i.closedAt.getTime())),
    }))
    .sort((a, b) => a.firstClosed - b.firstClosed || a.id - b.id);

  const blocks: SoaBlock[] = groups.map((g, idx) => {
    const head = g.list[0];
    const r = refs.get(head.registrationNumber) ?? {};
    return {
      no: idx + 1,
      quoteNo: clean(r.quoteNo),
      quoteDate: r.quoteDate ? r.quoteDate.toISOString() : null,
      poNo: head.registrationNumber,
      poDate: head.poDate.toISOString(),
      doNo: clean(r.doNo),
      doDate: r.doDate ? r.doDate.toISOString() : null,
      invNo: clean(r.invNo),
      invDate: r.invDate ? r.invDate.toISOString() : null,
      lines: g.list.map((i) => ({
        qty: i.qty,
        unit: i.unit.toUpperCase(),
        description: i.description,
        price: i.unitPrice,
        amount: round2(i.qty * i.unitPrice),
      })),
    };
  });

  return {
    customerId: customer.id,
    customerCode: customer.code,
    customerName: customer.name,
    customerAddress: customer.address,
    period,
    statementNumber: statementNumber(customer.code, period),
    blocks,
    ...computeTotals(blocks),
  };
}

/** Safe file name, e.g. "098-UPS.SOA-II-2026 PT BROAD FAR INDONESIA.xlsx" */
export function statementFileName(s: Pick<SoaStatementData, "statementNumber" | "customerName">) {
  const base = `${s.statementNumber} ${s.customerName}`.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();
  return `${base}.xlsx`;
}
