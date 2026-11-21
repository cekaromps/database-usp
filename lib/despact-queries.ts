import { prisma } from "@/lib/prisma";
import type { DespactStatus } from "@/lib/despact-status";

export type DespactRow = {
  id: number;
  registrationNumber: string;
  quotationNumber: string | null;
  poNumber: string | null;
  customerName: string;
  attn: string;
  shortDescription: string;
  poDate: string;
  dueDate: string;
  totalIdr: number | null;
  items: {
    id: number;
    description: string;
    qty: number;
    unit: string;
    amountIdr: number | null;
    status: DespactStatus;
    doNumber: string | null;
    invoiceNumber: string | null;
    comments: {
      id: number;
      authorName: string;
      body: string;
      createdAt: string;
    }[];
  }[];
};

export async function getDespacts(
    {includePrices}: {includePrices : boolean},
): Promise<DespactRow[]> {
  const rows = await prisma.despact.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true } },
      items: { 
        orderBy: { id: "asc" },
        include: { comments: { orderBy: { createdAt: "asc"}}}
      },
    },
  });

  return rows.map((d) => ({
    id: d.id,
    registrationNumber: d.registrationNumber,
    quotationNumber: d.quotationNumber,
    poNumber: d.poNumber,
    customerName: d.customer.name,
    attn: d.attn,
    shortDescription: d.shortDescription,
    poDate: d.poDate.toISOString(),
    dueDate: d.dueDate.toISOString(),
    totalIdr: includePrices ? Number(d.totalIdr) : null,
    items: d.items.map((i) => ({
      id: i.id,
      description: i.description,
      qty: i.qty,
      unit: i.unit,
      amountIdr: includePrices ? Number(i.amountIdr) : null,
      status: i.status,
      doNumber: i.doNumber,
      invoiceNumber: i.invoiceNumber,
      comments: i.comments.map((c) => ({
        id: c.id,
        authorName: c.authorName,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
      })),
    })),
  }));
}