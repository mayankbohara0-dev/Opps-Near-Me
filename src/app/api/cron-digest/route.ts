import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";
import { Resend } from "resend";

// Resolve production base URL
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

export async function GET(req: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || "dummy");
    // Verify Vercel Cron Security
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get Top 5 Active Opportunities
    const { data: opps } = await supabase
        .from("opportunities")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5);
        
    // 2. Get all subscribers
    const { data: subs } = await supabase.from("subscribers").select("email");

    if (!opps || opps.length === 0 || !subs || subs.length === 0) {
      return NextResponse.json({ success: true, message: "No active opportunities or subscribers." });
    }

    const emails = subs.map((s: any) => s.email);
    const baseUrl = getBaseUrl();

    // 3. Construct beautiful email HTML using our brand colors (Parchment & Terracotta)
    const itemsHtml = opps.map((o: any) => `
      <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #e8e6dc; border-radius: 8px; background-color: #faf9f5;">
        <h3 style="margin: 0 0 8px 0; color: #141413; font-family: Georgia, serif;">${o.title}</h3>
        <p style="margin: 0 0 4px 0; color: #87867f; font-size: 14px;"><strong>${o.location_city}</strong> | Deadline: ${o.deadline}</p>
        <p style="margin: 0 0 16px 0; color: #5e5d59; font-size: 14px;">${o.description}</p>
        <a href="${baseUrl}/opportunity/${o.id}" style="display: inline-block; padding: 8px 16px; background-color: #c96442; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">View Details</a>
      </div>
    `).join("");

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f4ed; padding: 32px; border-radius: 12px;">
        <h2 style="color: #c96442; text-align: center; font-family: Georgia, serif;">This Week's Top Opportunities 🚀</h2>
        <p style="color: #5e5d59; text-align: center; margin-bottom: 32px;">Here are the best student opportunities we found near you this week.</p>
        ${itemsHtml}
        <p style="color: #87867f; text-align: center; font-size: 12px; margin-top: 32px;">You are receiving this because you subscribed on our platform.</p>
      </div>
    `;

    // 4. Send via Resend (Note: Batch sending up to 50 allowed in free tier)
    await resend.emails.send({
      from: "Local Opportunities <onboarding@resend.dev>", // Needs to be changed to verified domain in production
      to: emails, 
      subject: "Top 5 Student Opportunities This Week!",
      html: emailHtml
    });

    return NextResponse.json({ success: true, count: emails.length });
  } catch(error: any) {
    console.error("Cron Digest Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

