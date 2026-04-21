import Navbar from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms & Conditions | LocalOpps",
  description: "Rules for using the LocalOpps platform, protecting users and organizers.",
};

export default function TermsAndConditions() {
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
          Terms & Conditions
        </h1>
        <p style={{ color: "#a6a6a6", fontSize: 14, marginBottom: 48 }}>
          Last updated: April 2026
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 40, color: "#d4d4d4", lineHeight: 1.7 }}>
          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>1. Agreement to Terms</h2>
            <p>
              By accessing or using LocalOpps, you agree to be bound by these Terms & Conditions. 
              If you disagree with any part of these terms, you do not have permission to access the platform.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>2. Acceptable Use & User Behavior</h2>
            <p style={{ marginBottom: 12 }}>You agree not to use the platform in ways that:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>Violate any local, regional, or national laws.</li>
              <li>Involve submitting fake, fraudulent, or malicious opportunities.</li>
              <li>Infringe upon the rights of others, including organizers and participants.</li>
              <li>Attempt to scrape, hack, or disrupt the operation of the Website.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>3. Account Suspension & Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account without prior notice if you violate these terms. 
              Posting spam, abusive content, or attempting unauthorized access to other user accounts will result in immediate bans.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>4. Limitation of Liability</h2>
            <p>
              LocalOpps acts strictly as a discovery board for student opportunities. We are not liable for:
            </p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              <li>Cancellations, date changes, or misrepresentation of events by the organizers.</li>
              <li>Any injury, loss, or damages experienced during an event or internship found via our site.</li>
              <li>Disputes arising between students and third-party organizers.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>5. Payments & Refunds</h2>
            <p>
              Listing and browsing opportunities on LocalOpps is currently free. 
              Because we do not process transactions between students and organizers, we do not offer or facilitate refunds. 
              Any paid tickets or enrollment fees are handled directly by the organizers, and their respective refund policies apply.
            </p>
          </section>
          
          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>6. Changes to Terms</h2>
            <p>
              We may update our Terms & Conditions from time to time. We will notify users of any significant changes by posting the new terms on this page. 
              Continuing to use LocalOpps after those changes become effective constitutes your acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>7. Contact Information</h2>
            <p>
              If you have any questions, disputes, or concerns regarding your behavior, account standing, or these terms, you can contact us at:
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
            <Link href="/privacy" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none", transition: "color 0.2s" }}>
              Privacy Policy
            </Link>
            <Link href="/terms" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none", transition: "color 0.2s" }}>
              Terms & Conditions
            </Link>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>
            Helping students discover local opportunities — sports, internships, events &amp; hackathons
          </p>
        </div>
      </footer>
    </div>
  );
}
