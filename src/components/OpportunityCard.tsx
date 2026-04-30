"use client";
import Link from "next/link";
import { Opportunity, CATEGORY_META, getDaysUntilDeadline } from "@/lib/data";
import { MapPin, Clock, ArrowRight, Calendar, Flag } from "lucide-react";
import { useState } from "react";

const CAT_CONFIG: Record<string, {
  barColor: string; pillBg: string; pillText: string; pillBorder: string; emoji: string;
}> = {
  sports:     { barColor: "#c96442", pillBg: "rgba(201,100,66,0.08)", pillText: "#c96442", pillBorder: "rgba(201,100,66,0.22)", emoji: "🏏" },
  internship: { barColor: "#c96442", pillBg: "rgba(201,100,66,0.08)", pillText: "#c96442", pillBorder: "rgba(201,100,66,0.22)", emoji: "💼" },
  event:      { barColor: "#c96442", pillBg: "rgba(201,100,66,0.08)", pillText: "#c96442", pillBorder: "rgba(201,100,66,0.22)", emoji: "🎤" },
  hackathon:  { barColor: "#c96442", pillBg: "rgba(201,100,66,0.08)", pillText: "#c96442", pillBorder: "rgba(201,100,66,0.22)", emoji: "💻" },
};

export default function OpportunityCard({ opp, index = 0, locked = false }: { opp: Opportunity; index?: number; locked?: boolean }) {
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);

  const handleReport = async (e: React.MouseEvent) => {
     e.preventDefault(); // Stop entire card from navigating
     e.stopPropagation();
     if(reported || reporting) return;
     setReporting(true);
     try {
       await fetch(`/api/opportunity/${opp.id}/report`, { method: "POST" });
       setReported(true);
     } catch(err) {}
     setReporting(false);
  };

  const meta    = CATEGORY_META[opp.category] ?? CATEGORY_META.hackathon;
  const days    = getDaysUntilDeadline(opp.deadline);
  const urgent  = days >= 0 && days <= 3;
  const expired = days < 0;
  const cfg     = CAT_CONFIG[opp.category] ?? CAT_CONFIG.hackathon;

  const deadlineColor = expired ? "#87867f" : urgent ? "#b53333" : days <= 7 ? "#92400e" : "#87867f";
  const deadlineText  = expired ? "Expired" : days === 0 ? "Today!" : days === 1 ? "1 day left" : `${days} days left`;

  const staggerDelay = Math.min(index, 6) * 60;

  return (
    <Link
      href={locked ? "/auth" : `/opportunity/${opp.id}`}
      className="opp-card"
      data-cat={opp.category}
      style={{ animation: `fadeUp 0.65s cubic-bezier(0.16,1,0.3,1) ${staggerDelay}ms both` }}
    >
      {/* Category terracotta accent bar */}
      <div
        className="cat-bar"
        style={{ background: cfg.barColor }}
      />

      <div style={{ padding: "22px 22px 20px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>

        {/* Badge row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              className="anim-badge"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 24,
                fontSize: 11, fontWeight: 500,
                background: cfg.pillBg, color: cfg.pillText,
                border: `1px solid ${cfg.pillBorder}`,
                letterSpacing: "0.04em",
                animationDelay: `${staggerDelay + 80}ms`,
              }}
            >
              {cfg.emoji} {meta.label}
            </span>
            {urgent && !expired && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 9px", borderRadius: 24,
                fontSize: 10, fontWeight: 500,
                background: "rgba(181,51,51,0.08)",
                color: "#b53333",
                border: "1px solid rgba(181,51,51,0.2)",
                letterSpacing: "0.04em",
              }}>
                <span className="live-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: "#b53333", display: "inline-block" }} />
                Closing Soon
              </span>
            )}
          </div>
          <button 
            onClick={handleReport}
            title={reported ? "Reported" : "Report dead link or fake event"}
            style={{ 
              background: reported ? "rgba(239,68,68,0.1)" : "transparent", 
              color: reported ? "#ef4444" : "#b0aea5", 
              border: "none", cursor: "pointer", padding: 6, borderRadius: 6, 
              display: "flex", transition: "all 0.2s" 
            }}
          >
            <Flag size={12} fill={reported ? "#ef4444" : "none"} />
          </button>
        </div>

        {/* Title + organizer */}
        <div>
          <h3 style={{
            fontFamily: "'Lora', Georgia, serif",
            fontWeight: 500, fontSize: 16,
            color: "#141413", lineHeight: 1.30,
            letterSpacing: "normal",
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
            margin: 0,
          }}>
            {opp.title}
          </h3>
          <p style={{ fontSize: 12, color: "#87867f", marginTop: 5, fontFamily: "'Inter', sans-serif" }}>
            {opp.organizer_name}
          </p>
        </div>

        {/* Description snippet */}
        <p style={{
          fontSize: 13, fontFamily: "'Inter', sans-serif",
          color: "#5e5d59", lineHeight: 1.60,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
          flex: 1,
          margin: 0,
        }}>
          {locked ? (
            <span style={{ filter: "blur(4px)", userSelect: "none" }}>
              This is a hidden description. Please log in or register to view the complete details and apply for this opportunity.
            </span>
          ) : (
            opp.description
          )}
        </p>

        {/* Meta info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <MetaRow icon={<MapPin size={10} />} text={`${opp.location_city} · ${opp.location_area}`} />
          <MetaRow
            icon={<Clock size={10} />}
            text={`${new Date(opp.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} — ${deadlineText}`}
            color={deadlineColor}
          />
          {opp.event_date && (
            <MetaRow icon={<Calendar size={10} />}
              text={`Event: ${new Date(opp.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`} />
          )}
        </div>

        {/* CTA strip */}
        <div
          className="cta-strip"
          style={{
            marginTop: 2, padding: "11px 16px",
            background: "#f5f4ed",
            border: "1px solid #e8e6dc",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            color: "#5e5d59",
            fontSize: 13, fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {locked ? "🔒 Login to View" : "View Details"}
          <ArrowRight size={13} className="cta-arrow" style={{ color: "#c96442" }} />
        </div>

      </div>
    </Link>
  );
}

function MetaRow({ icon, text, color = "#87867f" }: { icon: React.ReactNode; text: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, color, fontSize: 12, fontFamily: "'Inter', sans-serif" }}>
      <span style={{ flexShrink: 0, opacity: 0.7 }}>{icon}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>
    </div>
  );
}
