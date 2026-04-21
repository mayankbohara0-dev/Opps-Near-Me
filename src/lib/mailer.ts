import nodemailer from "nodemailer";

const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";

export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string,
  baseUrl: string
) {
  const resetUrl = `${baseUrl}/api/auth/reset-password?token=${resetToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#090909;border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;max-width:480px;width:100%;">
          <!-- Top accent -->
          <tr><td style="height:2px;background:#0099ff;"></td></tr>
          <!-- Logo section -->
          <tr>
            <td style="padding:36px 40px 0;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="width:32px;height:32px;background:#0099ff;border-radius:8px;text-align:center;vertical-align:middle;">
                    <span style="font-size:14px;font-weight:800;color:#ffffff;letter-spacing:-1px;">Lo</span>
                  </td>
                  <td style="padding-left:8px;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;vertical-align:middle;">LocalOpps</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.8px;margin:0 0 12px;">Reset your password</h1>
              <p style="font-size:14px;color:#a6a6a6;line-height:1.6;margin:0 0 28px;">
                You requested a password reset for your LocalOpps account. Click the button below to set a new password. This link expires in <strong style="color:#ffffff;">1 hour</strong>.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#ffffff;border-radius:100px;text-align:center;">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;color:#000000;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">Reset Password →</a>
                  </td>
                </tr>
              </table>
              <!-- Fallback URL -->
              <p style="font-size:12px;color:rgba(255,255,255,0.35);line-height:1.6;margin:0 0 4px;">Or copy and paste this URL:</p>
              <p style="font-size:12px;color:#0099ff;line-height:1.6;margin:0;word-break:break-all;">${resetUrl}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
              <p style="font-size:11px;color:rgba(255,255,255,0.25);line-height:1.6;margin:0;">
                If you did not request this, you can safely ignore this email.<br>
                © 2026 LocalOpps · Across India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  if (SMTP_USER && SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"LocalOpps" <${SMTP_USER}>`,
      to: toEmail,
      subject: "Reset your LocalOpps password",
      html,
    });
  } else {
    // Development fallback if SMTP not configured
    console.log("\\n=============================================");
    console.log(`[MAILER MOCK] Password reset request for: ${toEmail}`);
    console.log(`[MAILER MOCK] Reset URL: ${resetUrl}`);
    console.log("=============================================\\n");
  }
}
