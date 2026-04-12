import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const rateData = rateLimitMap.get(ip) || { count: 0, resetTime: now + 60000 };
    
    if (now > rateData.resetTime) {
      rateData.count = 0;
      rateData.resetTime = now + 60000;
    }
    if (rateData.count >= 5) {
      return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
    }
    rateData.count += 1;
    rateLimitMap.set(ip, rateData);

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

    let existingTitles: string[] = [];
    try {
      const body = await req.json();
      existingTitles = body.existingTitles || [];
    } catch(e) {}

    const exclusions = existingTitles.length > 0 
      ? `\n      4. EXCLUSION RULE: You MUST NOT return any of these previously found opportunities:\n         [${existingTitles.map(t => `"${t}"`).join(", ")}]` 
      : "";

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We use gemini-1.5-pro or flash (flash is faster for this)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{
        // This enables the model to search the live web!
        googleSearch: {}
      } as any],
    });

    const prompt = `
      Search the live web for the latest, authentic opportunities for university and college students happening right now or in the near future across anywhere in India.
      
      CRITICAL PRE-ANALYSIS RULES: 
      1. You must heavily filter and cross-verify your findings before returning them.
      2. DO NOT return placeholder, fake, or hallucinatory events. The events must explicitly exist on real university, tech, or corporate websites today.
      3. Exclude past events. Only focus on upcoming deadlines or currently active programs.
      4. DEADLINE VARIETY: You must deliberately find a mix of urgent opportunities (closing in 1-4 days) AND longer-term opportunities (closing in 30+ days).
      5. AUTOMATED QUALITY ASSURANCE: You must internally judge the quality of the listing and assign an 'auto_approve' boolean flag. 
         - Set to TRUE ONLY IF the event has an extremely clear description, a very confident realistic address/location (or explicitly Remote), and a verified external_link or contact email where students can apply.
         - Set to FALSE IF the finding feels slightly spammy, vague, missing contact endpoints, or appears to be a private/closed event.${exclusions}

      Find 4 specific, very real things: 
      1. Two student hackathons, tech events, or coding competitions.
      2. One sports trial or major college fest.
      3. One remote or on-site internship/developer workshop.
      
      Return ONLY a pure JSON array of these 4 opportunities. Do not include markdown code block backticks (like \`\`\`json). Just the raw array.
      
      Each object must strictly have this schema:
      {
        "title": "String, Name of the opportunity",
        "description": "String, A comprehensive 2-3 sentence overview of this opportunity",
        "category": "String, exactly one of: 'hackathon', 'sports', 'internship', or 'event'",
        "organizer_name": "String, Name of the club, company, or college",
        "location_city": "String, The specific city in India (e.g., 'Bengaluru', 'Delhi', 'Mumbai', or 'Remote')",
        "location_area": "String, The specific neighbourhood or venue (e.g. 'Koramangala', 'IIT Bombay campus')",
        "deadline": "YYYY-MM-DD format (estimate a future date if not specified)",
        "contact_email": "String, the email to contact, or guess a related one if not found",
        "contact_phone": "String, a phone number if available, otherwise an empty string",
        "external_link": "String, a URL link to apply/register, or an empty string",
        "event_date": "YYYY-MM-DD format, when the event actually happens",
        "eligibility": "String, 1-2 sentences on who can participate (e.g., 'Open to 1st and 2nd year undergrads')",
        "requirements": "String, what to bring or prepare (e.g., 'Bring your laptop and college ID')",
        "what_offered": "String, perks like prize money, certificates, or food (e.g., 'Winner gets Rs. 5000, all get certificates')",
        "auto_approve": "Boolean, true if the opportunity perfectly meets all quality metrics, false otherwise"
      }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    console.log("Gemini Raw Response:", text);

    // Clean up response if it wraps in markdown
    if (text.startsWith("```json")) {
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    } else if (text.startsWith("```")) {
      text = text.replace(/```/g, "").trim();
    }

    const items = JSON.parse(text);

    return NextResponse.json({ items });

  } catch (error: any) {
    console.error("Scrape Error:", error);
    return NextResponse.json({ error: "Internal Server Error - failed to process request." }, { status: 500 });
  }
}
