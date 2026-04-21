import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #e8e6dc", padding: "64px 0 48px", background: "#141413" }}>
      <div className="container">

        {/* Top section */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20, marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28, background: "#c96442", borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#faf9f5", fontWeight: 600, fontSize: 11,
              fontFamily: "'Lora', Georgia, serif",
            }}>Lo</div>
            <span style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 18, fontWeight: 500, color: "#faf9f5",
            }}>LocalOpps</span>
          </div>

          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 15, color: "#b0aea5", lineHeight: 1.60,
            maxWidth: 340,
          }}>
            Made for students across India
          </p>
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 4, marginBottom: 40 }}>
          {[
            { href: "/", label: "Home" },
            { href: "/about", label: "About Us" },
            { href: "/guidelines", label: "Guidelines" },
            { href: "/privacy", label: "Privacy" },
            { href: "/terms", label: "Terms" },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "7px 14px", borderRadius: 8,
                fontSize: 14, color: "#87867f", textDecoration: "none",
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#faf9f5"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#87867f"; e.currentTarget.style.background = "transparent"; }}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="mailto:localoppss@gmail.com"
            style={{
              padding: "7px 14px", borderRadius: 8,
              fontSize: 14, color: "#d97757", textDecoration: "none",
              fontFamily: "'Inter', sans-serif",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#faf9f5"; e.currentTarget.style.background = "rgba(217,119,87,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#d97757"; e.currentTarget.style.background = "transparent"; }}
          >
            Contact
          </a>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "#30302e", marginBottom: 28 }} />

        {/* Copyright */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 13, color: "#4d4c48", textAlign: "center", lineHeight: 1.5,
        }}>
          Helping students discover local opportunities — sports, internships, events &amp; hackathons
          <br />
          © {new Date().getFullYear()} LocalOpps. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
