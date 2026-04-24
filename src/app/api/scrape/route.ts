import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";
import google from "googlethis";

// Increase Vercel serverless function timeout to 60 seconds
export const maxDuration = 60;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Sleep helper
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Call Gemini with exponential backoff retries. Tries gemini-flash-latest then gemini-2.5-flash.
async function callGeminiWithRetry(apiKey: string, prompt: string): Promise<string> {
  const models = ["gemini-flash-latest", "gemini-2.5-flash"];
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of models) {
    let delay = 5000; // start with 5s backoff
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err: any) {
        const isRetryable = err.status === 503 || err.status === 429;
        console.warn(`[SCRAPER] ${modelName} attempt ${attempt} failed (${err.status}): ${err.message}`);
        if (isRetryable && attempt < 3) {
          console.warn(`[SCRAPER] Retrying ${modelName} in ${delay / 1000}s...`);
          await sleep(delay);
          delay *= 2; // exponential backoff
        } else if (!isRetryable) {
          // Not a retryable error (e.g. 404, 403) — skip this model entirely
          console.warn(`[SCRAPER] ${modelName} not usable (${err.status}), trying next model.`);
          break;
        }
      }
    }
  }

  throw new Error("All Gemini models failed after retries. The AI service is temporarily unavailable. Please try again in a few minutes.");
}

export async function POST(req: Request) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const rateData = rateLimitMap.get(ip) || { count: 0, resetTime: now + 60000 };
    if (now > rateData.resetTime) {
      rateData.count = 0;
      rateData.resetTime = now + 60000;
    }
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
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured." }, { status: 500 });
    }

    // Get existing titles to avoid duplicates
    let existingTitles: string[] = [];
    try {
      const body = await req.json();
      existingTitles = body.existingTitles || [];
    } catch (e) {}

    const exclusions =
      existingTitles.length > 0
        ? `\nEXCLUSION RULE: Do NOT return any of these already-found opportunities: [${existingTitles
            .slice(0, 20) // limit to avoid token bloat
            .map((t) => `"${t}"`)
            .join(", ")}]`
        : "";

    // Inject today's date so AI knows what "future" means
    const todayStr = new Date().toISOString().split("T")[0]; // e.g. "2026-04-14"    // Fetch real live internet data to ground the AI
    let webContext = "";
    let validLinks: string[] = [];
    
    try {
      const queries = [
        \`site:unstop.com/hackathons india student registration \${new Date().getFullYear()}\`,
        \`site:internshala.com/internships india student \${new Date().getFullYear()}\`, 
        \`site:linkedin.com/jobs/view/ student internship india OR entry-level \${new Date().getFullYear()}\`
      ];
      // Check different sources randomly to ensure variety across scrape runs
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      console.log("[SCRAPER] Searching for real opportunities with query:", randomQuery);
      
      const searchRes = await google.search(randomQuery, {
        page: 0,
        safe: false,
        parse_ads: false
      });
      
      const resultsToUse = searchRes.results.slice(0, 15);
      validLinks = resultsToUse.map((r: any) => r.url);
      
      const topResults = resultsToUse.map((r: any) => \`- Title: \${r.title}\\n  Description: \${r.description}\\n  Link: \${r.url}\`).join("\\n\\n");
      const topResults = resultsToUse.map((r: any) => `- Title: ${r.title}\n  Description: ${r.description}\n  Link: ${r.url}`).join("\n\n");
      
      if (topResults) {
        webContext = `\nREAL LIVE WEB SEARCH RESULTS:\nHere are real opportunities recently indexed on the web. You MUST ONLY extract opportunities strictly from these search results. DO NOT invent or hallucinate any opportunities. Use the EXACT Link provided in these results.\n\n${topResults}\n`;
      }
    } catch (err: any) {
      console.warn("[SCRAPER] Web search failed, falling back to pure generative.", err.message);
    }    // Lean, token-efficient prompt with proper quality assessment
    const prompt = `You are a strict data extractor for a student opportunity platform in India.
Today's date is ${todayStr}.
${exclusions}${webContext}

Generate a JSON array of student opportunities. YOU MUST ONLY EXTRACT OPPORTUNITIES FROM THE "REAL LIVE WEB SEARCH RESULTS" PROVIDED ABOVE.
DO NOT INVENT, GUESS, OR HALLUCINATE ANY OPPORTUNITIES. If there are only 5 valid results above, return exactly 5 items. 
If web search results are missing, you may generate a maximum of 3 highly-known, verified annual opportunities, but ONLY if you are absolutely certain the exact URL is correct.

DATE RULES (CRITICAL — strictly enforce):
- "deadline" MUST be a future date STRICTLY AFTER ${todayStr}. Minimum deadline: at least 7 days from today.
- "event_date" MUST also be on or after today (${todayStr}). Never use past dates.
- Do NOT generate any opportunity whose event or deadline has already passed. Ensure dates match any data found in the real web search results.
- If the search results mention a year in the past (e.g. 2023, 2024, 2025), DO NOT invent a future 2026 deadline for it. You MUST set auto_approve to FALSE and state that it is an old event.

QUALITY CHECK (mandatory for every item):
- The 'external_link' rule is STRICT. You MUST EXACTLY COPY the "Link" from the search results provided. NEVER invent a link. Do NOT use a Google search format. If a link does not start with https://, leave it empty.
- Set auto_approve to TRUE only if the opportunity has: a clear description, a real location or "Remote", AND the external_link is fully valid. Do not use generic homepages if a specific application page exists.
- Set auto_approve to FALSE if: the opportunity is vague, has no way to apply/register, the deadline/event is in the past, it seems fake, or it is from a previous year. Write a specific 1-sentence rejection_reason explaining exactly why.

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
  "external_link": "Valid absolute URL starting with https:// directly to registration, or empty string",
  "event_date": "YYYY-MM-DD",
  "eligibility": "who can apply",
  "requirements": "what to bring or prepare",
  "what_offered": "prizes, stipend, certificates etc",
  "auto_approve": true or false,
  "rejection_reason": "empty string if auto_approve is true, else specific reason"
}`;

    // Call Gemini with retry + fallback
    const rawText = await callGeminiWithRetry(apiKey, prompt);
    console.log("[SCRAPER] Raw response length:", rawText.length);

    // Extract JSON array robustly
    const startIndex = rawText.indexOf("[");
    const endIndex = rawText.lastIndexOf("]");

    if (startIndex === -1 || endIndex === -1) {
      console.error("[SCRAPER] No JSON array found in response:", rawText);
      throw new Error("AI returned an unexpected format. Please try again.");
    }

    const parsedItems = JSON.parse(rawText.substring(startIndex, endIndex + 1));

    // ── Hard server-side filter: Mark expired or hallucinated items as auto_approve=false ──
    const today = new Date();
    today.setHours(0, 0, 0, 0); // compare date only, ignore time
    
    const items = parsedItems.map((item: any) => {
      // Create a safety net incase AI forces auto_approve on expired
      let isExpired = false;
      let expiredReason = "";

      if (!item.deadline) {
        isExpired = true;
        expiredReason = "Missing deadline.";
      } else {
        const deadlineDate = new Date(item.deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        if (deadlineDate < today) {
          isExpired = true;
          expiredReason = `Server Check: Deadline (${item.deadline}) is in the past.`;
        }
      }

      if (!isExpired && item.event_date) {
        const eventDate = new Date(item.event_date);
        eventDate.setHours(0, 0, 0, 0);
        if (eventDate < today) {
          isExpired = true;
          expiredReason = `Server Check: Event date (${item.event_date}) is in the past.`;
        }
      }

      // Hard server-side link validation
      if (item.external_link && validLinks.length > 0) {
        const isRealLink = validLinks.some(valid => valid.includes(item.external_link) || item.external_link.includes(valid));
        if (!isRealLink && !item.external_link.includes("unstop.com") && !item.external_link.includes("internshala.com")) {
          isExpired = true; // reusing expired logic for rejection
          expiredReason = `Server Check: Generated link is hallucinated and not from search results.`;
          item.external_link = ""; // Clear fake link
        }
      }

      if (isExpired) {
        console.warn(`[SCRAPER] Flagged invalid/outdated item: "${item.title}"`);
        item.auto_approve = false;
        item.rejection_reason = item.rejection_reason && item.rejection_reason !== "" 
          ? item.rejection_reason 
          : expiredReason;
      }
      return item;
    });

    console.log(`[SCRAPER] ${items.length}/${parsedItems.length} items passed the date filter.`);
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[SCRAPER] Fatal error:", error.message || error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error - failed to process request." },
      { status: 500 }
    );
  }
}
