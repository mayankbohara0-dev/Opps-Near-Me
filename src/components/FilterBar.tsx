"use client";
import { Category, TOP_INDIAN_CITIES } from "@/lib/data";
import { Search, MapPin, X, Clock } from "lucide-react";

const CATEGORIES: { key: Category | "all"; emoji: string; label: string }[] = [
  { key: "all",        emoji: "✦", label: "All" },
  { key: "sports",     emoji: "🏏", label: "Sports" },
  { key: "internship", emoji: "💼", label: "Internships" },
  { key: "event",      emoji: "🎤", label: "Events" },
  { key: "hackathon",  emoji: "💻", label: "Hackathons" },
];


interface Props {
  search: string; setSearch: (v: string) => void;
  category: Category | "all"; setCategory: (v: Category | "all") => void;
  city: string; setCity: (v: string) => void;
  timeline: string; setTimeline: (v: string) => void;
  cities: string[]; total: number;
}

export default function FilterBar({ search, setSearch, category, setCategory, city, setCity, timeline, setTimeline, cities, total }: Props) {
  // Combine all database scraped cities with our top Indian cities list, deeply deduplicating them.
  const mergedCities = Array.from(new Set([...cities, ...TOP_INDIAN_CITIES])).sort();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Row 1: Search + City ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={13} style={{
            position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
            color: "#a6a6a6", pointerEvents: "none",
          }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: 38, paddingRight: search ? 36 : 16, fontSize: 13 }}
            placeholder="Search opportunities…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search opportunities"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" style={{
              position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "#a6a6a6", display: "flex", padding: 2,
            }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Timeline selector */}
        <div style={{ position: "relative", width: 155 }}>
          <Clock size={12} style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "#a6a6a6", pointerEvents: "none", zIndex: 1,
          }} />
          <select className="input" value={timeline} onChange={e => setTimeline(e.target.value)} style={{ paddingLeft: 30, fontSize: 13, appearance: "none" }}>
            <option value="all">Any Timeline</option>
            <option value="urgent">Closing Soon (0-7d)</option>
            <option value="upcoming">Upcoming (8-30d)</option>
            <option value="far">Far (30d+)</option>
          </select>
        </div>

        {/* City selector */}
        <div style={{ position: "relative", width: 150 }}>
          <MapPin size={12} style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "#a6a6a6", pointerEvents: "none", zIndex: 1,
          }} />
          <select
            className="input"
            style={{ paddingLeft: 32, cursor: "pointer", fontSize: 13 }}
            value={city}
            onChange={e => setCity(e.target.value)}
            aria-label="Filter by city"
          >
            <option value="all">All Cities</option>
            {mergedCities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Row 2: Category tabs + count ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIES.map(cat => {
            const isActive = category === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                aria-pressed={isActive}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: 12, fontWeight: 500,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  letterSpacing: "-0.1px",
                  background: isActive ? "#ffffff" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isActive ? "transparent" : "rgba(255,255,255,0.08)"}`,
                  color: isActive ? "#000000" : "#a6a6a6",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <span style={{ fontSize: 13, color: "#a6a6a6", whiteSpace: "nowrap", letterSpacing: "-0.1px" }}>
          <span style={{ color: "#0099ff", fontWeight: 600 }}>{total}</span>{" "}
          {total === 1 ? "opportunity" : "opportunities"}
        </span>
      </div>
    </div>
  );
}
