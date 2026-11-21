"use server";

import { assertSection } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  PRODUCTION_NEXT,
  FINANCE_NEXT,
  STATUS_VALUES,
  type DespactStatus,
} from "@/lib/despact-status";

const MAX_REF_LENGTH = 50;

/** Trim a reference number; "" when it is empty or just "-". */
function cleanRef(v: unknown): string {
  const s = String(v ?? "").trim();
  return s === "-" ? "" : s;
}

/** Validate a required reference number; returns the cleaned value or an error message. */
function requireRef(v: unknown, label: string, when: string): { value: string } | { error: string } {
  const value = cleanRef(v);
  if (!value) return { error: `Nomor ${label} wajib diisi untuk ${when}.` };
  if (value.length > MAX_REF_LENGTH) {
    return { error: `Nomor ${label} maksimal ${MAX_REF_LENGTH} karakter.` };
  }
  return { value };
}

type Refs = { doNumber?: string; invoiceNumber?: string };

async function changeStatus(
  itemId: number,
  to: DespactStatus,
  allowed: Record<DespactStatus, DespactStatus[]>,
  refs: Refs = {},
) {
  if (!STATUS_VALUES.includes(to)) return "Status tidak valid.";

  const item = await prisma.despactItem.findUnique({ where: { id: itemId } });
  if (!item) return "Item tidak ditemukan.";
  if (!allowed[item.status].includes(to)) return "Perubahan status tidak diizinkan.";

  // old status in WHERE prevents two people overwriting each other
  const res = await prisma.despactItem.updateMany({
    where: { id: itemId, status: item.status },
    data: {
      status: to,
      closedAt: to === "CLOSE" ? new Date() : null,
      // each step records the reference number it asked for
      ...(to === "READY_DELIVERY" ? { doNumber: refs.doNumber } : {}),
      ...(to === "CLOSE" ? { invoiceNumber: refs.invoiceNumber } : {}),
    },
  });
  if (res.count === 0) return "Status sudah berubah, silakan refresh.";

  revalidatePath("/dashboard/production/job-despact");
  revalidatePath("/dashboard/finance/job-despact");
  revalidatePath("/dashboard/finance/job-despact-list");
}

/** Production steps. Moving an item to Ready Delivery needs its DO number (`ref`). */
export async function productionUpdateStatusAction(
  itemId: number,
  to: DespactStatus,
  ref?: string,
) {
  await assertSection("production");

  const refs: Refs = {};
  if (to === "READY_DELIVERY") {
    const r = requireRef(ref, "DO", "Ready Delivery");
    if ("error" in r) return r.error;
    refs.doNumber = r.value;
  }

  return changeStatus(itemId, to, PRODUCTION_NEXT, refs);
}

/** Finance closes an item with its invoice number. */
export async function financeCloseItemAction(itemId: number, invoiceNumber: string) {
  await assertSection("finance");

  const r = requireRef(invoiceNumber, "Invoice", "menutup item");
  if ("error" in r) return r.error;

  return changeStatus(itemId, "CLOSE", FINANCE_NEXT, { invoiceNumber: r.value });
}
