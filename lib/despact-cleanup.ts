import { prisma } from "./prisma";

export const DESPACT_RETENTION_MONTHS = 2;

/**
 * Deletes every Despact (its items and comments cascade) whose items are ALL closed
 * and whose newest close date is older than the retention period.
 * Unfinished POs are never touched, no matter how old.
 */
export async function deleteExpiredDespacts(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - DESPACT_RETENTION_MONTHS);

  const res = await prisma.despact.deleteMany({
    where: {
      items: {
        some: {},
        every: { status: "CLOSE", closedAt: { not: null, lt: cutoff } },
      },
    },
  });
  return res.count;
}
