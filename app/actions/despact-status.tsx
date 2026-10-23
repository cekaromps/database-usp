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

async function changeStatus(
  itemId: number,
  to: DespactStatus,
  allowed: Record<DespactStatus, DespactStatus[]>,
) {
  if (!STATUS_VALUES.includes(to)) return "Status tidak valid.";

  const item = await prisma.despactItem.findUnique({ where: { id: itemId } });
  if (!item) return "Item tidak ditemukan.";
  if (!allowed[item.status].includes(to)) return "Perubahan status tidak diizinkan.";

  // old status in WHERE prevents two people overwriting each other
  const res = await prisma.despactItem.updateMany({
    where: { id: itemId, status: item.status },
    data: { status: to, closedAt: to === "CLOSE" ? new Date() : null },
  });
  if (res.count === 0) return "Status sudah berubah, silakan refresh.";

  revalidatePath("/dashboard/production/job-despact");
  revalidatePath("/dashboard/finance/job-despact");
}

export async function productionUpdateStatusAction(itemId: number, to: DespactStatus) {
  await assertSection("production");
  return changeStatus(itemId, to, PRODUCTION_NEXT);
}

export async function financeCloseItemAction(itemId: number) {
  await assertSection("finance");
  return changeStatus(itemId, "CLOSE", FINANCE_NEXT);
}