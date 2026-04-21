"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("localopps_cookie_consent");
    if (!consent) setShow(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("localopps_cookie_consent", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: "#faf9f5",
      border: "1px solid #e8e6dc",
      padding: "20px 24px", borderRadius: 16, maxWidth: 360,
      boxShadow: "rgba(0,0,0,0.08) 0px 8px 40px, rgba(0,0,0,0.03) 0px 2px 8px",
      fontFamily: "'Inter', sans-serif",
      animation: "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <h4 style={{
          fontFamily: "'Lora', Georgia, serif",
          color: "#141413", fontSize: 16, fontWeight: 500, margin: 0,
        }}>Cookie tracking</h4>
        <button
          onClick={() => setShow(false)}
          style={{
            background: "#e8e6dc", border: "1px solid #d1cfc5",
            color: "#5e5d59", cursor: "pointer", padding: "4px 6px",
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
            boxShadow: "#e8e6dc 0px 0px 0px 0px, #d1cfc5 0px 0px 0px 1px",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#d1cfc5")}
          onMouseLeave={e => (e.currentTarget.style.background = "#e8e6dc")}
        >
          <X size={14} />
        </button>
      </div>
      <p style={{ color: "#5e5d59", fontSize: 14, lineHeight: 1.60, marginBottom: 16 }}>
        We use cookies to improve your experience, ensure security, and track website performance.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleAccept} style={{
          background: "#c96442", color: "#faf9f5", fontWeight: 500, fontSize: 14,
          padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer",
          flex: 1, fontFamily: "inherit",
          boxShadow: "#c96442 0px 0px 0px 0px, rgba(201,100,66,0.3) 0px 0px 0px 1px",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          Accept
        </button>
        <button onClick={() => setShow(false)} style={{
          background: "#e8e6dc", color: "#4d4c48", fontWeight: 500, fontSize: 14,
          padding: "9px 16px", borderRadius: 10, border: "none", cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "#e8e6dc 0px 0px 0px 0px, #d1cfc5 0px 0px 0px 1px",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
