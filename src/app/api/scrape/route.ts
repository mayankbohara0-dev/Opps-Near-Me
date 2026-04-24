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

// Call Gemini with extreme speed optimizations and instant robust fallback
async function callGeminiWithRetry(apiKey: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // A waterfall of models from fastest/newest to most reliable older versions
  const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash", "gemini-pro"];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      const isOverloaded = err.status === 503 || err.status === 429;
      console.warn(`[SCRAPER] Model ${modelName} failed (${err.status}): ${err.message}`);
      
      if (isOverloaded) {
        // If 503/429, instantly try the next model in the list without wasting time sleeping!
        console.warn(`[SCRAPER] Instantly falling back to next available model...`);
        continue;
      } else {
        // If it's a hard error (like 403 Forbidden/Auth), throw it entirely.
        throw err;
      }
    }
  }

  throw new Error("All AI models are currently overloaded. Please try again in a few minutes.");
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
        `site:unstop.com/hackathons india student registration ${new Date().getFullYear()}`,
        `site:internshala.com/internships india student ${new Date().getFullYear()}`, 
        `site:linkedin.com/jobs/view/ student internship india OR entry-level ${new Date().getFullYear()}`
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
      
      const topResults = resultsToUse.map((r: any) => `- Title: ${r.title}\n  Description: ${r.description}\n  Link: ${r.url}`).join("\n\n");
      
      if (topResults) {
        webContext = `\nREAL LIVE WEB SEARCH RESULTS:\nHere are real opportunities recently indexed on the web. You MUST ONLY extract opportunities strictly from these search results. DO NOT invent or hallucinate any opportunities. Use the EXACT Link provided in these results.\n\n${topResults}\n`;
      }
    } catch (err: any) {
      console.warn("[SCRAPER] Web search failed, falling back to pure generative.", err.message);
    }    // Lean, hyper-token-efficient prompt to guarantee < 5s generation time and prevent Vercel 10s timeout
    const prompt = `You are a strict data extractor for a student opportunity platform in India. Today is ${todayStr}.
${exclusions}${webContext}

Generate a JSON array of student opportunities. YOU MUST ONLY EXTRACT OPPORTUNITIES FROM THE "REAL LIVE WEB SEARCH RESULTS". DO NOT INVENT ANY.
If there are valid results, return EXACTLY 3 items (to stay under strict execution time limits). If fewer are valid, return fewer.

CRITICAL RULES:
- "deadline" MUST be a future date STRICTLY AFTER ${todayStr}.
- "event_date" MUST be on or after today (${todayStr}).
- If search results mention a past year, you MUST set auto_approve to FALSE and state it is old.
- "external_link" MUST be EXACTLY copied from the search results provided. Do not invent links.

Return ONLY a raw JSON array.
To save generation time, keep descriptions and strings EXTREMELY short (1 sentence max).

Each item MUST have these exact fields:
{
  "title": "string (short)",
  "description": "1 short sentence max",
  "category": "hackathon" | "sports" | "internship" | "event",
  "organizer_name": "string",
  "location_city": "string",
  "location_area": "string",
  "deadline": "YYYY-MM-DD",
  "contact_email": "",
  "contact_phone": "",
  "external_link": "absolute URL",
  "event_date": "YYYY-MM-DD",
  "eligibility": "1 short phrase",
  "requirements": "",
  "what_offered": "1 short phrase",
  "auto_approve": true or false,
  "rejection_reason": "if false, 1 short phrase why"
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

    // Securely insert into database on the server-side (bypasses RLS)
    const dbItems = items.map((item: any) => {
      const { auto_approve, rejection_reason, ...rest } = item;
      return {
        ...rest,
        status: auto_approve === true ? "active" : "rejected",
        rejection_reason: auto_approve === true ? null : (rejection_reason || "Flagged by AI quality check"),
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
