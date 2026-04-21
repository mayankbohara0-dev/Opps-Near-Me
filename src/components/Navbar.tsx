"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, MapPin, Plus, LogOut, ChevronDown, ShieldCheck } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const BASE_NAV = [
  { href: "/", label: "Browse" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen]     = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const path   = usePathname();
  const router = useRouter();
  const { user, isAdmin, loading, logout } = useAuth();
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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

  const initials = user?.name
    ? user.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: scrolled ? "rgba(245,244,237,0.97)" : "#f5f4ed",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: `1px solid ${scrolled ? "#e8e6dc" : "#f0eee6"}`,
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        boxShadow: scrolled ? "rgba(0,0,0,0.04) 0px 2px 12px" : "none",
      }}
    >
      <div className="container">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>

          {/* ── Logo ── */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="Logo" style={{ height: 52, width: 52, objectFit: "contain" }} />
            <span style={{
              fontFamily: "'Lora', Georgia, serif",
              fontWeight: 500, fontSize: 18,
              letterSpacing: "normal", color: "#141413",
            }}>
              LocalOpps
            </span>
          </Link>

          {/* ── Location pill ── */}
          <div className="hidden sm:flex" style={{
            alignItems: "center", gap: 6,
            padding: "5px 14px", borderRadius: 999,
            background: "rgba(201,100,66,0.08)",
            border: "1px solid rgba(201,100,66,0.18)",
          }}>
            <MapPin size={11} style={{ color: "#c96442" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#c96442" }}>
              Live · Across India 🇮🇳
            </span>
          </div>

          {/* ── Desktop nav ── */}
          <nav className="hidden md:flex" style={{ alignItems: "center", gap: 2 }}>
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  fontSize: 15, fontWeight: path === l.href ? 500 : 400,
                  color: path === l.href ? "#141413" : "#5e5d59",
                  background: path === l.href ? "rgba(201,100,66,0.08)" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  display: "flex", alignItems: "center", gap: 5,
                }}
                onMouseEnter={e => {
                  if (path !== l.href) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "#141413";
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,0,0,0.03)";
                  }
                }}
                onMouseLeave={e => {
                  if (path !== l.href) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "#5e5d59";
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  }
                }}
              >
                {l.label === "Admin" && <ShieldCheck size={13} style={{ color: "#c96442" }} />}
                {l.label}
              </Link>
            ))}

            {!loading && (
              user ? (
                <div ref={dropRef} style={{ position: "relative", marginLeft: 10 }}>
                  <button
                    onClick={() => setDropOpen(o => !o)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 12px", borderRadius: 8,
                      background: dropOpen ? "#e8e6dc" : "rgba(232,230,220,0.5)",
                      border: "1px solid #e8e6dc",
                      cursor: "pointer", transition: "background 0.15s",
                      boxShadow: dropOpen ? "#d1cfc5 0px 0px 0px 1px" : "none",
                    }}
                  >
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: isAdmin ? "rgba(201,100,66,0.15)" : "#e8e6dc",
                      border: isAdmin ? "1px solid rgba(201,100,66,0.35)" : "1px solid #d1cfc5",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 600, color: isAdmin ? "#c96442" : "#4d4c48",
                    }}>
                      {initials}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#141413", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown size={12} style={{ color: "#87867f", transform: dropOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </button>

                  {dropOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 8px)", right: 0,
                      width: 220,
                      background: "#faf9f5",
                      border: "1px solid #e8e6dc",
                      borderRadius: 12,
                      boxShadow: "rgba(0,0,0,0.08) 0px 8px 32px, rgba(0,0,0,0.04) 0px 2px 8px",
                      overflow: "hidden",
                      zIndex: 100,
                      animation: "fadeDown 0.2s cubic-bezier(0.16,1,0.3,1) both",
                    }}>
                      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #f0eee6" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: isAdmin ? "rgba(201,100,66,0.12)" : "#e8e6dc",
                            border: isAdmin ? "1px solid rgba(201,100,66,0.3)" : "1px solid #d1cfc5",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, fontWeight: 600, color: isAdmin ? "#c96442" : "#4d4c48",
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: "#141413" }}>{user.name}</div>
                            <div style={{ fontSize: 12, color: "#87867f" }}>{user.email}</div>
                          </div>
                        </div>
                        {isAdmin && (
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "2px 8px", borderRadius: 24,
                            background: "rgba(201,100,66,0.1)",
                            border: "1px solid rgba(201,100,66,0.25)",
                            fontSize: 10, fontWeight: 500, color: "#c96442",
                            marginTop: 6, letterSpacing: "0.08em",
                          }}>
                            <ShieldCheck size={9} /> Admin
                          </div>
                        )}
                      </div>

                      <div style={{ padding: "6px" }}>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setDropOpen(false)}
                            style={{
                              display: "flex", alignItems: "center", gap: 8,
                              padding: "9px 10px", borderRadius: 8,
                              fontSize: 14, color: "#c96442", textDecoration: "none",
                              transition: "background 0.15s", fontWeight: 500,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(201,100,66,0.08)")}
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
                            fontSize: 14, color: "#5e5d59",
                            background: "none", border: "none",
                            cursor: "pointer", fontFamily: "inherit",
                            fontWeight: 400, textAlign: "left",
                            transition: "background 0.15s, color 0.15s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#f0eee6"; e.currentTarget.style.color = "#141413"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#5e5d59"; }}
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 10 }}>
                  <Link href="/auth" style={{
                    padding: "7px 14px", borderRadius: 8,
                    fontSize: 15, fontWeight: 400, color: "#5e5d59",
                    textDecoration: "none", transition: "color 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#141413")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#5e5d59")}
                  >Sign In</Link>
                  <Link href="/auth" style={{
                    padding: "9px 18px", borderRadius: 12,
                    background: "#c96442", color: "#faf9f5",
                    fontSize: 14, fontWeight: 500, textDecoration: "none",
                    transition: "opacity 0.15s, transform 0.15s",
                    display: "inline-flex", alignItems: "center", gap: 6,
                    boxShadow: "#c96442 0px 0px 0px 0px, rgba(201,100,66,0.25) 0px 0px 0px 1px",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.90"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"; }}
                  >
                    <Plus size={13} />
                    List Free
                  </Link>
                </div>
              )
            )}
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden"
            style={{
              padding: 8, borderRadius: 8,
              background: "#e8e6dc",
              border: "1px solid #d1cfc5",
              color: "#5e5d59", cursor: "pointer", display: "flex",
              boxShadow: "#e8e6dc 0px 0px 0px 0px, #d1cfc5 0px 0px 0px 1px",
            }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{
          background: "#f5f4ed",
          borderTop: "1px solid #e8e6dc",
          animation: "fadeDown 0.25s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          <div className="container" style={{ paddingTop: 16, paddingBottom: 20, display: "flex", flexDirection: "column", gap: 4 }}>
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  padding: "11px 14px", borderRadius: 8,
                  fontSize: 15, fontWeight: path === l.href ? 500 : 400,
                  background: path === l.href ? "rgba(201,100,66,0.08)" : "transparent",
                  color: path === l.href ? "#141413" : "#5e5d59",
                  display: "flex", alignItems: "center", gap: 6,
                  textDecoration: "none",
                }}
              >
                {l.label === "Admin" && <ShieldCheck size={13} style={{ color: "#c96442" }} />}
                {l.label}
              </Link>
            ))}

            <div style={{ margin: "8px 0", borderTop: "1px solid #e8e6dc" }} />

            {user ? (
              <>
                <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: isAdmin ? "rgba(201,100,66,0.12)" : "#e8e6dc",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 600,
                    color: isAdmin ? "#c96442" : "#4d4c48",
                    border: "1px solid #d1cfc5",
                  }}>{initials}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#141413" }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: "#87867f" }}>{user.email}</div>
                  </div>
                </div>
                <button onClick={handleLogout} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "11px 14px", borderRadius: 8,
                  fontSize: 14, color: "#5e5d59",
                  background: "#f0eee6",
                  border: "1px solid #e8e6dc", cursor: "pointer", fontFamily: "inherit",
                  fontWeight: 400, textAlign: "left",
                }}>
                  <LogOut size={14} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" onClick={() => setMobileOpen(false)} style={{
                  display: "block", padding: "11px 14px", borderRadius: 8,
                  fontSize: 15, fontWeight: 400, color: "#5e5d59",
                  textDecoration: "none",
                }}>Sign In</Link>
                <Link href="/auth" onClick={() => setMobileOpen(false)} style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "12px", borderRadius: 12,
                  background: "#c96442", color: "#faf9f5",
                  fontSize: 15, fontWeight: 500, textDecoration: "none",
                  marginTop: 4,
                }}>
                  <Plus size={14} style={{ marginRight: 6 }} /> List Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
