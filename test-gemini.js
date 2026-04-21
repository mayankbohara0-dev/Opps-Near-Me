require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try { 
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' }); 
    const prompt = `
      Identify and generate the latest, authentic opportunities for university and college students happening right now or in the near future across anywhere in India.
      
      CRITICAL PRE-ANALYSIS RULES: 
      1. You must heavily filter and cross-verify your findings before returning them.
      2. DO NOT return placeholder, fake, or hallucinatory events. The events must explicitly exist on real university, tech, or corporate websites today.
      3. Exclude past events. Only focus on upcoming deadlines or currently active programs.
      4. DEADLINE VARIETY: You must deliberately find a mix of urgent opportunities (closing in 1-4 days) AND longer-term opportunities (closing in 30+ days).
      5. AUTOMATED QUALITY ASSURANCE: You must internally judge the quality of the listing and assign an 'auto_approve' boolean flag. 

      Find exactly 5 specific, very real things from diverse cities in India: 
      1. One student hackathon or coding competition.
      2. One remote or on-site internship.
      3. One student/developer workshop or event.
      4. One sports trial, tournament, or extra-curricular activity.
      5. One general/catch-all high-quality student opportunity.
      
      Return ONLY a pure JSON array of exactly 5 opportunities. Do not include markdown code block backticks. Just the raw array.
      
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
        "auto_approve": "Boolean, true if the opportunity perfectly meets all quality metrics, false otherwise",
        "rejection_reason": "String, REQUIRED if auto_approve is false — a specific 1-sentence explanation of why this was rejected. Set to empty string if auto_approve is true."
      }
    `;
    const result = await model.generateContent(prompt); 
    const text = result.response.text();
    console.log("Raw Response:\n", text); 
    
    // JSON EXTRACT
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');
    if (startIndex !== -1 && endIndex !== -1) {
      const parsed = JSON.parse(text.substring(startIndex, endIndex + 1));
      console.log("SUCCESS. length:", parsed.length);
    } else {
      console.log("FAIL NO ARRAY BRACKETS FOUND");
    }

  } catch(e) { 
    console.error('ERROR STATUS:', e.status, e.message); 
  } 
} 
run();
