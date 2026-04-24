import { Resend } from 'resend';

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

export async function sendVerificationEmail(toEmail: string, token: string) {
  const baseUrl = getBaseUrl();
  const verificationLink = `${baseUrl}/api/auth/verify?token=${token}`;
  
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    const resend = new Resend(resendApiKey);
    
    // Fallback to onboarding@resend.dev if a custom from email isn't set
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Local Opportunities <onboarding@resend.dev>';
    
    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: toEmail,
        subject: "Verify your Email Address",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; color: #333;">
            <h2 style="color: #c96442;">Welcome to Local Opportunities!</h2>
            <p>Thank you for registering. Please confirm that you own this email account by clicking the link below:</p>
            <a href="${verificationLink}" style="display:inline-block; padding: 12px 24px; color: white; background: #c96442; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Verify My Email</a>
            <p style="margin-top: 24px; font-size: 13px; color: #777;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend API error:", error);
      } else {
        console.log(`Verification email sent to ${toEmail} via Resend. ID: ${data?.id}`);
      }
    } catch (error) {
      console.error("Failed to send verification email:", error);
    }
  } else {
    console.log("\n=============================================");
    console.log(`[MAILER MOCK] Verification email request for: ${toEmail}`);
    console.log(`[MAILER MOCK] Verify URL: ${verificationLink}`);
    console.log("=============================================\n");
  }
}
