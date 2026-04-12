"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, MapPin, Plus, LogOut, ChevronDown, ShieldCheck, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Nav links depend on auth/role — computed dynamically
const BASE_NAV = [
  { href: "/", label: "Browse" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen]     = useState(false);
  const path   = usePathname();
  const router = useRouter();
  const { user, isAdmin, loading, logout } = useAuth();
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navLinks = [
    ...BASE_NAV,
    ...(user ? [{ href: "/submit", label: "Submit" }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const handleLogout = () => {
    logout();
    setDropOpen(false);
    setMobileOpen(false);
    router.replace("/auth");
  };

  // Avatar initials
  const initials = user?.name
    ? user.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-50" style={{
      background: "rgba(0,0,0,0.88)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div className="container">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>

          {/* ── Logo ── */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "#0099ff",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-1px" }}>Lo</span>
            </div>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700, fontSize: 16,
              letterSpacing: "-0.5px", color: "#ffffff",
            }}>
              LocalOpps
            </span>
          </Link>

          {/* ── Location pill (center, hide on mobile) ── */}
          <div className="hidden sm:flex" style={{
            alignItems: "center", gap: 6,
            padding: "5px 14px", borderRadius: 999,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <MapPin size={11} style={{ color: "#a6a6a6" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#a6a6a6", letterSpacing: "-0.1px" }}>
              Bhiwandi · Thane · Mumbai
            </span>
          </div>

          {/* ── Desktop nav ── */}
          <nav className="hidden md:flex" style={{ alignItems: "center", gap: 4 }}>
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  padding: "7px 14px",
                  borderRadius: 999,
                  fontSize: 13, fontWeight: 500,
                  letterSpacing: "-0.1px",
                  color: path === l.href ? "#ffffff" : "#a6a6a6",
                  background: path === l.href ? "rgba(255,255,255,0.08)" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 5,
                }}
                onMouseEnter={e => {
                  if (path !== l.href) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff";
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
                  }
                }}
                onMouseLeave={e => {
                  if (path !== l.href) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "#a6a6a6";
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  }
                }}
              >
                {l.label === "Admin" && <ShieldCheck size={12} style={{ color: "#0099ff" }} />}
                {l.label}
              </Link>
            ))}

            {/* Auth area */}
            {!loading && (
              user ? (
                /* ── User dropdown ── */
                <div ref={dropRef} style={{ position: "relative", marginLeft: 8 }}>
                  <button
                    onClick={() => setDropOpen(o => !o)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 12px", borderRadius: 100,
                      background: dropOpen ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      cursor: "pointer", transition: "background 0.2s",
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: isAdmin ? "rgba(0,153,255,0.25)" : "rgba(255,255,255,0.1)",
                      border: isAdmin ? "1px solid rgba(0,153,255,0.4)" : "1px solid rgba(255,255,255,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, color: isAdmin ? "#0099ff" : "#ffffff",
                      letterSpacing: "-0.5px",
                    }}>
                      {initials}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#ffffff", letterSpacing: "-0.15px", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown size={12} style={{ color: "#a6a6a6", transform: dropOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </button>

                  {/* Dropdown panel */}
                  {dropOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 8px)", right: 0,
                      width: 220,
                      background: "#0e0e0e",
                      border: "1px solid rgba(255,255,255,0.09)",
                      borderRadius: 14,
                      boxShadow: "rgba(0,0,0,0.5) 0px 16px 50px, rgba(0,153,255,0.12) 0px 0px 0px 1px",
                      overflow: "hidden",
                      zIndex: 100,
                    }}>
                      {/* User info */}
                      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 10, marginBottom: 4,
                        }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: isAdmin ? "rgba(0,153,255,0.15)" : "rgba(255,255,255,0.08)",
                            border: isAdmin ? "1px solid rgba(0,153,255,0.3)" : "1px solid rgba(255,255,255,0.12)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, fontWeight: 700,
                            color: isAdmin ? "#0099ff" : "#ffffff",
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#ffffff", letterSpacing: "-0.3px" }}>
                              {user.name}
                            </div>
                            <div style={{ fontSize: 11, color: "#a6a6a6" }}>{user.email}</div>
                          </div>
                        </div>
                        {isAdmin && (
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "2px 8px", borderRadius: 999,
                            background: "rgba(0,153,255,0.1)",
                            border: "1px solid rgba(0,153,255,0.2)",
                            fontSize: 10, fontWeight: 600, color: "#0099ff",
                            marginTop: 6,
                          }}>
                            <ShieldCheck size={9} /> Admin
                          </div>
                        )}
                      </div>

                      {/* Links */}
                      <div style={{ padding: "6px" }}>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setDropOpen(false)}
                            style={{
                              display: "flex", alignItems: "center", gap: 8,
                              padding: "9px 10px", borderRadius: 8,
                              fontSize: 13, color: "#0099ff", textDecoration: "none",
                              transition: "background 0.15s",
                              fontWeight: 500,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,153,255,0.08)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <ShieldCheck size={14} /> Admin Panel
                          </Link>
                        )}

                        <button
                          onClick={handleLogout}
                          style={{
                            width: "100%",
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "9px 10px", borderRadius: 8,
                            fontSize: 13, color: "#f87171",
                            background: "none", border: "none",
                            cursor: "pointer", fontFamily: "inherit",
                            fontWeight: 500, textAlign: "left",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.08)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Not logged in ── */
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
                  <Link href="/auth" style={{
                    padding: "7px 14px", borderRadius: 100,
                    fontSize: 13, fontWeight: 500, color: "#a6a6a6",
                    textDecoration: "none", transition: "color 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#a6a6a6")}
                  >Sign In</Link>
                  <Link href="/auth" style={{
                    padding: "8px 16px", borderRadius: 100,
                    background: "#ffffff", color: "#000000",
                    fontSize: 13, fontWeight: 600, textDecoration: "none",
                    letterSpacing: "-0.2px",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    <Plus size={13} style={{ display: "inline", marginRight: 4 }} />
                    List Free
                  </Link>
                </div>
              )
            )}
          </nav>

          {/* ── Mobile toggle ── */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden"
            style={{
              padding: 8, borderRadius: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#a6a6a6", cursor: "pointer", display: "flex",
            }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div style={{
          background: "rgba(0,0,0,0.97)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div className="container" style={{ paddingTop: 16, paddingBottom: 20, display: "flex", flexDirection: "column", gap: 4 }}>
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  padding: "11px 14px", borderRadius: 10,
                  fontSize: 14, fontWeight: 500,
                  background: path === l.href ? "rgba(255,255,255,0.07)" : "transparent",
                  color: path === l.href ? "#ffffff" : "#a6a6a6",
                  display: "flex", alignItems: "center", gap: 6,
                  textDecoration: "none", letterSpacing: "-0.1px",
                }}
              >
                {l.label === "Admin" && <ShieldCheck size={13} style={{ color: "#0099ff" }} />}
                {l.label}
              </Link>
            ))}

            <div style={{ margin: "8px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }} />

            {user ? (
              <>
                <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: isAdmin ? "rgba(0,153,255,0.15)" : "rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700,
                    color: isAdmin ? "#0099ff" : "#ffffff",
                  }}>{initials}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#ffffff" }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: "#a6a6a6" }}>{user.email}</div>
                  </div>
                </div>
                <button onClick={handleLogout} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "11px 14px", borderRadius: 10,
                  fontSize: 14, color: "#f87171",
                  background: "rgba(248,113,113,0.06)",
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                  fontWeight: 500, textAlign: "left",
                }}>
                  <LogOut size={14} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" onClick={() => setMobileOpen(false)} style={{
                  display: "block", padding: "11px 14px", borderRadius: 10,
                  fontSize: 14, fontWeight: 500, color: "#a6a6a6",
                  textDecoration: "none",
                }}>Sign In</Link>
                <Link href="/auth" onClick={() => setMobileOpen(false)} style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "13px", borderRadius: 100,
                  background: "#ffffff", color: "#000000",
                  fontSize: 14, fontWeight: 600, textDecoration: "none",
                  marginTop: 4,
                }}>
                  <Plus size={14} style={{ marginRight: 4 }} /> List Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
