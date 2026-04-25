import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";

// Vercel timeout — 60s fits: 10 items × ~2s link check (~20s) + AI (~15s) = ~35s
export const maxDuration = 60;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Gemini waterfall ─────────────────────────────────────────────────────────
async function callGeminiWithRetry(apiKey: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];

  for (const modelName of models) {
    try {
      console.log(`[SCRAPER] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      console.log(`[SCRAPER] Success with model: ${modelName}`);
      return result.response.text();
    } catch (err: any) {
      const skip = err.status === 503 || err.status === 429 || err.status === 404;
      console.warn(`[SCRAPER] Model ${modelName} failed (${err.status}): ${err.message}`);
      if (skip) continue;
      throw err;
    }
  }
  throw new Error("All AI models are currently unavailable. Please try again in a few minutes.");
}

// ── Strict link validator ────────────────────────────────────────────────────
async function validateLink(url: string): Promise<{ ok: boolean; reason: string }> {
  const BAD_PATTERNS = ["google.com/search", "google.co.in/search", "bing.com/search", "example.com", "placeholder"];
  for (const p of BAD_PATTERNS) {
    if (url.includes(p)) return { ok: false, reason: `Link is a search/placeholder URL (${p}).` };
  }
  if (!url.startsWith("http")) return { ok: false, reason: "Link is not an absolute URL." };

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
    return { ok: false, reason: `Link returned HTTP ${res.status} — broken or expired page.` };
  } catch (e: any) {
    // Timeout/network error — give benefit of doubt (site may block bots with HEAD)
    console.warn(`[SCRAPER] Link check inconclusive for ${url}: ${e.message}`);
    return { ok: true, reason: "" };
  }
}

export async function POST(req: Request) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const rateData = rateLimitMap.get(ip) || { count: 0, resetTime: now + 60000 };
    if (now > rateData.resetTime) { rateData.count = 0; rateData.resetTime = now + 60000; }
    if (rateData.count >= 5) {
      return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
    }
    rateData.count += 1;
    rateLimitMap.set(ip, rateData);

    // Auth check
    const cookieStore = await cookies();
    const token = cookieStore.get("secure_auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.user || (decoded.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Gemini API key not configured." }, { status: 500 });

    // Get existing titles to avoid duplicates
    let existingTitles: string[] = [];
    try {
      const body = await req.json();
      existingTitles = body.existingTitles || [];
    } catch (e) {}

    const exclusions =
      existingTitles.length > 0
        ? `\nEXCLUSION RULE: Do NOT return any of these already-listed opportunities: [${existingTitles
            .slice(0, 20).map((t) => `"${t}"`).join(", ")}]`
        : "";

    const todayStr = new Date().toISOString().split("T")[0];

    const prompt = `You are a strict data extractor for a student opportunity platform in India. Today is ${todayStr}.
${exclusions}

Generate a JSON array of EXACTLY 10 real student opportunities from India.

━━━ LINK RULES (CRITICAL — our server checks every link via HTTP) ━━━
IMPORTANT: Do NOT provide links to specific opportunity pages (those expire and return 404).
Instead, provide the HOMEPAGE or MAIN LISTING PAGE of the platform where students can find and apply.
These stable URLs always stay live:
   - Hackathons on Unstop   → https://unstop.com/hackathons
   - Internships on Unstop  → https://unstop.com/internships
   - Internshala            → https://internshala.com/internships
   - Devfolio hackathons    → https://devfolio.co/hackathons
   - HackerEarth challenges → https://www.hackerearth.com/challenges
   - Dare2Compete           → https://dare2compete.com/competitions
   - LinkedIn jobs          → https://www.linkedin.com/jobs
   - Skillenza              → https://skillenza.com
   - Townscript events      → https://www.townscript.com/in/events
   - Insider events         → https://insider.in
NEVER use: google.com, bing.com, example.com, or any deep/specific page URL.
The external_link should be where a student can GO to search for and apply to this opportunity.

━━━ DATE RULES ━━━
- "deadline" MUST be strictly after ${todayStr} (minimum 7 days from now).
- "event_date" MUST be on or after ${todayStr}.
- NEVER use past dates. Past-dated items are auto-rejected.

━━━ QUALITY ━━━
- auto_approve: true ONLY IF description is clear, location is real, AND external_link is a verified working URL.
- auto_approve: false if: link is empty/broken, dates are past, description is vague. Give a specific rejection_reason.

Return ONLY a raw JSON array. No markdown, no backticks, no explanation.

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
    console.log("[SCRAPER] Raw response length:", rawText.length);

    const startIndex = rawText.indexOf("[");
    const endIndex = rawText.lastIndexOf("]");
    if (startIndex === -1 || endIndex === -1) {
      console.error("[SCRAPER] No JSON array in response:", rawText.substring(0, 200));
      throw new Error("AI returned an unexpected format. Please try again.");
    }

    const parsedItems = JSON.parse(rawText.substring(startIndex, endIndex + 1));

    // ── Server-side validation ───────────────────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const items = await Promise.all(parsedItems.map(async (item: any) => {
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
          console.warn(`[SCRAPER] Bad link for "${item.title}": ${reason}`);
          flagged = true;
          flagReason = `Server: ${reason}`;
          item.external_link = "";
        } else {
          console.log(`[SCRAPER] Link OK: "${item.title}" → ${link}`);
        }
      } else {
        // No link — flag for manual review
        if (!flagged) {
          flagged = true;
          flagReason = "No working link provided — requires manual verification before publishing.";
        }
      }

      if (flagged) {
        console.warn(`[SCRAPER] Flagged: "${item.title}" — ${flagReason}`);
        item.auto_approve = false;
        item.rejection_reason = (item.rejection_reason && item.rejection_reason !== "")
          ? item.rejection_reason
          : flagReason;
      }

      return item;
    }));

    const approved = items.filter((i: any) => i.auto_approve === true).length;
    console.log(`[SCRAPER] ${approved}/${items.length} auto-approved with verified links.`);

    const dbItems = items.map((item: any) => {
      const { auto_approve, rejection_reason, ...rest } = item;
      return {
        ...rest,
        // AI-suggested items always start as "pending" — admin must approve before going public.
        // Items that failed server-side validation go straight to "rejected".
        status: auto_approve === true ? "pending" : "rejected",
        rejection_reason: auto_approve === true ? null : (rejection_reason || "Flagged by quality check"),
      };
    });

    const { data: insertedData, error: dbError } = await supabase.from("opportunities").insert(dbItems).select();
    if (dbError) {
      console.error("[SCRAPER] DB Insert Error:", dbError);
      return NextResponse.json({ error: "Data scraped, but failed to save to Database." }, { status: 500 });
    }

    return NextResponse.json({ items: insertedData || [] });
  } catch (error: any) {
    console.error("[SCRAPER] Fatal error:", error.message || error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error - failed to process request." },
      { status: 500 }
    );
  }
}
