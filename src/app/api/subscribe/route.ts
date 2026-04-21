import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) return NextResponse.json({ error: "Valid email required" }, { status: 400 });

    const { error } = await supabase.from("subscribers").upsert({ email, subscribed_at: new Date().toISOString() }, { onConflict: "email" });
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to subscribe" }, { status: 500 });
  }
}
