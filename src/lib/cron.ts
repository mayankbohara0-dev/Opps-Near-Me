import cron from "node-cron";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const globalForCron = global as unknown as { __cronStarted: boolean };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callGeminiWithRetry(apiKey: string, prompt: string): Promise<string> {
  // Only confirmed-valid model IDs — gemini-flash-latest/gemini-1.5-flash are deprecated/not found
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of models) {
    let delay = 5000;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[CRON] Trying model: ${modelName} (attempt ${attempt})`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        console.log(`[CRON] Success with model: ${modelName}`);
        return result.response.text();
      } catch (err: any) {
        const isRetryable = err.status === 503 || err.status === 429;
        const isNotFound  = err.status === 404;
        console.warn(`[CRON] ${modelName} attempt ${attempt} failed (${err.status})`);
        if (isNotFound) {
          // Model not available in this API version — skip immediately
          break;
        } else if (isRetryable && attempt < 3) {
          console.warn(`[CRON] Retrying in ${delay / 1000}s...`);
          await sleep(delay);
          delay *= 2;
        } else if (!isRetryable) {
          console.warn(`[CRON] ${modelName} not usable (${err.status}), trying next model.`);
          break;
        }
      }
    }
  }

  throw new Error("All Gemini models failed after retries.");
}

export function startScraperCron() {
  if (globalForCron.__cronStarted) return;
  globalForCron.__cronStarted = true;

  console.log("🚀 Starting AI Scraper Cron Job (runs every 4 hours)...");

  cron.schedule("0 */4 * * *", async () => {
    console.log("[CRON] 🌐 Triggering automated AI Scraping cycle...");
    try {
      await runScrapingTask();
    } catch (e) {
      console.error("[CRON] ❌ AI Scraping cycle failed:", e);
    }
  });
}

async function runScrapingTask() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[CRON] ⚠️ Gemini API key missing. Scraper aborted.");
    return;
  }

  try {
    // Fetch existing titles to avoid duplicates
    const { data: existingOpps, error: dbError } = await supabase
      .from("opportunities")
      .select("title");

    if (dbError) {
      console.error("[CRON] ❌ Supabase fetch error:", dbError);
      return;
    }

    const existingTitles = existingOpps ? existingOpps.map((o) => o.title) : [];
    const exclusions =
      existingTitles.length > 0
        ? `\nEXCLUSION RULE: Do NOT return any of these: [${existingTitles
            .slice(0, 20)
            .map((t) => `"${t}"`)
            .join(", ")}]`
        : "";

    const todayStr = new Date().toISOString().split("T")[0];

    const prompt = `You are a strict data generator for a student opportunity platform in India. Today is ${todayStr}.
${exclusions}

Generate a JSON array of EXACTLY 10 real student opportunities from diverse Indian cities (Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Pune, Remote, etc).
Include: 3 hackathons, 3 internships, 2 events/workshops, 2 sports/extra-curricular.

━━━ LINK RULES (CRITICAL) ━━━
1. ONLY provide links from these trusted platforms with REAL, LIVE pages:
   - unstop.com       → e.g. https://unstop.com/hackathons/name-organizer-123456
   - internshala.com  → e.g. https://internshala.com/internship/detail/name-at-company-city
   - devfolio.co      → e.g. https://xyz-hackathon.devfolio.co
   - dare2compete.com → e.g. https://dare2compete.com/competition/name-123
   - hackerearth.com  → e.g. https://www.hackerearth.com/challenges/hackathon/name
   - linkedin.com     → e.g. https://www.linkedin.com/jobs/view/1234567890
   - skillenza.com, townscript.com, insider.in (for events)
2. NEVER use: homepage-only URLs, google.com, bing.com, example.com, or guessed URLs.
3. If NOT 100% certain a page is LIVE → use "" (empty string). Empty is better than wrong.

━━━ DATE RULES ━━━
- "deadline" MUST be strictly after ${todayStr} (at least 7 days).
- "event_date" MUST be on or after ${todayStr}.
- NEVER use past dates.

━━━ QUALITY ━━━
- auto_approve: true ONLY IF clear description, real location, AND verified live external_link.
- auto_approve: false if link empty/broken, dates past, or vague. Give specific rejection_reason.

Return ONLY a raw JSON array. No markdown, no backticks.

Each item MUST have EXACTLY these fields:
{
  "title": "string",
  "description": "2-3 sentence overview",
  "category": "hackathon" | "sports" | "internship" | "event",
  "organizer_name": "string",
  "location_city": "string",
  "location_area": "string",
  "deadline": "YYYY-MM-DD",
  "contact_email": "string or empty string",
  "contact_phone": "string or empty string",
  "external_link": "Verified live URL from trusted platform, or empty string if unsure",
  "event_date": "YYYY-MM-DD",
  "eligibility": "who can apply",
  "requirements": "what to bring or prepare",
  "what_offered": "prizes, stipend, certificates etc",
  "auto_approve": true or false,
  "rejection_reason": "empty string if auto_approve true, else specific 1-sentence reason"
}`;

    const rawText = await callGeminiWithRetry(apiKey, prompt);

    const startIndex = rawText.indexOf("[");
    const endIndex = rawText.lastIndexOf("]");

    if (startIndex === -1 || endIndex === -1) {
      console.error("[CRON] ❌ No JSON array found in response.");
      return;
    }

    const items = JSON.parse(rawText.substring(startIndex, endIndex + 1));

    const dbItems = items.map((item: any) => {
      const { auto_approve, rejection_reason, ...rest } = item;
      return {
        ...rest,
        status: auto_approve === true ? "active" : "rejected",
        rejection_reason:
          auto_approve === true ? null : rejection_reason || "Flagged by AI quality check",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    const { error: insertError } = await supabase.from("opportunities").insert(dbItems);
    if (insertError) {
      console.error("[CRON] ❌ Supabase insert error:", insertError);
    } else {
      console.log(`[CRON] ✅ Auto-scraped and inserted ${dbItems.length} new opportunities.`);
    }
  } catch (error: any) {
    console.error("[CRON] ❌ Unexpected Error:", error.message || error);
  }
}
