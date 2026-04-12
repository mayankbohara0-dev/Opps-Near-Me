"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction, registerAction } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, ArrowRight, Sparkles, MapPin } from "lucide-react";
import Link from "next/link";

type Mode = "login" | "register";

export default function AuthPage() {
  const { user, setUser } = useAuth();
  const router = useRouter();

  const [mode, setMode]         = useState<Mode>("login");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<{ name?: string; email?: string; password?: string; general?: string }>({});

  // Already logged in → redirect home
  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  const clearErr = (f: string) => setErrors(e => ({ ...e, [f]: "" }));

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErrors({});
    setLoading(true);

    await new Promise(r => setTimeout(r, 1000)); // feel of async

    if (mode === "login") {
      const res = await loginAction(email, password);
      if ("error" in res) {
        setErrors({ [res.error.field ?? "general"]: res.error.message });
      } else {
        setUser(res.user);
        router.replace("/");
      }
    } else {
      const res = await registerAction(name, email, password);
      if ("error" in res) {
        setErrors({ [res.error.field ?? "general"]: res.error.message });
      } else if ("pendingVerification" in res) {
        setPendingVerification(true);
      }
    }
    setLoading(false);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setErrors({});
    setName(""); setEmail(""); setPassword("");
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#000000",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px",
      position: "relative", overflow: "hidden",
    }}>
      {/* blue aurora */}
      <div style={{
        position: "fixed", top: 0, left: "50%",
        transform: "translateX(-50%)",
        width: 800, height: 400,
        background: "radial-gradient(ellipse at top, rgba(0,153,255,0.1) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* grid bg */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        pointerEvents: "none",
      }} />

      {/* Logo / brand */}
      <Link href="/" style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 48, textDecoration: "none",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "#0099ff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-1px" }}>Lo</span>
        </div>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700, fontSize: 18,
          letterSpacing: "-0.5px", color: "#ffffff",
        }}>LocalOpps</span>
      </Link>

      {/* Card */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 420,
        background: "#090909",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        boxShadow: "rgba(0,153,255,0.15) 0px 0px 0px 1px, rgba(0,0,0,0.5) 0px 32px 80px",
        overflow: "hidden",
        animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
      }}>
        {/* Top blue accent line */}
        <div style={{ height: 2, background: "#0099ff", opacity: 0.7 }} />

        {/* Mode toggle tabs */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          {(["login", "register"] as Mode[]).map(m => (
            <button key={m} onClick={() => switchMode(m)} style={{
              padding: "16px", fontSize: 14, fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
              cursor: "pointer", border: "none",
              letterSpacing: "-0.2px",
              background: mode === m ? "rgba(0,153,255,0.05)" : "transparent",
              borderBottom: mode === m ? "2px solid #0099ff" : "2px solid transparent",
              color: mode === m ? "#ffffff" : "#a6a6a6",
              transition: "all 0.2s",
              textTransform: "capitalize",
            }}>
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <div style={{ padding: "32px 32px 28px" }}>
          {pendingVerification ? (
            <div className="anim-in" style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%", margin: "0 auto 24px",
                background: "rgba(0,153,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
                color: "#0099ff"
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="m16 19 2 2 4-4"/></svg>
              </div>
              <h2 className="heading-2" style={{ marginBottom: 12 }}>Check your inbox</h2>
              <p style={{ color: "#a6a6a6", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                We've sent a verification link to<br/> <strong style={{color:"white"}}>{email}</strong>.
              </p>
              <button onClick={() => setPendingVerification(false)} className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }}>
                Return to Login
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 700,
              fontSize: "1.5rem", letterSpacing: "-1px",
              color: "#ffffff", marginBottom: 8,
            }}>
              {mode === "login" ? "Welcome back" : "Join LocalOpps"}
            </h1>
            <p style={{ fontSize: 13, color: "#a6a6a6", lineHeight: 1.6 }}>
              {mode === "login"
                ? "Sign in to browse opportunities near you."
                : "Create your free account to get started."}
            </p>
          </div>

          {/* Location context badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 999, marginBottom: 24,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            fontSize: 11, color: "#a6a6a6",
          }}>
            <MapPin size={10} style={{ color: "#0099ff" }} />
            Bhiwandi · Thane · Mumbai
          </div>

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

          <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Name — register only */}
            {mode === "register" && (
              <Field label="Full Name" error={errors.name}>
                <input
                  type="text" value={name}
                  onChange={e => { setName(e.target.value); clearErr("name"); }}
                  placeholder="e.g. Rahul Sharma"
                  style={inputStyle(!!errors.name)}
                  autoComplete="name"
                />
              </Field>
            )}

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

            {/* Password */}
            <Field label="Password" error={errors.password}>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearErr("password"); }}
                  placeholder={mode === "register" ? "Min. 6 characters" : "Your password"}
                  style={{ ...inputStyle(!!errors.password), paddingRight: 44 }}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  style={{
                    position: "absolute", right: 13, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#a6a6a6", display: "flex", padding: 2,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#a6a6a6")}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
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
                background: loading ? "rgba(255,255,255,0.7)" : "#ffffff",
                color: "#000000",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600, fontSize: 14,
                letterSpacing: "-0.2px",
                border: "none", cursor: loading ? "wait" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 15, height: 15, borderRadius: "50%",
                    border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000",
                    display: "inline-block",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  {mode === "login" ? "Signing in…" : "Creating account…"}
                </>
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            margin: "24px 0",
          }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              {mode === "login" ? "New here?" : "Already have an account?"}
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          </div>

          <button
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
            style={{
              width: "100%", padding: "11px",
              borderRadius: 100,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "#ffffff",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500, fontSize: 13,
              letterSpacing: "-0.15px",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          >
            {mode === "login" ? "Create a new account" : "Sign in instead"}
          </button>

        </div>
          </>
        )}
        </div>

        {/* Bottom note */}
        <div style={{
          padding: "16px 32px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          textAlign: "center",
        }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>
            Free forever · No spam · Students only
          </p>
        </div>
      </div>

      {/* Footer note */}
      <p style={{
        position: "relative", zIndex: 1,
        marginTop: 32, fontSize: 12, color: "rgba(255,255,255,0.2)",
        letterSpacing: "-0.05px",
      }}>
        © 2026 LocalOpps · Bhiwandi, Thane &amp; Mumbai
      </p>

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
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${hasError ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 10,
    color: "#ffffff",
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
        color: "#a6a6a6", letterSpacing: "-0.05px",
      }}>{label}</label>
      <div style={{ position: "relative" }}>{children}</div>
      {error && (
        <p style={{ fontSize: 12, color: "#f87171", marginTop: 2 }}>{error}</p>
      )}
    </div>
  );
}
