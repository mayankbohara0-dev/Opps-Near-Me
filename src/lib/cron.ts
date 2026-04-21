import cron from "node-cron";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const globalForCron = global as unknown as { __cronStarted: boolean };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callGeminiWithRetry(apiKey: string, prompt: string): Promise<string> {
  const models = ["gemini-flash-latest", "gemini-2.5-flash"];
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of models) {
    let delay = 5000;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err: any) {
        const isRetryable = err.status === 503 || err.status === 429;
        console.warn(`[CRON] ${modelName} attempt ${attempt} failed (${err.status})`);
        if (isRetryable && attempt < 3) {
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

    const prompt = `You are a quality-control data generator for a student opportunity platform in India.
${exclusions}

Generate a JSON array of exactly 5 student opportunities from diverse Indian cities (Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Pune, Remote, etc).

Include: 1 hackathon, 1 internship, 1 workshop/event, 1 sports/extra-curricular, 1 any category.

QUALITY CHECK (mandatory for every item):
- Set auto_approve to TRUE only if the opportunity has: a clear description, a real location or "Remote", AND at least one of (external_link OR contact_email) that students can actually use to apply.
- Set auto_approve to FALSE if: the opportunity is vague, has no way to apply/register, the event has already passed, or it seems fake/hallucinated. Write a specific 1-sentence rejection_reason explaining exactly why.

Return ONLY a raw JSON array — no markdown, no backticks, no explanation.

Each item MUST have these exact fields:
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
  "external_link": "URL or empty string",
  "event_date": "YYYY-MM-DD",
  "eligibility": "who can apply",
  "requirements": "what to bring or prepare",
  "what_offered": "prizes, stipend, certificates etc",
  "auto_approve": true or false,
  "rejection_reason": "empty string if auto_approve is true, else specific reason"
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
