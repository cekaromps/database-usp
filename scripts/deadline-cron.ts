import cron from "node-cron";
import { checkDeadlinesAndNotify } from "../lib/checkDeadlines";
import { deleteExpiredDespacts } from "../lib/despact-cleanup";
import { syncRecentToDrive } from "../lib/soa-sync";

async function run() {
  console.log("[deadline-cron] Running deadline check...");
  try {
    await checkDeadlinesAndNotify();
    console.log("[deadline-cron] Done.");
  } catch (err) {
    console.error("[deadline-cron] Failed:", err);
  }
}

// Runs daily at 9:00 AM server time — adjust the cron string or add `timezone` if needed
cron.schedule("0 9 * * *", run, {
  timezone: "Asia/Jakarta", // 👈 set to whatever timezone makes sense for your users
});

console.log("[deadline-cron] Scheduled — runs daily at 9:00 AM Asia/Jakarta");

// For testing: `npx tsx scripts/deadline-cron.ts --now` runs it immediately too
if (process.argv.includes("--now")) {
  run();
}

// Daily 02:00: remove despacts that were fully closed more than 2 months ago
async function cleanup() {
  try {
    const n = await deleteExpiredDespacts();
    console.log(`[despact-cleanup] Deleted ${n} expired despact(s).`);
  } catch (err) {
    console.error("[despact-cleanup] Failed:", err);
  }
}

cron.schedule("0 2 * * *", cleanup, { timezone: "Asia/Jakarta" });
console.log("[despact-cleanup] Scheduled — runs daily at 2:00 AM Asia/Jakarta");

if (process.argv.includes("--now")) {
  cleanup();
}

// 01:00 on the 1st: freeze last month's SOA for every company (database + Drive folder
// Finance/SOA/<company>) BEFORE the 02:00 cleanup can purge the data. Re-checks the previous
// 3 months too, so a missed run heals itself.
cron.schedule(
  "0 1 1 * *",
  async () => {
    try {
      console.log("[soa] Synced:", await syncRecentToDrive(3));
    } catch (err) {
      console.error("[soa] Failed:", err);
    }
  },
  { timezone: "Asia/Jakarta" },
);
console.log("[soa] Scheduled — 1st of every month at 1:00 AM Asia/Jakarta");
