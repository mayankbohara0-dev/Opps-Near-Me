"use client";
import { useState } from "react";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div style={{ padding: "20px", background: "rgba(201,100,66,0.08)", borderRadius: 12, border: "1px solid rgba(201,100,66,0.2)", display: "flex", alignItems: "center", gap: 12, color: "#c96442" }}>
        <CheckCircle size={20} />
        <div>
          <strong style={{ display: "block", fontSize: 15, marginBottom: 4 }}>You're on the list!</strong>
          <span style={{ fontSize: 13, color: "#d97757" }}>Check your inbox every Sunday for the top local opportunities.</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, flexDirection: "column" }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: "#87867f", marginBottom: 2 }}>Subscribe to the Weekly Digest</label>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#a6a6a6" }} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your student email..."
            required
            disabled={status === "loading"}
            style={{ width: "100%", padding: "14px 16px 14px 40px", borderRadius: 10, border: "1px solid #d1cfc5", background: "#f5f4ed", fontSize: 14, color: "#141413", outline: "none" }}
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          style={{ padding: "0 24px", borderRadius: 10, border: "none", background: "#c96442", color: "#fff", fontWeight: 500, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "background 0.2s" }}
        >
          {status === "loading" ? "..." : <>Subscribe <ArrowRight size={14} /></>}
        </button>
      </div>
      {status === "error" && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>Oops, something went wrong. Try again.</p>}
    </form>
  );
}
