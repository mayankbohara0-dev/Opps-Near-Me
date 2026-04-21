import Navbar from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | LocalOpps",
  description: "Privacy Policy for LocalOpps - how we collect and use your data.",
};

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: "100vh", background: "#000000", color: "#ffffff", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      
      <main className="container" style={{ paddingTop: 120, paddingBottom: 80, maxWidth: 800 }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          color: "#a6a6a6", textDecoration: "none", fontSize: 14,
          marginBottom: 32, transition: "color 0.2s"
        }}>
          <ArrowLeft size={16} /> Back to home
        </Link>
        
        <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-1px", marginBottom: 24, color: "#ffffff" }}>
          Privacy Policy
        </h1>
        <p style={{ color: "#a6a6a6", fontSize: 14, marginBottom: 48 }}>
          Last updated: April 2026
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 40, color: "#d4d4d4", lineHeight: 1.7 }}>
          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>1. Introduction</h2>
            <p>
              Welcome to LocalOpps. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and share information when you use our platform, 
              including our authentication mechanisms and analytics tracking.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>2. Data We Collect</h2>
            <p style={{ marginBottom: 12 }}>We may collect and process the following data about you:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong>Contact Data:</strong> Your email address when you register for an account or reset your password.</li>
              <li><strong>Account Data:</strong> Personal information you provide on your profile.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our website, collected via analytics tools (like Vercel Speed Insights).</li>
              <li><strong>Technical Data:</strong> Essential cookies required to securely maintain your active session.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>3. How We Use Your Data</h2>
            <p style={{ marginBottom: 12 }}>Your data is used exclusively to provide, secure, and improve our services:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>To manage your account, authentication securely, and handle your login state.</li>
              <li>To send you transactional emails, such as password resets and account verifications.</li>
              <li>To analyze site performance, fix bugs, and refine the user experience.</li>
              <li>To let you submit and manage local opportunities.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>4. Cookies and Tracking</h2>
            <p>
              We use strictly necessary cookies to keep you logged in and functioning session cookies. 
              We also use analytics to periodically track web vitals and speed insights. 
              By continuing to use LocalOpps, you consent to our use of these technical mechanisms. We do not sell your personal data or use invasive third-party ad tracking.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>5. Third-Party Services</h2>
            <p>
              We utilize trusted data processors, including <strong>Supabase</strong> for our secure database and authentication infrastructure, 
              and <strong>Vercel</strong> for cloud hosting and performance analytics. 
              These providers process data according to their own strict privacy policies and standards.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>6. Your Rights & Data Deletion</h2>
            <p>
              In compliance with global standards and the Data Protection Rules, you retain full rights to your data. You may request access to, correction of, or complete deletion of your personal information 
              registered with us. 
              <br /><br />
              <strong>Account Deletion:</strong> If you wish to permanently delete your account and all associated data, please contact us at the email provided below. We process all data deletion requests promptly.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>7. Contact Information</h2>
            <p>
              If you have any questions about this Privacy Policy, your data, or need to request a data export or account deletion, please contact our administrative team at:
              <br /><br />
              <strong>Email:</strong> <a href="mailto:localoppss@gmail.com" style={{ color: "#0099ff", textDecoration: "none" }}>localoppss@gmail.com</a>
            </p>
          </section>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "36px 0", marginTop: 40 }}>
        <div className="container" style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#a6a6a6", letterSpacing: "-0.1px", marginBottom: 12 }}>
            © 2026 <span style={{ color: "#ffffff", fontWeight: 600 }}>LocalOpps</span> ·
            Made for students across India
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 12 }}>
            <Link href="/" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none", transition: "color 0.2s" }}>
              Home
            </Link>
            <Link href="/privacy" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none", transition: "color 0.2s" }}>
              Privacy Policy
            </Link>
            <Link href="/terms" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none", transition: "color 0.2s" }}>
              Terms & Conditions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
