import fs from "fs";
import path from "path";
import { customerIdsForPeriod, getStatement } from "@/lib/soa";
import { buildSoaWorkbook } from "@/lib/soa-xlsx";
import { writeStatementFile } from "@/lib/soa-files";
import { periodOf, previousPeriod } from "@/lib/soa-core";

function loadLogo(): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), "public", "ups.png"));
  } catch {
    return null;
  }
}

/**
 * Saves every company's SOA for `period` to the database AND into the Drive at
 * Finance/SOA/<company>/ (shown on /dashboard/finance/soa).
 * `refresh` rebuilds from current data and overwrites the saved copy and the file.
 */
export async function syncPeriodToDrive(
  period: string,
  opts: { refresh?: boolean; createdBy?: string } = {},
): Promise<{ written: number; skipped: number }> {
  const logo = loadLogo();
  const createdBy = opts.createdBy || process.env.SOA_CREATED_BY || "FINANCE";
  let written = 0;
  let skipped = 0;
  for (const id of await customerIdsForPeriod(period)) {
    const s = await getStatement(id, period, { refresh: opts.refresh }); // creates the snapshot if missing
    if (!s) continue;
    const res = writeStatementFile(s, await buildSoaWorkbook(s, { createdBy, logo }), { overwrite: opts.refresh });
    if (res === "written") written++;
    else skipped++;
  }
  return { written, skipped };
}

/** The last `months` COMPLETED months (the current, still-open month is never synced). */
export function recentClosedPeriods(months = 3, now = new Date()): string[] {
  const out: string[] = [];
  let p = previousPeriod(periodOf(now));
  for (let i = 0; i < months; i++) {
    out.push(p);
    p = previousPeriod(p);
  }
  return out;
}

export async function syncRecentToDrive(months = 3) {
  const result: Record<string, { written: number; skipped: number }> = {};
  for (const p of recentClosedPeriods(months)) result[p] = await syncPeriodToDrive(p);
  return result;
}
