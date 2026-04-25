// node-cron does NOT work on Vercel serverless — the process is not persistent.
// Scheduling is handled entirely by Vercel Cron Jobs configured in vercel.json:
//   - /api/cron-scrape  runs daily at midnight UTC   (0 0 * * *)
//   - /api/cron-digest  runs weekly on Sundays 8am   (0 8 * * 0)
// This file intentionally left empty to avoid importing node-cron.
export async function register() {
  // No-op: cron scheduling is done via vercel.json, not in-process.
}
