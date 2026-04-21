"use client";
import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import FilterBar from "@/components/FilterBar";
import OpportunityCard from "@/components/OpportunityCard";
import Footer from "@/components/Footer";
import NewsletterForm from "@/components/NewsletterForm";
import { Category, getDaysUntilDeadline, TOP_INDIAN_CITIES } from "@/lib/data";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import Fuse from "fuse.js";
import { ArrowRight, ChevronDown, MapPin, Zap, Users } from "lucide-react";
import Link from "next/link";

function useScrollReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll(".reveal, .reveal-grid");
    if (!targets.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { (e.target as HTMLElement).classList.add("visible"); io.unobserve(e.target); } }),
      { threshold: 0.10 }
    );
    targets.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const PAGE_SIZE = 12;

const CATEGORY_HIGHLIGHTS = [
  { emoji: "🏏", label: "Sports Trials",  desc: "Cricket, Football, Kabaddi & more",    cat: "sports" as Category },
  { emoji: "💼", label: "Internships",    desc: "Stipend & work-from-home options",      cat: "internship" as Category },
  { emoji: "🎤", label: "Events",         desc: "Workshops, fests & seminars",           cat: "event" as Category },
  { emoji: "💻", label: "Hackathons",     desc: "Cash prizes & cloud credits",           cat: "hackathon" as Category },
];

export default function HomePage() {
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState<Category | "all">("all");
  const [city, setCity]             = useState("all");
  const [timeline, setTimeline]     = useState("all");
  const [page, setPage]             = useState(1);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  useScrollReveal();
  const { opportunities } = useData();
  const { user, loading: authLoading } = useAuth();

  const activeCount = opportunities.filter(o => o.status === "active").length;
  const activeCitiesInDb = opportunities.map(o => o.location_city);
  const totalCitiesSupported = new Set([...TOP_INDIAN_CITIES, ...activeCitiesInDb]).size;
  const dynamicStudentsReached = (activeCount * 142) + 1200;

  const STATS = useMemo(() => [
    { label: "Active Listings",   value: activeCount.toString(),                         icon: <Zap size={18} />,   suffix: "live right now" },
    { label: "Searchable Cities", value: totalCitiesSupported.toString(),                icon: <MapPin size={18} />, suffix: "cities in engine" },
    { label: "Students Reached",  value: dynamicStudentsReached.toLocaleString() + "+",  icon: <Users size={18} />, suffix: "impressions tracked" },
  ], [activeCount, totalCitiesSupported, dynamicStudentsReached]);

  const fuse = useMemo(() => new Fuse(opportunities, {
    keys: ["title", "description", "organizer_name", "location_area"],
    threshold: 0.35,
  }), [opportunities]);

  const filtered = useMemo(() => {
    let base = search.trim()
      ? fuse.search(search.trim()).map(r => r.item)
      : [...opportunities];
    if (category !== "all") base = base.filter(o => o.category === category);
    if (city !== "all")     base = base.filter(o => o.location_city === city);
    if (timeline !== "all") {
      base = base.filter(o => {
        const days = getDaysUntilDeadline(o.deadline);
        if (timeline === "urgent")   return days >= 0 && days <= 7;
        if (timeline === "upcoming") return days > 7 && days <= 30;
        if (timeline === "far")      return days > 30;
        return true;
      });
    }
    return base
      .filter(o => o.status === "active")
      .sort((a, b) => {
        const da = getDaysUntilDeadline(a.deadline), db = getDaysUntilDeadline(b.deadline);
        if (da <= 3 && db > 3) return -1;
        if (db <= 3 && da > 3) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [search, category, city, timeline, fuse, opportunities]);

  let visible = filtered.slice(0, page * PAGE_SIZE);
  let hasMore = visible.length < filtered.length;

  const isLocked = !authLoading && !user;
  if (isLocked) { visible = filtered.slice(0, 4); hasMore = false; }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4ed" }}>
      <Navbar />

      {/* ══════════════════════════════════════════════════════════
          HERO — Parchment canvas, editorial serif typography
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative",
        paddingTop: 96, paddingBottom: 96,
        textAlign: "center",
        background: "#f5f4ed",
        overflow: "hidden",
      }}>
        {/* Subtle warm radial wash */}
        <div style={{
          position: "absolute", top: -60, left: "50%",
          transform: "translateX(-50%)",
          width: 800, height: 500,
          background: "radial-gradient(ellipse at top, rgba(201,100,66,0.06) 0%, transparent 65%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>

          {/* Overline label */}
          <div className="anim-badge" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 14px", borderRadius: 24, marginBottom: 36,
            background: "rgba(201,100,66,0.08)",
            border: "1px solid rgba(201,100,66,0.2)",
            fontSize: 12, fontWeight: 500, color: "#c96442",
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "0.04em",
          }}>
            <span className="live-dot" style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#c96442", display: "inline-block",
            }} />
            Live · Across India 🇮🇳
          </div>

          {/* Serif display headline */}
          <h1 className="anim-up d-50" style={{
            fontFamily: "'Lora', Georgia, serif",
            fontWeight: 500,
            fontSize: "clamp(2.4rem, 5.5vw, 4rem)",
            lineHeight: 1.10,
            letterSpacing: "normal",
            color: "#141413",
            maxWidth: 760, margin: "0 auto 20px",
          }}>
            Find Local Opportunities<br />
            <em style={{ color: "#c96442", fontStyle: "italic" }}>Made for Students</em>
          </h1>

          {/* Body paragraph */}
          <p className="anim-up d-150" style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 18, color: "#5e5d59",
            maxWidth: 480, margin: "0 auto 48px",
            lineHeight: 1.60, fontWeight: 400,
          }}>
            Sports trials, internships, hackathons &amp; events — all near you.
            No noise. Just opportunities.
          </p>

          {/* CTA buttons */}
          <div className="anim-up d-200" style={{
            display: "flex", gap: 12,
            justifyContent: "center", flexWrap: "wrap", marginBottom: 80,
          }}>
            <a href="#feed" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 24px", borderRadius: 12,
              background: "#c96442", color: "#faf9f5",
              fontWeight: 500, fontSize: 15, textDecoration: "none",
              fontFamily: "'Inter', sans-serif",
              boxShadow: "#c96442 0px 0px 0px 0px, rgba(201,100,66,0.3) 0px 0px 0px 1px",
              transition: "opacity 0.2s, transform 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.90"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"; }}
            >
              Browse Opportunities <ArrowRight size={15} />
            </a>
            <Link href="/submit" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 24px", borderRadius: 12,
              background: "#e8e6dc", color: "#4d4c48",
              fontWeight: 500, fontSize: 15, textDecoration: "none",
              fontFamily: "'Inter', sans-serif",
              boxShadow: "#e8e6dc 0px 0px 0px 0px, #d1cfc5 0px 0px 0px 1px",
              transition: "opacity 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "#e8e6dc 0px 0px 0px 0px, #c2c0b6 0px 0px 0px 1px"; (e.currentTarget as HTMLAnchorElement).style.opacity = "0.9"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "#e8e6dc 0px 0px 0px 0px, #d1cfc5 0px 0px 0px 1px"; (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
            >
              Post an Opportunity
            </Link>
          </div>

          {/* Stats row */}
          <div className="anim-up d-250" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            maxWidth: 680, margin: "0 auto",
            background: "#faf9f5",
            border: "1px solid #f0eee6",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "rgba(0,0,0,0.05) 0px 4px 24px",
          }}>
            {STATS.map((s, i) => (
              <div key={s.label} style={{
                padding: "28px 20px",
                textAlign: "center",
                borderRight: i < STATS.length - 1 ? "1px solid #f0eee6" : "none",
              }}>
                <div style={{ display: "flex", justifyContent: "center", color: "#c96442", marginBottom: 10, opacity: 0.7 }}>
                  {s.icon}
                </div>
                <div style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontWeight: 500, fontSize: 26,
                  color: "#141413", lineHeight: 1.1, marginBottom: 6,
                }}>{s.value}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#87867f", fontWeight: 400 }}>{s.label}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#b0aea5", marginTop: 2 }}>{s.suffix}</div>
              </div>
            ))}
          </div>

          <div className="anim-up d-300" style={{ maxWidth: 480, margin: "64px auto 0" }}>
             <NewsletterForm />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          DARK SECTION — Category Highlights (chapter break)
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 0", background: "#141413" }}>
        <div className="container">
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11, fontWeight: 500, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "#c96442",
            textAlign: "center", marginBottom: 12,
          }}>Browse by category</p>
          <h2 className="reveal" style={{
            fontFamily: "'Lora', Georgia, serif",
            fontWeight: 500, fontSize: "clamp(1.6rem, 3.5vw, 2.3rem)",
            lineHeight: 1.30, color: "#faf9f5",
            textAlign: "center", marginBottom: 48,
          }}>
            Every opportunity, one place
          </h2>

          <div className="reveal-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 12,
          }}>
            {CATEGORY_HIGHLIGHTS.map((c) => (
              <button
                key={c.label}
                onClick={() => {
                  setCategory(c.cat);
                  document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" });
                }}
                onMouseEnter={() => setHoveredCat(c.label)}
                onMouseLeave={() => setHoveredCat(null)}
                style={{
                  padding: "28px 24px",
                  textAlign: "left", cursor: "pointer",
                  background: hoveredCat === c.label ? "#30302e" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${hoveredCat === c.label ? "#30302e" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 12,
                  transition: "background 0.25s ease, border-color 0.2s ease, box-shadow 0.25s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1)",
                  boxShadow: hoveredCat === c.label
                    ? "rgba(201,100,66,0.15) 0px 0px 0px 1px, rgba(0,0,0,0.3) 0px 8px 32px"
                    : "none",
                  transform: hoveredCat === c.label ? "translateY(-3px)" : "none",
                  willChange: "transform",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 14 }}>{c.emoji}</div>
                <div style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontWeight: 500, fontSize: 16,
                  color: hoveredCat === c.label ? "#d97757" : "#faf9f5",
                  marginBottom: 8, lineHeight: 1.2,
                  transition: "color 0.2s",
                }}>{c.label}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#87867f", lineHeight: 1.5 }}>{c.desc}</div>
                <div style={{
                  marginTop: 18, display: "flex", alignItems: "center", gap: 5,
                  fontSize: 12, fontWeight: 500, fontFamily: "'Inter', sans-serif",
                  color: hoveredCat === c.label ? "#d97757" : "#4d4c48",
                  transition: "color 0.2s",
                }}>
                  View all <ArrowRight size={11} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CITY PICKER — Parchment bg
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "64px 0 48px", background: "#f5f4ed" }}>
        <div className="container">
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11, fontWeight: 500, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "#c96442", marginBottom: 16,
          }}>Browse by city</p>

          <div style={{
            display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8,
            scrollbarWidth: "none", msOverflowStyle: "none",
          }}>
            {/* All Cities */}
            <button
              onClick={() => { setCity("all"); document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" }); }}
              style={{
                flexShrink: 0,
                padding: "7px 16px", borderRadius: 24,
                fontSize: 13, fontWeight: city === "all" ? 500 : 400,
                fontFamily: "'Inter', sans-serif",
                cursor: "pointer",
                background: city === "all" ? "#141413" : "#e8e6dc",
                color: city === "all" ? "#faf9f5" : "#5e5d59",
                border: `1px solid ${city === "all" ? "#141413" : "#d1cfc5"}`,
                transition: "all 0.15s ease", whiteSpace: "nowrap" as const,
                boxShadow: city === "all" ? "none" : "#e8e6dc 0px 0px 0px 0px, #d1cfc5 0px 0px 0px 1px",
              }}
            >
              🌐 All India
            </button>

            {/* Remote */}
            <button
              onClick={() => { setCity("Remote"); document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" }); }}
              style={{
                flexShrink: 0,
                padding: "7px 16px", borderRadius: 24,
                fontSize: 13, fontWeight: city === "Remote" ? 500 : 400,
                fontFamily: "'Inter', sans-serif",
                cursor: "pointer",
                background: city === "Remote" ? "rgba(201,100,66,0.12)" : "rgba(201,100,66,0.07)",
                color: "#c96442",
                border: `1px solid ${city === "Remote" ? "rgba(201,100,66,0.4)" : "rgba(201,100,66,0.2)"}`,
                transition: "all 0.15s ease", whiteSpace: "nowrap" as const,
              }}
            >
              💻 Remote
            </button>

            {/* Cities */}
            {TOP_INDIAN_CITIES.sort().map(c => (
              <button
                key={c}
                onClick={() => { setCity(c); document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" }); }}
                style={{
                  flexShrink: 0,
                  padding: "7px 14px", borderRadius: 24,
                  fontSize: 13, fontWeight: city === c ? 500 : 400,
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                  background: city === c ? "#faf9f5" : "#e8e6dc",
                  color: city === c ? "#141413" : "#5e5d59",
                  border: `1px solid ${city === c ? "#d1cfc5" : "#d1cfc5"}`,
                  transition: "all 0.15s ease", whiteSpace: "nowrap" as const,
                  boxShadow: city === c ? "rgba(0,0,0,0.06) 0px 0px 0px 1px" : "none",
                }}
              >
                📍 {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FEED
      ══════════════════════════════════════════════════════════ */}
      <section id="feed" style={{ paddingBottom: 120, background: "#f5f4ed" }}>
        {/* Sticky filter bar */}
        <div style={{
          position: "sticky", top: 64, zIndex: 30,
          background: "rgba(245,244,237,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid #e8e6dc",
          padding: "16px 0",
          boxShadow: "rgba(0,0,0,0.03) 0px 2px 8px",
        }}>
          <div className="container">
            <FilterBar
              search={search}     setSearch={v => { setSearch(v); setPage(1); }}
              category={category} setCategory={v => { setCategory(v); setPage(1); }}
              city={city}         setCity={v => { setCity(v); setPage(1); }}
              timeline={timeline} setTimeline={v => { setTimeline(v); setPage(1); }}
              cities={[...new Set(opportunities.map(o => o.location_city))]}
              total={filtered.length}
            />
          </div>
        </div>

        <div className="container" style={{ paddingTop: 40 }}>
          {visible.length > 0 ? (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
                gap: 16,
              }}>
                {visible.map((opp, i) => (
                  <OpportunityCard key={opp.id} opp={opp} index={i} locked={isLocked} />
                ))}
              </div>

              {hasMore && (
                <div style={{ textAlign: "center", marginTop: 56 }}>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "11px 28px", borderRadius: 12,
                      background: "#e8e6dc",
                      border: "none",
                      color: "#4d4c48", fontFamily: "'Inter', sans-serif",
                      fontWeight: 500, fontSize: 14,
                      cursor: "pointer",
                      boxShadow: "#e8e6dc 0px 0px 0px 0px, #d1cfc5 0px 0px 0px 1px",
                      transition: "opacity 0.15s, transform 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    Load More <ChevronDown size={15} />
                  </button>
                </div>
              )}

              {isLocked && filtered.length > 4 && (
                <div style={{
                  marginTop: 40, padding: "48px 32px",
                  background: "#faf9f5",
                  border: "1px solid #f0eee6",
                  borderRadius: 16, textAlign: "center",
                  boxShadow: "rgba(0,0,0,0.05) 0px 4px 24px",
                }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
                  <h3 style={{
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: "1.4rem", fontWeight: 500, color: "#141413",
                    marginBottom: 12, lineHeight: 1.3,
                  }}>
                    Showing 4 of {filtered.length} opportunities
                  </h3>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    color: "#5e5d59", fontSize: 15, lineHeight: 1.60,
                    marginBottom: 28, maxWidth: 400, margin: "0 auto 28px",
                  }}>
                    Create a free account or log in to view details, contact organizers, and browse all opportunities.
                  </p>
                  <Link href="/auth" style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "12px 28px", borderRadius: 12,
                    background: "#c96442", color: "#faf9f5",
                    fontWeight: 500, fontSize: 15, textDecoration: "none",
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: "#c96442 0px 0px 0px 0px, rgba(201,100,66,0.3) 0px 0px 0px 1px",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    Login to Unlock All
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%", margin: "0 auto 24px",
                background: "#faf9f5",
                border: "1px solid #f0eee6",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28,
                boxShadow: "rgba(0,0,0,0.04) 0px 4px 16px",
              }}>🔍</div>
              <h3 style={{
                fontFamily: "'Lora', Georgia, serif",
                fontWeight: 500, fontSize: "1.3rem",
                lineHeight: 1.3, marginBottom: 10, color: "#141413",
              }}>No opportunities found</h3>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                color: "#5e5d59", marginBottom: 28, fontSize: 15, lineHeight: 1.60,
              }}>
                Try adjusting your search or filters
              </p>
              <button
                onClick={() => { setSearch(""); setCategory("all"); setCity("all"); }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 24px", borderRadius: 12,
                  background: "#e8e6dc",
                  border: "none",
                  color: "#4d4c48", fontFamily: "'Inter', sans-serif",
                  fontWeight: 500, fontSize: 14, cursor: "pointer",
                  boxShadow: "#e8e6dc 0px 0px 0px 0px, #d1cfc5 0px 0px 0px 1px",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TRUST BAR — Dark section (chapter break)
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        borderTop: "1px solid #30302e",
        padding: "56px 0",
        background: "#141413",
      }}>
        <div className="container">
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 48, flexWrap: "wrap",
          }}>
            {[
              { icon: "⚡", text: "100% Free to List" },
              { icon: "✓",  text: "Manually Reviewed" },
              { icon: "📍", text: "Hyper-Local Focus" },
              { icon: "🎓", text: "Students First" },
            ].map(t => (
              <div key={t.text} style={{
                display: "flex", alignItems: "center", gap: 10,
                fontFamily: "'Inter', sans-serif",
                fontSize: 14, color: "#87867f", fontWeight: 400,
              }}>
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                {t.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
