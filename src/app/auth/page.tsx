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
  const [successMsg, setSuccessMsg] = useState("");
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
      } else {
        // Account created — switch to login tab with success message specifying verification is needed
        setSuccessMsg("Account created successfully! Please check your email to verify your account before signing in.");
        switchMode("login");
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

        {/* Mode toggle tabs */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          borderBottom: "1px solid #e8e6dc",
        }}>
          {(["login", "register"] as Mode[]).map(m => (
            <button key={m} onClick={() => switchMode(m)} style={{
              padding: "16px", fontSize: 14, fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
              cursor: "pointer", border: "none",
              letterSpacing: "-0.2px",
              background: mode === m ? "rgba(201,100,66,0.05)" : "transparent",
              borderBottom: mode === m ? "2px solid #c96442" : "2px solid transparent",
              color: mode === m ? "#141413" : "#87867f",
              transition: "all 0.2s",
              textTransform: "capitalize",
            }}>
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <div style={{ padding: "32px 32px 28px" }}>
          <>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <h1 style={{
                fontFamily: "'Lora', Georgia, serif", fontWeight: 500,
                fontSize: "1.5rem", letterSpacing: "normal",
                color: "#141413", marginBottom: 8,
              }}>
                {mode === "login" ? "Welcome back" : "Join LocalOpps"}
              </h1>
              <p style={{ fontSize: 13, color: "#5e5d59", lineHeight: 1.6 }}>
                {mode === "login"
                  ? "Sign in to browse opportunities near you."
                  : "Create your free account to get started."}
              </p>
            </div>

            {/* Location context badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 999, marginBottom: 24,
              background: "rgba(201,100,66,0.08)",
              border: "1px solid rgba(201,100,66,0.2)",
              fontSize: 11, color: "#c96442",
            }}>
              <MapPin size={10} style={{ color: "#c96442" }} />
              Live · Across India 🇮🇳
            </div>

            {/* ✅ Success banner (shown after registration) */}
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
                  onMouseEnter={e => (e.currentTarget.style.color = "#141413")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#87867f")}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            {mode === "login" && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -8 }}>
                <Link
                  href="/auth/forgot-password"
                  style={{
                    fontSize: 12,
                    color: "#c96442",
                    textDecoration: "none",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
                >
                  Forgot password?
                </Link>
              </div>
            )}

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
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                margin: "24px 0",
              }}>
                <div style={{ flex: 1, height: 1, background: "#e8e6dc" }} />
                <span style={{ fontSize: 11, color: "#87867f" }}>
                  {mode === "login" ? "New here?" : "Already have an account?"}
                </span>
                <div style={{ flex: 1, height: 1, background: "#e8e6dc" }} />
              </div>

              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "register" : "login")}
                style={{
                  width: "100%", padding: "11px",
                  borderRadius: 100,
                  background: "#e8e6dc",
                  border: "none",
                  boxShadow: "#e8e6dc 0px 0px 0px 0px, #d1cfc5 0px 0px 0px 1px",
                  color: "#4d4c48",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500, fontSize: 13,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                {mode === "login" ? "Create a new account" : "Sign in instead"}
              </button>
            </>

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

      {/* Footer note */}
      <p style={{
        position: "relative", zIndex: 1,
        marginTop: 32, fontSize: 12, color: "#87867f",
        letterSpacing: "-0.05px",
      }}>
        © 2026 LocalOpps · Across India
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
