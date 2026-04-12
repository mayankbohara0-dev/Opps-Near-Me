import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

export async function sendVerificationEmail(toEmail: string, token: string) {
  const verificationLink = `http://localhost:3000/api/auth/verify?token=${token}`;
  
  const mailOptions = {
    from: `"Local Opportunities Finder" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Verify your Email Address",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; color: #333;">
        <h2 style="color: #0099ff;">Welcome to Local Opportunities!</h2>
        <p>Thank you for registering. Please confirm that you own this Gmail account by clicking the link below:</p>
        <a href="${verificationLink}" style="display:inline-block; padding: 12px 24px; color: white; background: #0099ff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Verify My Email</a>
        <p style="margin-top: 24px; font-size: 13px; color: #777;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${toEmail}`);
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }
}
