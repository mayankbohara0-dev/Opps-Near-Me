"use client";
import Link from "next/link";
import { Opportunity, CATEGORY_META, getDaysUntilDeadline } from "@/lib/data";
import { MapPin, Clock, ArrowRight, Calendar, ExternalLink } from "lucide-react";
import { useState } from "react";

const CAT_CONFIG: Record<string, {
  ring: string; pillBg: string; pillText: string;
  topBar: string; hoverGlow: string; emoji: string;
}> = {
  sports:     { ring: "rgba(249,115,22,0.25)",  pillBg: "rgba(249,115,22,0.1)",  pillText: "#fb923c", topBar: "#f97316", hoverGlow: "rgba(249,115,22,0.06)",  emoji: "🏏" },
  internship: { ring: "rgba(0,153,255,0.25)",   pillBg: "rgba(0,153,255,0.1)",   pillText: "#0099ff", topBar: "#0099ff", hoverGlow: "rgba(0,153,255,0.06)",   emoji: "💼" },
  event:      { ring: "rgba(168,85,247,0.25)",  pillBg: "rgba(168,85,247,0.1)",  pillText: "#c084fc", topBar: "#a855f7", hoverGlow: "rgba(168,85,247,0.06)",  emoji: "🎤" },
  hackathon:  { ring: "rgba(99,179,237,0.25)",  pillBg: "rgba(99,179,237,0.1)",  pillText: "#63b3ed", topBar: "#63b3ed", hoverGlow: "rgba(99,179,237,0.06)",  emoji: "💻" },
};

export default function OpportunityCard({ opp, index = 0 }: { opp: Opportunity; index?: number }) {
  const meta    = CATEGORY_META[opp.category];
  const days    = getDaysUntilDeadline(opp.deadline);
  const urgent  = days >= 0 && days <= 3;
  const expired = days < 0;
  const cfg     = CAT_CONFIG[opp.category] ?? CAT_CONFIG.hackathon;

  const [hovered, setHovered] = useState(false);

  const deadlineColor = expired ? "rgba(255,255,255,0.25)" : urgent ? "#f87171" : days <= 7 ? "#fbbf24" : "#a6a6a6";
  const deadlineText  = expired ? "Expired" : days === 0 ? "Today!" : days === 1 ? "1 day left" : `${days} days left`;

  return (
    <Link
      href={`/opportunity/${opp.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column",
        textDecoration: "none", overflow: "hidden",
        animation: `fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) ${index * 45}ms both`,
        background: hovered ? `rgba(9,9,9,1)` : "#090909",
        boxShadow: hovered
          ? `${cfg.ring} 0px 0px 0px 1px, rgba(0,0,0,0.4) 0px 16px 60px, 0 0 40px ${cfg.hoverGlow}`
          : `rgba(0,153,255,0.12) 0px 0px 0px 1px`,
        borderRadius: 16,
        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        position: "relative",
      }}
    >
      {/* Category accent bar */}
      <div style={{
        height: 3,
        background: cfg.topBar,
        opacity: hovered ? 1 : 0.6,
        flexShrink: 0,
        transition: "opacity 0.25s",
      }} />

      <div style={{ padding: "20px 20px 18px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>

        {/* Badge row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 999,
            fontSize: 11, fontWeight: 600,
            background: cfg.pillBg, color: cfg.pillText,
            border: `1px solid ${cfg.ring}`,
            letterSpacing: "0.01em",
          }}>
            {cfg.emoji} {meta.label}
          </span>
          {urgent && !expired && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 9px", borderRadius: 999,
              fontSize: 10, fontWeight: 600,
              background: "rgba(248,113,113,0.1)",
              color: "#f87171",
              border: "1px solid rgba(248,113,113,0.25)",
            }}>
              🔴 Closing Soon
            </span>
          )}
        </div>

        {/* Title + organizer */}
        <div>
          <h3 style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600, fontSize: 15,
            color: "#ffffff", lineHeight: 1.3,
            letterSpacing: "-0.4px",
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
            transition: "color 0.2s",
          }}>
            {opp.title}
          </h3>
          <p style={{
            fontSize: 12, color: "#a6a6a6",
            marginTop: 5, letterSpacing: "-0.1px",
          }}>
            {opp.organizer_name}
          </p>
        </div>

        {/* Description snippet */}
        <p style={{
          fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.65,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
          flex: 1,
          letterSpacing: "-0.05px",
        }}>
          {opp.description}
        </p>

        {/* Meta info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <MetaRow icon={<MapPin size={10} />} text={`${opp.location_city} · ${opp.location_area}`} />
          <MetaRow
            icon={<Clock size={10} />}
            text={`${new Date(opp.deadline).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})} — ${deadlineText}`}
            color={deadlineColor}
          />
          {opp.event_date && (
            <MetaRow icon={<Calendar size={10} />}
              text={`Event: ${new Date(opp.event_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}`} />
          )}
        </div>

        {/* CTA strip */}
        <div style={{
          marginTop: 2, padding: "11px 16px",
          background: hovered ? `rgba(0,153,255,0.1)` : "rgba(0,153,255,0.04)",
          border: `1px solid ${hovered ? "rgba(0,153,255,0.35)" : "rgba(0,153,255,0.12)"}`,
          borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          color: hovered ? "#0099ff" : "rgba(0,153,255,0.7)",
          fontSize: 12, fontWeight: 500,
          letterSpacing: "-0.15px",
          transition: "all 0.25s",
        }}>
          View Details
          <ArrowRight size={12} style={{ transition: "transform 0.2s", transform: hovered ? "translateX(3px)" : "none" }} />
        </div>

      </div>
    </Link>
  );
}

function MetaRow({ icon, text, color = "rgba(255,255,255,0.3)" }: { icon: React.ReactNode; text: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, color, fontSize: 12, letterSpacing: "-0.1px" }}>
      <span style={{ flexShrink: 0, opacity: 0.7 }}>{icon}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>
    </div>
  );
}
