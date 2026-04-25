import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, action } = await req.json();

    if (action === "approve") {
      await supabase.from("opportunities").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", id);
    } else if (action === "reject") {
      await supabase.from("opportunities").update({ status: "rejected", updated_at: new Date().toISOString() }).eq("id", id);
    } else if (action === "delete") {
      await supabase.from("opportunities").delete().eq("id", id);
    } else if (action === "cleanup") {
      // Delete rejected/expired items older than 30 days to keep DB lean
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const { error: cleanupError, count } = await supabase
        .from("opportunities")
        .delete({ count: "exact" })
        .in("status", ["rejected", "expired"])
        .lt("updated_at", cutoff.toISOString());
      if (cleanupError) throw cleanupError;
      return NextResponse.json({ success: true, deleted: count ?? 0 });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
