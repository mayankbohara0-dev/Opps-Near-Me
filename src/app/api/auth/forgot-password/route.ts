import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const e = email.trim().toLowerCase();

    // Look up user
    const { data: rows, error } = await supabaseAdmin
      .from("app_users")
      .select("id, email, verified")
      .eq("email", e)
      .limit(1);

    // Always return success to prevent email enumeration
    if (error || !rows || rows.length === 0) {
      return NextResponse.json({ success: true });
    }

    const user = rows[0];

    // Generate a secure reset token
    const resetToken =
      Math.random().toString(36).substring(2) +
      Date.now().toString(36) +
      Math.random().toString(36).substring(2) +
      Math.random().toString(36).substring(2);

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Store token in Supabase
    const { error: updateErr } = await supabaseAdmin
      .from("app_users")
      .update({ reset_token: resetToken, reset_token_expires: expiresAt })
      .eq("id", user.id);

    if (updateErr) {
      console.error("Failed to store reset token:", updateErr);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }

    // Determine base URL
    const origin =
      process.env.NEXT_PUBLIC_BASE_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";

    // Send email
    await sendPasswordResetEmail(e, resetToken, origin);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
