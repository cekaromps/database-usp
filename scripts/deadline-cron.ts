import cron from "node-cron";
import { checkDeadlinesAndNotify } from "../lib/checkDeadlines";

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
