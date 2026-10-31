import fs from "fs";
import path from "path";
import { statementFileName, type SoaStatementData } from "@/lib/soa-core";

/** Same root the Drive API uses (app/api/drive/*): set LOCAL_DRIVE_STORAGE to an ABSOLUTE path. */
export function driveRoot() {
  return path.resolve(process.env.LOCAL_DRIVE_STORAGE || "./drive_storage");
}

/** Drive path shown on /dashboard/finance/soa. First folder is "Finance" so the Drive's permission check applies. */
export const SOA_DRIVE_ROOT = "Finance/SOA";

const safeName = (s: string) =>
  s.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").replace(/^\.+/, "").trim() || "UNKNOWN";

/** Finance/SOA/<COMPANY NAME> : one folder per company. */
export function companyFolder(customerName: string) {
  return path.join(driveRoot(), "Finance", "SOA", safeName(customerName));
}

/** "2026-02 098-UPS.SOA-II-2026 PT BROAD FAR INDONESIA.xlsx": the period prefix keeps a company's files in date order. */
export function driveFileName(s: Pick<SoaStatementData, "period" | "statementNumber" | "customerName">) {
  return `${s.period} ${statementFileName(s)}`;
}

/**
 * Writes the statement into Finance/SOA/<company>/ unless that file already exists.
 * Written to a temp file then renamed, so nobody can open a half-written Excel file.
 * `overwrite` replaces an existing file.
 */
export function writeStatementFile(
  s: SoaStatementData,
  buf: Buffer,
  opts: { overwrite?: boolean } = {},
): "written" | "exists" {
  const dir = companyFolder(s.customerName);
  const target = path.join(dir, driveFileName(s));
  if (!opts.overwrite && fs.existsSync(target)) return "exists";
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, target);
  return "written";
}
