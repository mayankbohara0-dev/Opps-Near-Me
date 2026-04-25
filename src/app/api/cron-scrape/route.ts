import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";
// googlethis removed — Vercel IPs are blocked by Google Search

export const maxDuration = 60; // Increase Vercel serverless function timeout to 60 seconds

// Sleep helper
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Call Gemini with exponential backoff retries.
async function callGeminiWithRetry(apiKey: string, prompt: string): Promise<string> {
  // Only confirmed-valid model IDs — gemini-flash-latest and gemini-1.5-flash are deprecated/not found
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
          // Model doesn't exist in this API version — skip to next model immediately
          break;
        } else if (isRetryable && attempt < 3) {
          console.warn(`[CRON] Retrying ${modelName} in ${delay / 1000}s...`);
          await sleep(delay);
          delay *= 2;
        } else if (!isRetryable) {
          console.warn(`[CRON] ${modelName} returned hard error (${err.status}), trying next model.`);
          break;
        }
      }
    }
  }
  throw new Error("All Gemini models failed after retries.");
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
    const { data: existingData } = await supabase.from("opportunities").select("title").order("created_at", { ascending: false }).limit(50);
    const existingTitles = existingData ? existingData.map((o: any) => o.title) : [];

    const exclusions =
      existingTitles.length > 0
        ? `\nEXCLUSION RULE: Do NOT return any of these already-found opportunities: [${existingTitles
            .slice(0, 20)
            .map((t: string) => `"${t}"`)
            .join(", ")}]`
        : "";

    const todayStr = new Date().toISOString().split("T")[0];
    const currentYear = new Date().getFullYear();

    // 3. Web Context
    let webContext = "";
    try {
      const queries = [
        `site:unstop.com/hackathons india student registration ${currentYear}`,
        `site:internshala.com/internships india student ${currentYear}`, 
        `site:linkedin.com/jobs/view/ student internship india OR entry-level ${currentYear}`
      ];
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      console.log("[CRON] Searching for real opportunities with query:", randomQuery);
      
      const searchRes = await google.search(randomQuery, { page: 0, safe: false, parse_ads: false });
      const topResults = searchRes.results.slice(0, 8).map((r: any) => `- Title: ${r.title}\n  Description: ${r.description}\n  Link: ${r.url}`).join("\n\n");
      
      if (topResults) {
        webContext = `\nREAL LIVE WEB SEARCH RESULTS:\nHere are real opportunities recently indexed on the web. You MUST prioritize extracting your 10 opportunities from these real results whenever possible so that the links and titles are 100% genuine and not hallucinated. Use the Exact Link provided in these results.\n\n${topResults}\n`;
      }
    } catch (err: any) {
      console.warn("[CRON] Web search failed, falling back to pure generative.", err.message);
    }

    // 4. Prompt
    const prompt = `You are a quality-control data generator for a student opportunity platform in India.
Today's date is ${todayStr}.
${exclusions}${webContext}

Generate a JSON array of exactly 10 student opportunities. Since you are provided with REAL LIVE WEB SEARCH RESULTS, rely heavily on them to extract real world hackathons, internships, or events (especially from LinkedIn, Unstop, and Internshala).

If the search results do not have enough diversity, you may generate the remaining items to reach exactly 10. Make sure the output represents diverse categories (e.g., hackathons, internships, workshops).

DATE RULES (CRITICAL — strictly enforce):
- "deadline" MUST be a future date STRICTLY AFTER ${todayStr}. Minimum deadline: at least 7 days from today.
- "event_date" MUST also be on or after today (${todayStr}). Never use past dates.
- Do NOT generate any opportunity whose event or deadline has already passed. Ensure dates match any data found in the real web search results.
- If the search results mention a year in the past (e.g. 2023, 2024, 2025), DO NOT invent a future ${currentYear} deadline for it. You MUST set auto_approve to FALSE and state that it is an old event.

QUALITY CHECK (mandatory for every item):
- The 'external_link' rule is STRICT. You MUST ONLY provide real, valid, direct URLs to the registration or opportunity page. Ensure the link points to the true origin of the opportunity (like unstop.com, internshala.com, etc.). Provide an empty string "" if you do not have a valid exact URL. Do NOT hallucinate fake links and do NOT use a Google search format.
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

    const rawText = await callGeminiWithRetry(apiKey, prompt);
    const startIndex = rawText.indexOf("[");
    const endIndex = rawText.lastIndexOf("]");
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("AI returned an unexpected format.");
    }

    const parsedItems = JSON.parse(rawText.substring(startIndex, endIndex + 1));

    // 5. Server-Side Filter & Formatting for DB
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dbItems = parsedItems.map((item: any) => {
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

      if (isExpired) {
        item.auto_approve = false;
        item.rejection_reason = item.rejection_reason && item.rejection_reason !== "" 
          ? item.rejection_reason 
          : expiredReason;
      }

      // Format for Supabase Insertion (just like the Admin page does)
      const { auto_approve, rejection_reason, ...rest } = item;
      return {
        ...rest,
        status: auto_approve === true ? "active" : "rejected",
        rejection_reason: auto_approve === true ? null : (item.rejection_reason || "Flagged by AI quality check"),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    // 6. Insert into Supabase
    const { error } = await supabase.from("opportunities").insert(dbItems);
    if (error) {
      console.error("[CRON] Supabase insert error:", error);
      throw error;
    }

    console.log(`[CRON] Successfully inserted ${dbItems.length} items to database.`);
    return NextResponse.json({ success: true, count: dbItems.length });
    
  } catch (error: any) {
    console.error("[CRON] Fatal error:", error.message || error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
