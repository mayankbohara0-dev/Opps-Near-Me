"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});

  const clearErr = (f: string) => setErrors(e => ({ ...e, [f]: "" }));

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErrors({});
    
    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSuccessMsg("If this email is registered, you will receive a reset link shortly.");
      } else {
        const data = await res.json();
        setErrors({ general: data.error || "Failed. Please try again." });
      }
    } catch (err) {
      setErrors({ general: "An error occurred. Please try again." });
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f5f4ed",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Warm aurora wash */}
      <div style={{
        position: "fixed", top: -60, left: "50%",
        transform: "translateX(-50%)",
        width: 800, height: 500,
        background: "radial-gradient(ellipse at top, rgba(201,100,66,0.06) 0%, transparent 65%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Logo / brand */}
      <Link href="/" style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 48, textDecoration: "none",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "#c96442",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#faf9f5", letterSpacing: "-1px" }}>Lo</span>
        </div>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700, fontSize: 18,
          letterSpacing: "-0.5px", color: "#141413",
        }}>LocalOpps</span>
      </Link>

      {/* Card */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 420,
        background: "#faf9f5",
        border: "1px solid #f0eee6",
        borderRadius: 20,
        boxShadow: "rgba(0,0,0,0.05) 0px 4px 24px",
        overflow: "hidden",
        animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
      }}>
        {/* Top blue accent line */}
        <div style={{ height: 2, background: "#c96442", opacity: 0.8 }} />

        <div style={{ padding: "32px 32px 28px" }}>
          <>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <h1 style={{
                fontFamily: "'Lora', Georgia, serif", fontWeight: 500,
                fontSize: "1.5rem", letterSpacing: "normal",
                color: "#141413", marginBottom: 8,
              }}>
                Reset Password
              </h1>
              <p style={{ fontSize: 13, color: "#5e5d59", lineHeight: 1.6 }}>
                Enter your email and we'll send you a link to reset your password.
              </p>
            </div>

            {/* ✅ Success banner */}
            {successMsg && (
              <div style={{
                padding: "10px 14px", borderRadius: 8, marginBottom: 20,
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.25)",
                fontSize: 13, color: "#4ade80",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                ✅ {successMsg}
              </div>
            )}

            {/* General error banner */}
            {errors.general && (
              <div style={{
                padding: "10px 14px", borderRadius: 8, marginBottom: 20,
                background: "rgba(248,113,113,0.07)",
                border: "1px solid rgba(248,113,113,0.2)",
                fontSize: 13, color: "#f87171",
              }}>
                {errors.general}
              </div>
            )}

            {!successMsg ? (
              <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Email */}
                <Field label="Email Address" error={errors.email}>
                  <input
                    type="email" value={email}
                    onChange={e => { setEmail(e.target.value); clearErr("email"); }}
                    placeholder="you@email.com"
                    style={inputStyle(!!errors.email)}
                    autoComplete="email"
                  />
                </Field>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: 8,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", padding: "13px",
                    borderRadius: 100,
                    background: loading ? "rgba(201,100,66,0.7)" : "#c96442",
                    color: "#faf9f5",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500, fontSize: 14,
                    border: "none", cursor: loading ? "wait" : "pointer",
                    boxShadow: "#c96442 0px 0px 0px 0px, rgba(201,100,66,0.3) 0px 0px 0px 1px",
                    transition: "opacity 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.90"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: 15, height: 15, borderRadius: "50%",
                        border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000",
                        display: "inline-block",
                        animation: "spin 0.8s linear infinite",
                      }} />
                      Sending Link…
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            ) : (
               <Link
                 href="/auth"
                 style={{
                   display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                   width: "100%", padding: "13px",
                   borderRadius: 100,
                   background: "#e8e6dc",
                   border: "1px solid #d1cfc5",
                   color: "#4d4c48",
                   fontFamily: "'Inter', sans-serif",
                   fontWeight: 500, fontSize: 13,
                   cursor: "pointer",
                   textDecoration: "none",
                   transition: "opacity 0.2s",
                 }}
                 onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                 onMouseLeave={e => e.currentTarget.style.opacity = "1"}
               >
                 Back to Sign In
               </Link>
            )}

            {/* Divider */}
            {!successMsg && (
              <>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  margin: "24px 0",
                }}>
                  <div style={{ flex: 1, height: 1, background: "#e8e6dc" }} />
                  <span style={{ fontSize: 11, color: "#87867f" }}>Or</span>
                  <div style={{ flex: 1, height: 1, background: "#e8e6dc" }} />
                </div>

                <Link
                  href="/auth"
                  style={{
                    display: "block", textAlign: "center",
                    width: "100%", padding: "11px",
                    borderRadius: 100,
                    background: "#e8e6dc",
                    border: "1px solid #d1cfc5",
                    color: "#4d4c48",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500, fontSize: 13,
                    cursor: "pointer",
                    textDecoration: "none",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  Back to Sign In
                </Link>
              </>
             )}
          </>
        </div>

        {/* Bottom note */}
        <div style={{
          padding: "16px 32px",
          borderTop: "1px solid #f0eee6",
          textAlign: "center",
        }}>
          <p style={{ fontSize: 11, color: "#87867f", lineHeight: 1.6 }}>
            Free forever · No spam · Students only
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "11px 14px",
    background: "#ffffff",
    border: `1px solid ${hasError ? "rgba(248,113,113,0.5)" : "#e8e6dc"}`,
    borderRadius: 10,
    color: "#141413",
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 12, fontWeight: 500,
        color: "#5e5d59", letterSpacing: "-0.05px",
      }}>{label}</label>
      <div style={{ position: "relative" }}>{children}</div>
      {error && (
        <p style={{ fontSize: 12, color: "#f87171", marginTop: 2 }}>{error}</p>
      )}
    </div>
  );
}
