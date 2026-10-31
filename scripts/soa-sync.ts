import "dotenv/config";
import { syncPeriodToDrive, syncRecentToDrive } from "../lib/soa-sync";
import { isValidPeriod } from "../lib/soa-core";

// npx tsx scripts/soa-sync.ts                 -> last 3 completed months
// npx tsx scripts/soa-sync.ts 2026-01 2026-02 -> specific months (backfill)
async function main() {
  const periods = process.argv.slice(2).filter(isValidPeriod);
  if (periods.length === 0) {
    console.log(await syncRecentToDrive(3));
  } else {
    for (const p of periods) console.log(p, await syncPeriodToDrive(p));
  }
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
