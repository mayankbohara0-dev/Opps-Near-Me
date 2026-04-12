import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    if (rateData.count >= 10) {
      return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
    }
    rateData.count += 1;
    rateLimitMap.set(ip, rateData);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured." }, { status: 500 });
    }

    const item = await req.json();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an automated Quality Assurance AI for a student opportunity platform in India.
      A user has manually submitted the following opportunity via a form:
      
      ${JSON.stringify(item, null, 2)}
      
      Your job is to deeply analyze this submission to ensure it is authentic, professional, and free of garbage data.
      
      RULES FOR REJECTION:
      1. If the title, description, or organizer name looks like keyboard mashing (e.g. "asdf", "test test").
      2. If the description is too short, highly vague, or completely meaningless.
      3. If the phone number is blatantly fake (e.g., "1234567890" or "000000000").
      4. If the email is clearly a dummy address (e.g., "test@test.com", "fake@gmail.com").
      5. If the event seems malicious or heavily spammy.
      
      Determine if this is approved or rejected. If rejected, you MUST provide a friendly, clear, 1-sentence reason telling the user exactly what to fix so they can submit again. If approved, leave the reason empty.
      
      OUTPUT EXACTLY AND ONLY THIS JSON FORMAT AND NOTHING ELSE (no markdown backticks):
      {
        "valid": boolean,
        "reason": "String explaining rejection, or empty string if valid"
      }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    if (text.startsWith("\`\`\`json")) text = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();

    const analysis = JSON.parse(text);
    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error("Analysis generation error:", error);
    return NextResponse.json({ error: "Internal Server Error - failed to process request." }, { status: 500 });
  }
}
