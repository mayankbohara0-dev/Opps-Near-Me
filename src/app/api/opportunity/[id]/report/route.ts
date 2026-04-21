import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const { data: opp, error: fetchErr } = await supabase.from("opportunities").select("reports_count, status").eq("id", id).single();
    if (fetchErr || !opp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    
    // Increment report count
    const count = (opp.reports_count || 0) + 1;
    let status = opp.status;
    
    // Auto-pending if 2 reports
    if (count >= 2 && status === "active") {
      status = "pending";
    }
    
    const { error: updateErr } = await supabase.from("opportunities").update({ reports_count: count, status }).eq("id", id);
    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, count, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
