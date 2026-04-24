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
    return new NextResponse(\`
      <div style="font-family: 'Inter', sans-serif; text-align: center; margin-top: 50px; background-color: #f5f4ed; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0;">
        <div style="background: #faf9f5; padding: 40px; border-radius: 12px; border: 1px solid #f0eee6; box-shadow: rgba(0,0,0,0.05) 0px 4px 24px; max-width: 400px; width: 100%;">
          <h1 style="color: #ef4444; font-family: 'Lora', Georgia, serif; margin-top: 0;">Verification Failed</h1>
          <p style="color: #5e5d59;">Your token is invalid or has already been used.</p>
          <a href="/auth" style="display:inline-block; padding: 12px 24px; color: #4d4c48; background: #e8e6dc; text-decoration: none; border-radius: 100px; font-weight: 500; margin-top: 20px;">Return to Login</a>
        </div>
      </div>
    \`, { headers: { "Content-Type": "text/html" } });
  }

  return new NextResponse(\`
    <div style="font-family: 'Inter', sans-serif; text-align: center; margin-top: 50px; background-color: #f5f4ed; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0;">
      <div style="background: #faf9f5; padding: 40px; border-radius: 12px; border: 1px solid #f0eee6; box-shadow: rgba(0,0,0,0.05) 0px 4px 24px; max-width: 400px; width: 100%;">
        <h1 style="color: #c96442; font-family: 'Lora', Georgia, serif; margin-top: 0;">Email Verified!</h1>
        <p style="color: #5e5d59;">Thank you for verifying your email address. Your account is now active.</p>
        <a href="/auth" style="display:inline-block; padding: 12px 24px; color: #faf9f5; background: #c96442; text-decoration: none; border-radius: 100px; font-weight: 500; margin-top: 20px;">Proceed to Login</a>
      </div>
    </div>
  \`, { headers: { "Content-Type": "text/html" } });
}
