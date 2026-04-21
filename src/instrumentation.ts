export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Only register the cron job when running in a full Node.js environment (not Edge)
    const { startScraperCron } = await import("./lib/cron");
    startScraperCron();
  }
}
