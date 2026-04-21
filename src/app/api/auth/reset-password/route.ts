import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase-server";

/** GET /api/auth/reset-password?token=xxx — shows the reset form */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return htmlResponse("Invalid Link", false, `
      <p>This password reset link is invalid or missing.</p>
      <a href="/auth">Return to Login</a>
    `);
  }

  // Validate token exists and not expired
  const { data: rows, error } = await supabaseAdmin
    .from("app_users")
    .select("id, reset_token_expires")
    .eq("reset_token", token)
    .limit(1);

  if (error || !rows || rows.length === 0) {
    return htmlResponse("Invalid or Expired Link", false, `
      <p>This password reset link is invalid or has already been used.</p>
      <a href="/auth">Request a new link</a>
    `);
  }

  const expires = new Date(rows[0].reset_token_expires);
  if (expires < new Date()) {
    return htmlResponse("Link Expired", false, `
      <p>This password reset link has expired. Links are valid for 1 hour.</p>
      <a href="/auth">Request a new link</a>
    `);
  }

  // Show the reset form
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Reset Password · LocalOpps</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', sans-serif;
      padding: 24px;
      position: relative;
      overflow: hidden;
    }
    .aurora {
      position: fixed; top: 0; left: 50%; transform: translateX(-50%);
      width: 800px; height: 400px;
      background: radial-gradient(ellipse at top, rgba(0,153,255,0.1) 0%, transparent 70%);
      pointer-events: none; z-index: 0;
    }
    .grid-bg {
      position: fixed; inset: 0; z-index: 0;
      background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
      background-size: 48px 48px;
      pointer-events: none;
    }
    .card {
      position: relative; z-index: 1;
      width: 100%; max-width: 420px;
      background: #090909;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      box-shadow: rgba(0,153,255,0.15) 0 0 0 1px, rgba(0,0,0,0.5) 0 32px 80px;
      overflow: hidden;
      animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
    }
    .accent-line { height: 2px; background: #0099ff; opacity: 0.7; }
    .card-body { padding: 36px 32px 32px; }
    .logo { display: flex; align-items: center; gap: 8px; margin-bottom: 28px; }
    .logo-box {
      width: 32px; height: 32px; border-radius: 8px; background: #0099ff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 14px; color: #fff; letter-spacing: -1px;
    }
    .logo-text { font-weight: 700; font-size: 18px; color: #fff; letter-spacing: -0.5px; }
    h1 { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -0.8px; margin-bottom: 8px; }
    .subtitle { font-size: 13px; color: #a6a6a6; line-height: 1.6; margin-bottom: 28px; }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    label { font-size: 12px; font-weight: 500; color: #a6a6a6; letter-spacing: -0.05px; }
    input[type=password] {
      width: 100%; padding: 11px 14px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: #fff; font-family: 'Inter', sans-serif; font-size: 14px;
      outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    }
    input[type=password]:focus {
      border-color: rgba(0,153,255,0.5);
      box-shadow: 0 0 0 3px rgba(0,153,255,0.08);
    }
    .btn {
      margin-top: 8px; width: 100%; padding: 13px;
      border-radius: 100px;
      background: #fff; color: #000;
      font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px;
      letter-spacing: -0.2px; border: none; cursor: pointer;
      transition: opacity 0.2s; display: flex; align-items: center;
      justify-content: center; gap: 8px;
    }
    .btn:hover { opacity: 0.9; }
    .btn:disabled { opacity: 0.6; cursor: wait; }
    .error-box {
      padding: 10px 14px; border-radius: 8px; margin-bottom: 16px;
      background: rgba(248,113,113,0.07); border: 1px solid rgba(248,113,113,0.2);
      font-size: 13px; color: #f87171; display: none;
    }
    .success-box {
      padding: 10px 14px; border-radius: 8px; margin-bottom: 16px;
      background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25);
      font-size: 13px; color: #4ade80; text-align: center; display: none;
    }
    .card-footer {
      padding: 16px 32px;
      border-top: 1px solid rgba(255,255,255,0.05);
      text-align: center;
    }
    .card-footer p { font-size: 11px; color: rgba(255,255,255,0.25); line-height: 1.6; }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .spinner {
      width: 15px; height: 15px; border-radius: 50%;
      border: 2px solid rgba(0,0,0,0.2); border-top-color: #000;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="aurora"></div>
  <div class="grid-bg"></div>
  <div class="card">
    <div class="accent-line"></div>
    <div class="card-body">
      <div class="logo">
        <div class="logo-box">Lo</div>
        <span class="logo-text">LocalOpps</span>
      </div>
      <h1>Set new password</h1>
      <p class="subtitle">Enter your new password below. Make it strong!</p>
      <div class="error-box" id="errBox"></div>
      <div class="success-box" id="okBox"></div>
      <form id="resetForm">
        <input type="hidden" name="token" value="${token}"/>
        <div class="field">
          <label for="pw">New Password</label>
          <input type="password" id="pw" name="password" placeholder="Min. 6 characters" required autocomplete="new-password"/>
        </div>
        <div class="field">
          <label for="pw2">Confirm Password</label>
          <input type="password" id="pw2" name="confirm" placeholder="Repeat password" required autocomplete="new-password"/>
        </div>
        <button class="btn" type="submit" id="submitBtn">
          Update Password →
        </button>
      </form>
    </div>
    <div class="card-footer">
      <p>LocalOpps · Across India</p>
    </div>
  </div>

  <script>
    const form = document.getElementById('resetForm');
    const errBox = document.getElementById('errBox');
    const okBox = document.getElementById('okBox');
    const submitBtn = document.getElementById('submitBtn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errBox.style.display = 'none';
      okBox.style.display = 'none';

      const pw = document.getElementById('pw').value.trim();
      const pw2 = document.getElementById('pw2').value.trim();
      const token = form.querySelector('[name=token]').value;

      if (pw.length < 6) {
        errBox.textContent = 'Password must be at least 6 characters.';
        errBox.style.display = 'block';
        return;
      }
      if (pw !== pw2) {
        errBox.textContent = 'Passwords do not match.';
        errBox.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner"></div> Updating…';

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pw }),
      });

      const data = await res.json();

      if (data.success) {
        okBox.innerHTML = '✅ Password updated! <a href="/auth" style="color:#4ade80;">Sign in now →</a>';
        okBox.style.display = 'block';
        form.style.display = 'none';
      } else {
        errBox.textContent = data.error || 'Something went wrong. Please try again.';
        errBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Update Password →';
      }
    });
  </script>
</body>
</html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

/** POST /api/auth/reset-password — validates token and updates password */
export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (password.trim().length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Validate token
    const { data: rows, error } = await supabaseAdmin
      .from("app_users")
      .select("id, reset_token_expires")
      .eq("reset_token", token)
      .limit(1);

    if (error || !rows || rows.length === 0) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    const user = rows[0];
    if (new Date(user.reset_token_expires) < new Date()) {
      return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 400 });
    }

    // Hash new password
    const hashed = bcrypt.hashSync(password.trim(), bcrypt.genSaltSync(10));

    // Update password and clear token
    const { error: updateErr } = await supabaseAdmin
      .from("app_users")
      .update({ password: hashed, reset_token: null, reset_token_expires: null, verified: true })
      .eq("id", user.id);

    if (updateErr) {
      console.error("Password reset update error:", updateErr);
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function htmlResponse(title: string, success: boolean, body: string) {
  const color = success ? "#10b981" : "#ef4444";
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${title} · LocalOpps</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet"/>
    <style>
      body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Inter',sans-serif;padding:24px;}
      .box{background:#090909;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px;max-width:400px;text-align:center;}
      h1{color:${color};font-size:22px;margin-bottom:12px;}
      p{color:#a6a6a6;font-size:14px;line-height:1.6;margin-bottom:20px;}
      a{display:inline-block;padding:11px 24px;background:#0099ff;color:#fff;border-radius:100px;text-decoration:none;font-size:14px;font-weight:600;}
    </style></head>
    <body><div class="box"><h1>${title}</h1>${body}</div></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
