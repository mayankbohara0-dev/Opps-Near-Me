import Navbar from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Community Guidelines | LocalOpps",
  description: "Guidelines and best practices for creating and participating in LocalOpps events.",
};

export default function Guidelines() {
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
          Community Guidelines
        </h1>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 40, color: "#d4d4d4", lineHeight: 1.7, marginTop: 40 }}>
          <section>
            <p style={{ fontSize: 16, color: "#a6a6a6", lineHeight: 1.6 }}>
              Our platform thrives on high-quality, genuine student opportunities. Please follow these guidelines when submitting a new opportunity.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>1. Be Accurate and Honest</h2>
            <p>
              Provide accurate dates, deadlines, locations, and descriptions. Misrepresenting an event (such as marking an unpaid internship as paid) will lead to your submissions being removed permanently.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>2. Respect Our Categories</h2>
            <p>
              Please tag your opportunity correctly. Do not label a standard event as a Hackathon if it doesn't involve hacking/coding, and don't label a marketing role as a Tech Internship.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>3. No Spam or Duplicate Listings</h2>
            <p>
              Do not post the exact same opportunity multiple times. If you need to fix a typo or update the deadline, please edit your existing listing instead of creating a new one.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>4. Provide Appropriate Contact Info</h2>
            <p>
              Opportunity submissions must include valid application links or standard contact methodology. Malicious cross-site scripts or referral links designed solely to drive clicks will be banned.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>Flagging Violations</h2>
            <p>
              If you see an opportunity that violates these guidelines, please report it to our team to help us keep LocalOpps safe and reliable.
              <br /><br />
              <strong>Report Email:</strong> <a href="mailto:localoppss@gmail.com" style={{ color: "#0099ff", textDecoration: "none" }}>localoppss@gmail.com</a>
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
        </div>
      </footer>
    </div>
  );
}
