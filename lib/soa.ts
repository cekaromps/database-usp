import { prisma } from "@/lib/prisma";
import {
  buildStatement,
  periodRange,
  type ClosedItem,
  type PoRefs,
  type SoaStatementData,
} from "@/lib/soa-core";

/** Quote / DO / invoice numbers are not stored on Despact, so look them up by PO number. */
async function lookupRefs(poNumbers: string[]): Promise<Map<string, PoRefs>> {
  const refs = new Map<string, PoRefs>();
  if (poNumbers.length === 0) return refs;

  const recs = await prisma.invoiceRecord.findMany({
    where: { noPo: { in: poNumbers } },
    orderBy: { createdAt: "asc" },
  });
  for (const r of recs) {
    const cur = refs.get(r.noPo) ?? {};
    refs.set(r.noPo, {
      quoteNo: cur.quoteNo || r.quotationNumber,
      doNo: cur.doNo || r.noDo,
      invNo: cur.invNo || r.noInv,
      // InvoiceRecord only keeps one date (delivery); DO and invoice share it
      doDate: cur.doDate ?? r.dateDelivery,
      invDate: cur.invDate ?? r.dateDelivery,
    });
  }

  const quoteNos = [...new Set([...refs.values()].map((r) => r.quoteNo).filter((q): q is string => !!q && q !== "-"))];
  if (quoteNos.length) {
    const quotes = await prisma.invoice.findMany({
      where: { quotationNumber: { in: quoteNos } },
      select: { quotationNumber: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    const dateByQuote = new Map<string, Date>();
    for (const q of quotes) if (!dateByQuote.has(q.quotationNumber)) dateByQuote.set(q.quotationNumber, q.createdAt);
    for (const r of refs.values()) if (r.quoteNo) r.quoteDate = dateByQuote.get(r.quoteNo) ?? null;
  }
  return refs;
}

/** Build a statement from live data: items finance closed during `period`. */
export async function buildLiveStatement(customerId: number, period: string): Promise<SoaStatementData | null> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return null;
  const { start, end } = periodRange(period);

  const rows = await prisma.despactItem.findMany({
    where: { status: "CLOSE", closedAt: { gte: start, lt: end }, despact: { customerId } },
    include: { despact: true },
    orderBy: { id: "asc" },
  });
  if (rows.length === 0) return null;

  const items: ClosedItem[] = rows.map((r) => ({
    itemId: r.id,
    despactId: r.despactId,
    registrationNumber: r.despact.registrationNumber,
    poDate: r.despact.poDate,
    closedAt: r.closedAt!,
    description: r.description,
    qty: r.qty,
    unit: r.unit,
    unitPrice: Number(r.amountIdr),
  }));
  const refs = await lookupRefs([...new Set(items.map((i) => i.registrationNumber))]);
  return buildStatement({ customer, period, items, refs });
}

/**
 * Returns the saved statement if there is one, otherwise builds it from live data and saves it.
 * `refresh` rebuilds from live data and overwrites the saved copy (only safe while the month's
 * despacts have not been purged yet).
 */
export async function getStatement(
  customerId: number,
  period: string,
  opts: { refresh?: boolean } = {},
): Promise<SoaStatementData | null> {
  if (!opts.refresh) {
    const saved = await prisma.soaStatement.findUnique({
      where: { customerId_period: { customerId, period } },
    });
    if (saved) return saved.payload as unknown as SoaStatementData;
  }
  const live = await buildLiveStatement(customerId, period);
  if (!live) return null;
  const data = {
    statementNumber: live.statementNumber,
    payload: live as unknown as object,
    totalIdr: live.totalIdr,
    netIdr: live.netIdr,
    generatedAt: new Date(),
  };
  await prisma.soaStatement.upsert({
    where: { customerId_period: { customerId, period } },
    create: { customerId, period, ...data },
    update: data,
  });
  return live;
}

/** Every customer that has closed items in the period, or an already saved statement for it. */
export async function customerIdsForPeriod(period: string): Promise<number[]> {
  const { start, end } = periodRange(period);
  const [live, saved] = await Promise.all([
    prisma.despact.findMany({
      where: { items: { some: { status: "CLOSE", closedAt: { gte: start, lt: end } } } },
      select: { customerId: true },
      distinct: ["customerId"],
    }),
    prisma.soaStatement.findMany({ where: { period }, select: { customerId: true } }),
  ]);
  return [...new Set([...live, ...saved].map((x) => x.customerId))];
}

/** Used by the monthly cron: save last month's SOA for every customer (never overwrites). */
export async function generateAllForPeriod(period: string): Promise<number> {
  const ids = await customerIdsForPeriod(period);
  let n = 0;
  for (const id of ids) if (await getStatement(id, period)) n++;
  return n;
}
