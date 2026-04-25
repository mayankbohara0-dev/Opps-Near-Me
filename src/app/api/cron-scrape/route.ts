import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";

export const maxDuration = 60;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Gemini waterfall ─────────────────────────────────────────────────────────
async function callGeminiWithRetry(apiKey: string, prompt: string): Promise<string> {
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
        console.warn(`[CRON] ${modelName} attempt ${attempt} failed (${err.status}): ${err.message}`);
        if (isNotFound) {
          break; // skip to next model
        } else if (isRetryable && attempt < 3) {
          console.warn(`[CRON] Retrying ${modelName} in ${delay / 1000}s...`);
          await sleep(delay);
          delay *= 2;
        } else if (!isRetryable) {
          break;
        }
      }
    }
  }
  throw new Error("All Gemini models failed after retries.");
}

// ── Strict link validator ─────────────────────────────────────────────────────
async function validateLink(url: string): Promise<{ ok: boolean; reason: string }> {
  const BAD_PATTERNS = ["google.com/search", "google.co.in/search", "bing.com/search", "example.com", "placeholder"];
  for (const p of BAD_PATTERNS) {
    if (url.includes(p)) return { ok: false, reason: `Search/placeholder URL detected (${p}).` };
  }
  if (!url.startsWith("http")) return { ok: false, reason: "Not an absolute URL." };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OppsBot/1.0)" },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);
    if (res.status >= 200 && res.status < 400) return { ok: true, reason: "" };
    return { ok: false, reason: `HTTP ${res.status} — broken or expired page.` };
  } catch (e: any) {
    console.warn(`[CRON] Link check inconclusive for ${url}: ${e.message}`);
    return { ok: true, reason: "" }; // benefit of doubt on timeout
  }
}

export async function GET(req: Request) {
  try {
    // 1. Verify Vercel Cron Security
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured." }, { status: 500 });
    }

    // 2. Fetch existing titles from DB to avoid duplicates
    const { data: existingData } = await supabase
      .from("opportunities")
      .select("title")
      .order("created_at", { ascending: false })
      .limit(50);
    const existingTitles = existingData ? existingData.map((o: any) => o.title) : [];

    const exclusions =
      existingTitles.length > 0
        ? `\nEXCLUSION RULE: Do NOT return any of these already-listed opportunities: [${existingTitles
            .slice(0, 20).map((t: string) => `"${t}"`).join(", ")}]`
        : "";

    const todayStr = new Date().toISOString().split("T")[0];

    // 3. Prompt
    const prompt = `You are a strict data generator for a student opportunity platform in India. Today is ${todayStr}.
${exclusions}

Generate a JSON array of EXACTLY 20 real student opportunities from India.
Mix of categories: at least 6 hackathons, 6 internships, 4 events/workshops, 4 sports/other.

━━━ LINK RULES (CRITICAL — our server checks every link via HTTP) ━━━
1. ONLY provide links from these trusted platforms with REAL, LIVE pages:
   - unstop.com       → e.g. https://unstop.com/hackathons/name-organizer-123456
   - internshala.com  → e.g. https://internshala.com/internship/detail/name-at-company-city
   - devfolio.co      → e.g. https://xyz-hackathon.devfolio.co
   - dare2compete.com → e.g. https://dare2compete.com/competition/name-123
   - hackerearth.com  → e.g. https://www.hackerearth.com/challenges/hackathon/name
   - linkedin.com     → e.g. https://www.linkedin.com/jobs/view/1234567890
   - skillenza.com, townscript.com, insider.in (for events)
2. NEVER use: homepage-only URLs, google.com, bing.com, example.com, guessed/fabricated URLs.
3. If you are NOT 100% certain a specific page is LIVE today → use "" (empty string).
4. A wrong URL causes automatic rejection. An empty URL goes to pending review. Empty is better than wrong.

━━━ DATE RULES ━━━
- "deadline" MUST be strictly after ${todayStr} (at least 7 days from now).
- "event_date" MUST be on or after ${todayStr}.
- NEVER use past dates. Past-dated items are auto-rejected.
- If an opportunity is from a previous year, set auto_approve to false.

━━━ QUALITY ━━━
- auto_approve: true ONLY IF description is clear, real location/Remote, AND external_link is a verified live URL.
- auto_approve: false if link is empty/broken, dates are past, or description is vague. Provide a specific rejection_reason.

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
      throw new Error("AI returned an unexpected format.");
    }

    const parsedItems = JSON.parse(rawText.substring(startIndex, endIndex + 1));

    // 4. Server-side validation (dates + strict link checks)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validatedItems = await Promise.all(parsedItems.map(async (item: any) => {
      let flagged = false;
      let flagReason = "";

      // Date checks
      if (!item.deadline) {
        flagged = true; flagReason = "Missing deadline.";
      } else {
        const d = new Date(item.deadline);
        d.setHours(0, 0, 0, 0);
        if (d < today) { flagged = true; flagReason = `Server: Deadline (${item.deadline}) is in the past.`; }
      }

      if (!flagged && item.event_date) {
        const e = new Date(item.event_date);
        e.setHours(0, 0, 0, 0);
        if (e < today) { flagged = true; flagReason = `Server: Event date (${item.event_date}) is in the past.`; }
      }

      // Strict link validation
      const link = (item.external_link || "").trim();
      if (link !== "") {
        const { ok, reason } = await validateLink(link);
        if (!ok) {
          console.warn(`[CRON] Bad link for "${item.title}": ${reason}`);
          flagged = true;
          flagReason = `Server: ${reason}`;
          item.external_link = "";
        } else {
          console.log(`[CRON] Link OK: "${item.title}" → ${link}`);
        }
      } else {
        if (!flagged) {
          flagged = true;
          flagReason = "No working link provided — requires manual verification.";
        }
      }

      if (flagged) {
        item.auto_approve = false;
        item.rejection_reason = (item.rejection_reason && item.rejection_reason !== "")
          ? item.rejection_reason
          : flagReason;
      }

      return item;
    }));

    const approved = validatedItems.filter((i: any) => i.auto_approve === true).length;
    console.log(`[CRON] ${approved}/${validatedItems.length} auto-approved with verified links.`);

    // 5. Format for DB
    const dbItems = validatedItems.map((item: any) => {
      const { auto_approve, rejection_reason, ...rest } = item;
      return {
        ...rest,
        status: auto_approve === true ? "active" : "rejected",
        rejection_reason: auto_approve === true ? null : (item.rejection_reason || "Flagged by quality check"),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    // 6. Insert into Supabase
    const { error } = await supabase.from("opportunities").insert(dbItems);
    if (error) {
      console.error("[CRON] Supabase insert error:", error);
      throw error;
    }

    console.log(`[CRON] Successfully inserted ${dbItems.length} items to database.`);
    return NextResponse.json({ success: true, count: dbItems.length, approved });

  } catch (error: any) {
    console.error("[CRON] Fatal error:", error.message || error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
