import { NextResponse } from "next/server";
import { verifyEmailAction } from "@/lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "No verification token provided." }, { status: 400 });
  }

  const success = await verifyEmailAction(token);

  if (!success) {
    return new NextResponse(`
      <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
        <h1 style="color: #ef4444;">Verification Failed</h1>
        <p>Your token is invalid or has already been used.</p>
        <a href="/auth" style="color: #0099ff;">Return to Login</a>
      </div>
    `, { headers: { "Content-Type": "text/html" } });
  }

  return new NextResponse(`
    <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
      <h1 style="color: #10b981;">Email Verified!</h1>
      <p>Thank you for verifying your email address. Your account is now active.</p>
      <a href="/auth" style="display:inline-block; padding: 12px 24px; color: white; background: #0099ff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Proceed to Login</a>
    </div>
  `, { headers: { "Content-Type": "text/html" } });
}
