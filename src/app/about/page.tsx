import Navbar from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "About Us | LocalOpps",
  description: "Learn more about the LocalOpps platform and our mission.",
};

export default function AboutUs() {
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
          About Us
        </h1>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 40, color: "#d4d4d4", lineHeight: 1.7, marginTop: 40 }}>
          <section>
            <p style={{ fontSize: 18, color: "#a6a6a6", lineHeight: 1.5 }}>
              LocalOpps was created with a simple mission in mind: <strong style={{ color: "#ffffff" }}>To connect students across India with opportunities that are actually happening locally, right now.</strong> 
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>The Problem</h2>
            <p>
              Students often miss out on local sports trials, localized hackathons, paid internships, and workshops simply because they didn't know they were happening. Existing platforms are often cluttered with remote opportunities, spam, or events taking place in completely different states.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>Our Solution</h2>
            <p>
              We built a discovery platform specifically targeting all Indian cities. By keeping the barrier to entry low (it's 100% free to list opportunities), making search lightning fast, and displaying distances and deadlines prominently, we want to help students advance their careers and hobbies.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>Contact Us</h2>
            <p>
              If you have any feedback, ideas, or business inquiries, we would love to hear from you. 
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
        </div>
      </footer>
    </div>
  );
}
