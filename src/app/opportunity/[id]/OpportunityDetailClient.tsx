"use client";
import { CATEGORY_META, getDaysUntilDeadline } from "@/lib/data";
import { useData } from "@/contexts/DataContext";
import Navbar from "@/components/Navbar";
import OpportunityCard from "@/components/OpportunityCard";
import {
  ArrowLeft, MapPin, Calendar, Clock, Phone, Mail, ExternalLink,
  Share2, CheckCircle, Users, Gift, Info, Copy, MessageCircle, Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CAT_ACCENT: Record<string, string> = {
  sports:     "linear-gradient(90deg,#f97316,#fbbf24)",
  internship: "linear-gradient(90deg,#3b82f6,#60a5fa)",
  event:      "linear-gradient(90deg,#a855f7,#c084fc)",
  hackathon:  "linear-gradient(90deg,#22c55e,#4ade80)",
};

export default function OpportunityDetailClient({ id }: { id: string }) {
  const { opportunities } = useData();
  const opp = opportunities.find(o => o.id === id);
  const router  = useRouter();
  const [copied, setCopied] = useState(false);
  
  if (!opp) return <div style={{color:"white", padding: 40}}>Loading or not found...</div>;

  const meta    = CATEGORY_META[opp.category];
  const days    = getDaysUntilDeadline(opp.deadline);
  const urgent  = days >= 0 && days <= 3;
  const expired = days < 0;
  
  const isRemote = ["remote", "online", "virtual", "anywhere"].includes(opp.location_city?.toLowerCase()) || 
                   ["remote", "online", "virtual", "anywhere"].includes(opp.location_area?.toLowerCase());

  const deadlineColor = expired ? "#4b5563" : urgent ? "#f87171" : days <= 7 ? "#fbbf24" : "#4ade80";
  const deadlineLabel = expired ? "Expired" : days === 0 ? "Today!" : days === 1 ? "1 day left" : `${days} days left`;

  const copy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };
  const whatsapp = () => {
    if (typeof window !== "undefined") {
      const txt = encodeURIComponent(`🌟 Check out this opportunity!\n\n*${opp.title}* by ${opp.organizer_name}\n📍 ${opp.location_city} · ${opp.location_area}\n⏰ Deadline: ${new Date(opp.deadline).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}\n\n${window.location.href}`);
      window.open(`https://wa.me/?text=${txt}`, "_blank");
    }
  };
  const applyHref = opp?.external_link || `https://wa.me/${opp?.contact_phone?.replace(/\D/g,"") || ''}`;
  const related   = opportunities.filter(o => o.id !== opp?.id && o.category === opp?.category && o.status === "active").slice(0,3);

  const PILL_STYLE = {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
    whiteSpace: "nowrap" as const, border: "1px solid transparent",
  };

  return (
    <div className="grid-bg" style={{ minHeight: "100vh" }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>

        {/* ── Back ── */}
        <button
          onClick={() => router.back()}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            fontSize: 13, color: "#6b7280", background: "none", border: "none",
            cursor: "pointer", marginBottom: 28, fontFamily: "inherit",
            transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#4ade80")}
          onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
        >
          <ArrowLeft size={15} /> Back to opportunities
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
          {/* ── Wide layout on lg ── */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 20 }}
            className="detail-grid">

            {/* ════ LEFT column ════ */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Header card */}
              <div className="card" style={{ overflow: "hidden" }}>
                <div style={{ height: 4, background: CAT_ACCENT[opp.category] }} />
                <div style={{ padding: "28px 28px 24px" }}>
                  {/* badges */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                    <span style={{
                      ...PILL_STYLE,
                      background: meta.bg.includes("orange") ? "rgba(249,115,22,0.1)"
                        : meta.bg.includes("blue")   ? "rgba(59,130,246,0.1)"
                        : meta.bg.includes("purple") ? "rgba(168,85,247,0.1)"
                        : "rgba(34,197,94,0.1)",
                      color: meta.bg.includes("orange") ? "#fb923c"
                        : meta.bg.includes("blue")   ? "#60a5fa"
                        : meta.bg.includes("purple") ? "#c084fc"
                        : "#4ade80",
                      borderColor: meta.bg.includes("orange") ? "rgba(249,115,22,0.3)"
                        : meta.bg.includes("blue")   ? "rgba(59,130,246,0.3)"
                        : meta.bg.includes("purple") ? "rgba(168,85,247,0.3)"
                        : "rgba(34,197,94,0.3)",
                    }}>
                      {meta.emoji} {meta.label}
                    </span>
                    {urgent && !expired && (
                      <span style={{ ...PILL_STYLE, background:"rgba(239,68,68,0.1)", color:"#f87171", borderColor:"rgba(239,68,68,0.3)" }}
                        className="pulse-red">🔴 Closing Soon</span>
                    )}
                    {expired && (
                      <span style={{ ...PILL_STYLE, background:"rgba(107,114,128,0.1)", color:"#9ca3af", borderColor:"rgba(107,114,128,0.3)" }}>
                        Expired
                      </span>
                    )}
                  </div>

                  <h1 className="heading-2" style={{ marginBottom: 8 }}>{opp.title}</h1>
                  <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
                    Posted by{" "}
                    <span style={{ color: "#4ade80", fontWeight: 600 }}>{opp.organizer_name}</span>
                    {" "}·{" "}
                    {new Date(opp.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}
                  </p>

                  {/* key meta chips */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
                    <MetaChip icon={<MapPin size={13} />} label="Location" value={`${opp.location_area}, ${opp.location_city}`} />
                    <MetaChip icon={<Clock size={13} />} label="Deadline"
                      value={`${new Date(opp.deadline).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})} — ${deadlineLabel}`}
                      accent={deadlineColor} />
                    {opp.event_date && (
                      <MetaChip icon={<Calendar size={13} />} label="Event Date"
                        value={new Date(opp.event_date).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"long",year:"numeric"})} />
                    )}
                  </div>
                </div>
              </div>

              {/* About */}
              <InfoSection icon={<Info size={15} />} title="About this Opportunity">
                <p style={{ fontSize: 14, color: "#d1d5db", lineHeight: 1.75 }}>{opp.description}</p>
              </InfoSection>

              {opp.eligibility && (
                <InfoSection icon={<Users size={15} />} title="Eligibility">
                  <p style={{ fontSize: 14, color: "#d1d5db", lineHeight: 1.75 }}>{opp.eligibility}</p>
                </InfoSection>
              )}

              {opp.requirements && (
                <InfoSection icon={<CheckCircle size={15} />} title="What to Bring / Requirements">
                  <p style={{ fontSize: 14, color: "#d1d5db", lineHeight: 1.75 }}>{opp.requirements}</p>
                </InfoSection>
              )}

              {opp.what_offered && (
                <InfoSection icon={<Gift size={15} />} title="What You Get">
                  <p style={{ fontSize: 14, color: "#d1d5db", lineHeight: 1.75 }}>{opp.what_offered}</p>
                </InfoSection>
              )}
            </div>

            {/* ════ RIGHT sidebar ════ */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Apply card */}
              <div className="card" style={{ padding: 24 }}>
                <h3 className="heading-3" style={{ marginBottom: 16 }}>Ready to Apply?</h3>
                {!opp.external_link && !opp.contact_phone ? (
                  <div style={{ padding: 14, background: "rgba(255,255,255,0.05)", borderRadius: 10, textAlign: "center", fontSize: 14, color: "#9ca3af" }}>
                    No application links provided for this opportunity. Use email below.
                  </div>
                ) : (
                  <a
                    href={applyHref} target="_blank" rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{
                      width: "100%", padding: 14, fontSize: 15, justifyContent: "center",
                      pointerEvents: expired ? "none" : "auto", opacity: expired ? 0.5 : 1,
                    }}
                  >
                    {opp.external_link ? "Apply / Register" : "Contact on WhatsApp"}
                    {opp.external_link ? <ExternalLink size={15} /> : <MessageCircle size={15} />}
                  </a>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                  <button onClick={whatsapp} className="btn btn-ghost" style={{ fontSize: 13 }}>
                    <Share2 size={13} /> WhatsApp
                  </button>
                  <button onClick={copy} className="btn btn-ghost" style={{ fontSize: 13 }}>
                    <Copy size={13} /> {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>

              {/* Contact card */}
              <div className="card" style={{ padding: 24 }}>
                <h3 className="heading-3" style={{ marginBottom: 18 }}>Contact Organizer</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <ContactRow icon={<Users size={13} />}     label="Organizer"        value={opp.organizer_name} />
                  {opp.contact_phone && (
                    <ContactRow icon={<Phone size={13} />}     label="Phone / WhatsApp" value={opp.contact_phone}  href={`tel:${opp.contact_phone.replace(/\D/g,"")}`} />
                  )}
                  {opp.contact_email && (
                    <ContactRow icon={<Mail size={13} />}      label="Email"            value={opp.contact_email}  href={`mailto:${opp.contact_email}`} />
                  )}
                  {opp.external_link && (
                    <ContactRow icon={<ExternalLink size={13} />} label="Website / Form" value="Open Link" href={opp.external_link} />
                  )}
                </div>
              </div>

              {/* Location card */}
              {!isRemote && (
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <MapPin size={14} style={{ color: "#4ade80" }} />
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#ecfdf5" }}>Location</span>
                  </div>
                  {opp.location_area && (
                    <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>
                      {opp.location_area}, {opp.location_city}, India
                    </p>
                  )}

                  {/* Live Free Map Embed */}
                  <div style={{ position: "relative", width: "100%", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
                    <iframe 
                      width="100%" height="220" 
                      style={{ border: 0, display: "block" }} 
                      loading="lazy" allowFullScreen
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(`${opp.location_area ? opp.location_area + ', ' : ''}${opp.location_city}, India`)}&t=m&z=14&ie=UTF8&iwloc=&output=embed`}
                    />
                    {/* Subtle overlay to prevent accidental click redirects while allowing scroll */}
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)", borderRadius: 12 }} />
                  </div>

                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(`${opp.location_area ? opp.location_area + ', ' : ''}${opp.location_city}, India`)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, color: "#4ade80", display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}
                  >
                    Open in Google Maps <ExternalLink size={12} />
                  </a>
                </div>
              )}
              
              {isRemote && (
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Zap size={14} style={{ color: "#0099ff" }} />
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#e0f2fe" }}>Virtual Event</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>This opportunity is fully remote and can be attended from anywhere.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Related ── */}
        {related.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <h2 className="heading-3" style={{ marginBottom: 20 }}>More {meta.label}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 18 }}>
              {related.map((r, i) => <OpportunityCard key={r.id} opp={r} index={i} />)}
            </div>
          </div>
        )}
      </div>

      {/* inline responsive override for the detail grid */}
      <style>{`
        @media (max-width: 860px) {
          .detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ── Helpers ── */
function InfoSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: "22px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ color: "#4ade80" }}>{icon}</span>
        <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: 15, color: "#ecfdf5" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function MetaChip({ icon, label, value, accent = "#4ade80" }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div style={{
      padding: "12px 14px", borderRadius: 10,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      display: "flex", alignItems: "flex-start", gap: 10,
    }}>
      <span style={{ color: accent, marginTop: 2 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: accent === "#4ade80" ? "#ecfdf5" : accent }}>{value}</div>
      </div>
    </div>
  );
}

function ContactRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <span style={{ color: "#4ade80", marginTop: 2, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>{label}</div>
        {href
          ? <a href={href} style={{ fontSize: 13, fontWeight: 600, color: "#4ade80", textDecoration: "none" }}>{value}</a>
          : <div style={{ fontSize: 13, fontWeight: 600, color: "#ecfdf5" }}>{value}</div>
        }
      </div>
    </div>
  );
}
