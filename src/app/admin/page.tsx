"use client";
import Navbar from "@/components/Navbar";
import RequireAuth from "@/components/RequireAuth";
import { CATEGORY_META, getDaysUntilDeadline } from "@/lib/data";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  CheckCircle, XCircle, Search, AlertTriangle, Eye, ShieldCheck, Sparkles, Trash2
} from "lucide-react";
import Link from "next/link";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabase";
type AStatus = "pending" | "active" | "expired" | "rejected";
const STATUS: Record<AStatus,{ label:string; color:string; bg:string; border:string }> = {
  pending:  { label:"Pending",  color:"#fbbf24", bg:"rgba(251,191,36,0.08)",  border:"rgba(251,191,36,0.25)"  },
  active:   { label:"Active",   color:"#0099ff", bg:"rgba(0,153,255,0.08)",   border:"rgba(0,153,255,0.25)"   },
  expired:  { label:"Expired",  color:"#a6a6a6", bg:"rgba(255,255,255,0.05)", border:"rgba(255,255,255,0.12)" },
  rejected: { label:"Rejected", color:"#f87171", bg:"rgba(248,113,113,0.08)", border:"rgba(248,113,113,0.25)" },
};

export default function AdminPage() {
  return (
    <RequireAuth adminOnly>
      <AdminDashboard />
    </RequireAuth>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const { allOpportunities, setAllOpportunities, setOpportunities, refreshData } = useData();
  // Use allOpportunities (all statuses) for admin management
  const opportunities = allOpportunities;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string | "all">("all");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState("");

  // Load all opportunities (including pending/rejected) on admin mount
  useEffect(() => {
    refreshData(true);
  }, [refreshData]);

  const runAiScraper = async () => {
    setIsScraping(true);
    setScrapeMessage("Querying Gemini via Google Search...");
    
    try {
      const existingTitles = opportunities.map(o => o.title);
      const res = await fetch("/api/scrape", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ existingTitles })
      });
      const json = await res.json();
      
      if (!res.ok) {
        alert("Scraping failed: " + (json.error || "Unknown error"));
        setIsScraping(false);
        return;
      }

      const scrapedItems = json.items || [];
      const dbItems = scrapedItems.map((item: any) => {
        const { auto_approve, ...rest } = item;
        return {
          ...rest,
          status: auto_approve === true ? "active" : "rejected",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      // Execute database insert and fetch generated items
      const { data: insertedData, error } = await supabase.from("opportunities").insert(dbItems).select();
      
      if (error) {
         console.error("Supabase insert error:", error);
         alert("Data scraped, but failed to save to Database.");
      }

      // If DB fails, fallback to local display items so user still gets value
      const itemsToUse = insertedData && insertedData.length > 0 
        ? insertedData 
        : dbItems.map((item, i) => ({ ...item, id: "ai_" + Date.now() + "_" + i }));

      // Update both admin and public lists
      setAllOpportunities(prev => [...itemsToUse as any, ...prev]);
      setOpportunities(prev => {
        const activeNew = (itemsToUse as any[]).filter((o: any) => o.status === "active");
        return [...activeNew, ...prev];
      });
      setFilter("all"); 
    } catch (err) {
      alert("Network error: Could not reach the scraper API.");
    } finally {
      setIsScraping(false);
    }
  };

  const approve = async (id:string) => {
    setAllOpportunities(d => d.map(o => o.id===id ? {...o,status:"active"} as any : o));
    setOpportunities(d => {
      // Add to public active list if not already there
      const exists = d.find(o => o.id === id);
      if (exists) return d.map(o => o.id===id ? {...o,status:"active"} as any : o);
      const approved = allOpportunities.find(o => o.id === id);
      return approved ? [{...approved, status:"active"} as any, ...d] : d;
    });
    await supabase.from("opportunities").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", id);
  };
  
  const reject = async (id:string) => {
    setAllOpportunities(d => d.map(o => o.id===id ? {...o,status:"rejected"} as any : o));
    setOpportunities(d => d.filter(o => o.id !== id)); // remove from public feed
    await supabase.from("opportunities").update({ status: "rejected", updated_at: new Date().toISOString() }).eq("id", id);
  };
  
  const remove = async (id:string) => {
    setAllOpportunities(d => d.filter(o => o.id!==id));
    setOpportunities(d => d.filter(o => o.id!==id));
    await supabase.from("opportunities").delete().eq("id", id);
  };

  const rows = opportunities.filter(o => {
    const ms = o.title.toLowerCase().includes(search.toLowerCase()) || o.organizer_name.toLowerCase().includes(search.toLowerCase());
    const mf = filter==="all" || o.status===filter;
    return ms && mf;
  });

  const counts = {
    pending:  opportunities.filter(o => o.status==="pending").length,
    active:   opportunities.filter(o => o.status==="active").length,
    expired:  opportunities.filter(o => o.status==="expired").length,
    rejected: opportunities.filter(o => o.status==="rejected").length,
  };


  /* ── Dashboard ── */
  return (
    <div className="grid-bg" style={{ minHeight:"100vh" }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 44, paddingBottom: 100 }}>

        {/* header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <ShieldCheck size={16} style={{ color:"#0099ff" }} />
              <h1 className="heading-2">Admin Panel</h1>
            </div>
            <p style={{ fontSize:13, color:"#a6a6a6", letterSpacing:"-0.1px" }}>
              Signed in as <strong style={{ color:"#0099ff" }}>{user?.email}</strong>
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={runAiScraper}
              disabled={isScraping}
              className="btn btn-primary"
              style={{
                gap: 8, fontSize: 13, padding: "9px 16px",
                background: isScraping ? "rgba(255,255,255,0.1)" : "#ffffff",
                color: isScraping ? "#a6a6a6" : "#000000",
                cursor: isScraping ? "wait" : "pointer",
                border: "none"
              }}
            >
              {isScraping ? (
                <>
                  <span className="anim-spin" style={{
                    width: 14, height: 14, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff",
                    display: "inline-block"
                  }} />
                  {scrapeMessage}
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Run AI Auto-Scraper
                </>
              )}
            </button>
          </div>
        </div>

        {/* stat cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
          {Object.keys(STATUS).map(s => {
            const col = STATUS[s as keyof typeof STATUS];
            const isActive = filter === s;
            return (
              <button
                key={s}
                onClick={() => setFilter(isActive ? "all" : s)}
                className="card"
                style={{
                  padding:"22px 20px", textAlign:"left", cursor:"pointer",
                  boxShadow: isActive ? `${col.border} 0px 0px 0px 1px` : "rgba(0,153,255,0.15) 0px 0px 0px 1px",
                  background: isActive ? col.bg : "rgba(255,255,255,0.02)",
                  transition:"all 0.2s",
                }}
              >
                <div style={{ fontWeight:700, fontSize:30, color: isActive ? col.color : "#ffffff", lineHeight:1, letterSpacing:"-1.5px" }}>
                  {counts[s]}
                </div>
                <div style={{ fontSize:11, color:"#a6a6a6", marginTop:8, fontWeight:500, textTransform:"capitalize", letterSpacing:"0.02em" }}>
                  {col.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* pending alert */}
        {counts.pending > 0 && (
          <div style={{
            display:"flex", alignItems:"center", gap:12, padding:"14px 18px",
            borderRadius:10, marginBottom:22,
            background:"rgba(251,191,36,0.05)", border:"1px solid rgba(251,191,36,0.2)",
          }}>
            <AlertTriangle size={14} style={{ color:"#fbbf24", flexShrink:0 }} />
            <p style={{ fontSize:13, color:"rgba(251,191,36,0.85)", letterSpacing:"-0.1px" }}>
              <strong>{counts.pending} listing{counts.pending>1?"s":""}</strong> awaiting review.
              Approve or reject to keep the feed fresh.
            </p>
          </div>
        )}

        {/* search + filter row */}
        <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, minWidth:220 }}>
            <Search size={13} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"#a6a6a6", pointerEvents:"none" }} />
            <input type="text" className="input" style={{ paddingLeft:38, fontSize:13 }}
              placeholder="Search listings…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width:160, cursor:"pointer", fontSize:13 }} value={filter}
            onChange={e => setFilter(e.target.value as string)}>
            <option value="all">All Statuses</option>
            {Object.keys(STATUS).map(s => (
              <option key={s} value={s}>{STATUS[s as keyof typeof STATUS].label}</option>
            ))}
          </select>
        </div>

        {/* table */}
        <div className="card" style={{ overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                  {["Title / Organizer","Category","City","Deadline","Status","Actions"].map(h => (
                    <th key={h} style={{
                      padding:"14px 16px", textAlign:"left",
                      fontSize:10, fontWeight:500, letterSpacing:"0.1em",
                      textTransform:"uppercase", color:"#a6a6a6", whiteSpace:"nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((opp, i) => {
                  const sm   = STATUS[opp.status as keyof typeof STATUS] || STATUS.pending;
                  const days = opp.deadline ? getDaysUntilDeadline(opp.deadline) : 0;
                  const cm   = CATEGORY_META[opp.category as keyof typeof CATEGORY_META];
                  return (
                    <tr key={opp.id} style={{
                      borderBottom: i < rows.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* title */}
                      <td style={{ padding:"14px 16px", maxWidth:280 }}>
                        <div style={{ fontWeight:600, color:"#ffffff", lineHeight:1.35, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:"-0.3px" }}>
                          {opp.title}
                        </div>
                        <div style={{ fontSize:11, color:"#a6a6a6", marginTop:3 }}>
                          {opp.organizer_name} · {opp.contact_email}
                        </div>
                      </td>

                      {/* category */}
                      <td style={{ padding:"14px 16px" }}>
                        <span style={{
                          display:"inline-flex", alignItems:"center", gap:4,
                          padding:"3px 10px", borderRadius:999, fontSize:11, fontWeight:500,
                          background:"rgba(255,255,255,0.05)",
                          color:"#a6a6a6",
                        }}>
                          {cm?.emoji} {cm?.label || opp.category}
                        </span>
                      </td>

                      {/* city */}
                      <td style={{ padding:"14px 16px", color:"#a6a6a6", whiteSpace:"nowrap", fontSize:13 }}>{opp.location_city}</td>

                      {/* deadline */}
                      <td style={{ padding:"14px 16px", whiteSpace:"nowrap" }}>
                        <span style={{
                          fontSize:12, fontWeight:400,
                          color: days<0 ? "rgba(255,255,255,0.25)" : days<=3 ? "#f87171" : days<=7 ? "#fbbf24" : "#a6a6a6",
                        }}>
                          {new Date(opp.deadline).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
                          {days<0 ? " (exp)" : days===0 ? " (today)" : ""}
                        </span>
                      </td>

                      {/* status */}
                      <td style={{ padding:"14px 16px" }}>
                        <span style={{
                          display:"inline-block", padding:"3px 10px", borderRadius:999,
                          fontSize:11, fontWeight:500,
                          background:sm.bg, color:sm.color, border:`1px solid ${sm.border}`,
                        }}>
                          {sm.label}
                        </span>
                      </td>

                      {/* actions */}
                      <td style={{ padding:"14px 16px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <Link href={`/opportunity/${opp.id}`} title="View Details"
                            style={{
                              padding:"6px", borderRadius:7, color:"#a6a6a6",
                              display:"flex", transition:"all 0.15s",
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color="#fff"; (e.currentTarget as HTMLAnchorElement).style.background="rgba(255,255,255,0.07)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color="#a6a6a6"; (e.currentTarget as HTMLAnchorElement).style.background="transparent"; }}
                          >
                            <Eye size={13} />
                          </Link>
                          {(opp.status==="pending" || opp.status==="rejected") && (
                            <button onClick={() => approve(opp.id)} title="Approve"
                              style={{
                                padding:"6px", borderRadius:7, color:"#a6a6a6",
                                background:"none", border:"none", cursor:"pointer",
                                display:"flex", transition:"all 0.15s",
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color="#0099ff"; (e.currentTarget as HTMLButtonElement).style.background="rgba(0,153,255,0.1)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color="#a6a6a6"; (e.currentTarget as HTMLButtonElement).style.background="transparent"; }}
                            >
                              <CheckCircle size={13} />
                            </button>
                          )}
                          {(opp.status==="pending" || opp.status==="active") && (
                            <button onClick={() => reject(opp.id)} title="Reject / Archive"
                              style={{
                                padding:"6px", borderRadius:7, color:"#a6a6a6",
                                background:"none", border:"none", cursor:"pointer",
                                display:"flex", transition:"all 0.15s",
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color="#f87171"; (e.currentTarget as HTMLButtonElement).style.background="rgba(239,68,68,0.08)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color="#a6a6a6"; (e.currentTarget as HTMLButtonElement).style.background="transparent"; }}
                            >
                              <XCircle size={13} />
                            </button>
                          )}
                          {opp.status==="rejected" && (
                            <button onClick={() => remove(opp.id)} title="Permanently Delete"
                              style={{
                                padding:"6px", borderRadius:7, color:"#a6a6a6",
                                background:"none", border:"none", cursor:"pointer",
                                display:"flex", transition:"all 0.15s",
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color="#ef4444"; (e.currentTarget as HTMLButtonElement).style.background="rgba(239,68,68,0.15)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color="#a6a6a6"; (e.currentTarget as HTMLButtonElement).style.background="transparent"; }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rows.length===0 && (
                  <tr>
                    <td colSpan={6} style={{ padding:"80px 0", textAlign:"center", color:"rgba(255,255,255,0.25)", fontSize:13 }}>
                      No listings match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{
            padding:"12px 20px",
            borderTop:"1px solid rgba(255,255,255,0.05)",
            fontSize:12, color:"rgba(255,255,255,0.3)", textAlign:"right", letterSpacing:"-0.05px",
          }}>
            Showing {rows.length} of {opportunities.length} listings
          </div>
        </div>

      </div>
    </div>
  );
}
