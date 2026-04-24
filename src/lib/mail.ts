import nodemailer from "nodemailer";

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
  
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_APP_PASSWORD || process.env.SMTP_PASS;

  const mailOptions = {
    from: `"Local Opportunities Finder" <${smtpUser}>`,
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
  };

  if (smtpUser && smtpPass) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${toEmail}`);
    } catch (error) {
      console.error("Failed to send verification email via Gmail:", error);
    }
  } else {
    console.log("\n=============================================");
    console.log(`[MAILER MOCK] Verification email request for: ${toEmail}`);
    console.log(`[MAILER MOCK] Verify URL: ${verificationLink}`);
    console.log("=============================================\n");
  }
}
