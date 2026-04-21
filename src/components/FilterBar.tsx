"use client";
import { Category, TOP_INDIAN_CITIES } from "@/lib/data";
import { Search, MapPin, X, Clock, Navigation } from "lucide-react";
import { useState } from "react";

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
  const [locating, setLocating] = useState(false);

  const mergedCities = Array.from(new Set([...cities, ...TOP_INDIAN_CITIES])).sort();

  const handleNearMe = () => {
    if (!navigator.geolocation) { alert("Geolocation is not supported by your browser"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (!res.ok) throw new Error("Failed to fetch location data");
          const data = await res.json();
          const address = data.address || {};
          let detectedCity = address.city || address.town || address.village || address.state_district || address.county;
          if (detectedCity) {
            detectedCity = detectedCity.replace(/ District/i, "").trim();
            const match = mergedCities.find(c => c.toLowerCase() === detectedCity.toLowerCase());
            if (match) { setCity(match); }
            else { alert(`Detected: ${detectedCity}, but no specific opportunities found here yet.`); }
          } else { alert("Could not detect city from your location."); }
        } catch (e) { console.error(e); alert("Error detecting location."); }
        finally { setLocating(false); }
      },
      (error) => { console.error(error); alert("Unable to retrieve your location."); setLocating(false); }
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Row 1: Search + filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={13} style={{
            position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
            color: "#87867f", pointerEvents: "none",
          }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: 38, paddingRight: search ? 36 : 16, fontSize: 14 }}
            placeholder="Search opportunities…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search opportunities"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" style={{
              position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "#87867f", display: "flex", padding: 2,
            }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Timeline */}
        <div style={{ position: "relative", width: 160 }}>
          <Clock size={12} style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "#87867f", pointerEvents: "none", zIndex: 1,
          }} />
          <select className="input" value={timeline} onChange={e => setTimeline(e.target.value)}
            style={{ paddingLeft: 30, fontSize: 14, appearance: "none" }}>
            <option value="all">Any Timeline</option>
            <option value="urgent">Closing Soon (0-7d)</option>
            <option value="upcoming">Upcoming (8-30d)</option>
            <option value="far">Far (30d+)</option>
          </select>
        </div>

        {/* City */}
        <div style={{ position: "relative", width: 150 }}>
          <MapPin size={12} style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "#87867f", pointerEvents: "none", zIndex: 1,
          }} />
          <select
            className="input"
            style={{ paddingLeft: 32, cursor: "pointer", fontSize: 14 }}
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

        {/* Near Me */}
        <button
          onClick={handleNearMe}
          disabled={locating}
          title="Find opportunities near me"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "0 14px", borderRadius: 12,
            background: locating ? "rgba(201,100,66,0.04)" : "rgba(201,100,66,0.09)",
            color: locating ? "rgba(201,100,66,0.45)" : "#c96442",
            border: `1px solid ${locating ? "rgba(201,100,66,0.15)" : "rgba(201,100,66,0.25)"}`,
            fontWeight: 500, fontSize: 13, cursor: locating ? "default" : "pointer",
            transition: "all 0.2s", height: 40,
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={e => { if(!locating) e.currentTarget.style.background = "rgba(201,100,66,0.14)"; }}
          onMouseLeave={e => { if(!locating) e.currentTarget.style.background = "rgba(201,100,66,0.09)"; }}
        >
          <Navigation size={13} />
          {locating ? "Locating..." : "Near Me"}
        </button>
      </div>

      {/* Row 2: Category tabs + count */}
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
                  borderRadius: 24,
                  fontSize: 13, fontWeight: isActive ? 500 : 400,
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  background: isActive ? "#141413" : "#e8e6dc",
                  border: `1px solid ${isActive ? "#141413" : "#d1cfc5"}`,
                  color: isActive ? "#faf9f5" : "#5e5d59",
                  display: "flex", alignItems: "center", gap: 5,
                  boxShadow: isActive
                    ? "#141413 0px 0px 0px 0px, rgba(0,0,0,0.12) 0px 0px 0px 1px"
                    : "#e8e6dc 0px 0px 0px 0px, #d1cfc5 0px 0px 0px 1px",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#d1cfc5";
                    e.currentTarget.style.color = "#141413";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#e8e6dc";
                    e.currentTarget.style.color = "#5e5d59";
                  }
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <span style={{ fontSize: 13, color: "#87867f", whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif" }}>
          <span style={{ color: "#c96442", fontWeight: 500 }}>{total}</span>{" "}
          {total === 1 ? "opportunity" : "opportunities"}
        </span>
      </div>
    </div>
  );
}
