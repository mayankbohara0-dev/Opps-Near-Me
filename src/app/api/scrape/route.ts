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
    const todayStr = new Date().toISOString().split("T")[0]; 
    let webContext = "";
    // Removed googlethis because Vercel IPs get blocked/hang on Google Search, causing 10s timeouts.

    const prompt = `You are a strict data extractor for a student opportunity platform in India. Today is ${todayStr}.
${exclusions}

Generate a JSON array of student opportunities. YOU MUST GENERATE HIGHLY KNOWN, VERIFIED OPPORTUNITIES. DO NOT INVENT ANY.
Return EXACTLY 3 items (to stay under strict execution time limits).

CRITICAL RULES:
- "deadline" MUST be a future date STRICTLY AFTER ${todayStr}.
- "event_date" MUST be on or after today (${todayStr}).
- "external_link" MUST be a valid absolute URL directly to the application/registration page. Do NOT use generic homepages or google.com/search.

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
    
    // We will verify the links directly via HTTP HEAD request instead of Google Search
    const items = await Promise.all(parsedItems.map(async (item: any) => {
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

      // Hard server-side direct link validation (Timeout 1.5s so we don't hit 10s Vercel limit)
      if (item.external_link && item.external_link.startsWith("http") && !item.external_link.includes("google.com/search")) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);
          const headRes = await fetch(item.external_link, { 
             method: 'HEAD', 
             headers: {'User-Agent': 'Mozilla/5.0'},
             signal: controller.signal 
          });
          clearTimeout(timeoutId);
          if (headRes.status === 404) {
             isExpired = true;
             expiredReason = "Server Check: Generated link is broken (404 Not Found).";
             item.external_link = "";
          }
        } catch (e) {
          // If it fails to fetch (e.g. CORS block, timeout), we assume it might be valid to not be overly strict,
          // but we block known bad formats like google.com/search
        }
      } else if (item.external_link && item.external_link.includes("google.com/search")) {
         isExpired = true;
         expiredReason = "Server Check: Generated link is a Google Search query, not a direct link.";
         item.external_link = "";
      }

      if (isExpired) {
        console.warn(`[SCRAPER] Flagged invalid/outdated item: "${item.title}"`);
        item.auto_approve = false;
        item.rejection_reason = item.rejection_reason && item.rejection_reason !== "" 
          ? item.rejection_reason 
          : expiredReason;
      }
      return item;
    }));

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
