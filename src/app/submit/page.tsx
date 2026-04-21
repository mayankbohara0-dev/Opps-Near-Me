"use client";
import Navbar from "@/components/Navbar";
import RequireAuth from "@/components/RequireAuth";
import { useState } from "react";
import { Send, CheckCircle, AlertCircle, Info, Zap } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabase";
import { TOP_INDIAN_CITIES } from "@/lib/data";

const CATS = [
  { value: "sports",     label: "🏏 Sports Trials" },
  { value: "internship", label: "💼 Internship" },
  { value: "event",      label: "🎤 Event / Workshop" },
  { value: "hackathon",  label: "💻 Hackathon / Competition" },
];

interface F {
  title:string; category:string; location_city:string; location_area:string;
  event_date:string; deadline:string; description:string; organizer_name:string;
  contact_phone:string; contact_email:string; external_link:string;
}
const INIT: F = {
  title:"", category:"", location_city:"", location_area:"",
  event_date:"", deadline:"", description:"", organizer_name:"",
  contact_phone:"", contact_email:"", external_link:"",
};

export default function SubmitPage() {
  return (
    <RequireAuth>
      <SubmitForm />
    </RequireAuth>
  );
}

function SubmitForm() {
  const [form, setForm]         = useState<F>(INIT);
  const [errors, setErrors]     = useState<Partial<F>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  
  const { setOpportunities } = useData();

  const set = (k: keyof F, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e: Partial<F> = {};
    if (!form.title.trim())          e.title          = "Title is required";
    else if (form.title.length > 80) e.title          = "Max 80 characters";
    if (!form.category)              e.category       = "Select a category";
    if (!form.location_city)         e.location_city  = "Select a city";
    if (!form.location_area.trim())  e.location_area  = "Area is required";
    if (!form.deadline)              e.deadline       = "Deadline is required";
    if (!form.description.trim())    e.description    = "Description is required";
    else if (form.description.length > 500) e.description = "Max 500 characters";
    if (!form.organizer_name.trim()) e.organizer_name = "Your name is required";
    if (!form.contact_phone.trim())  e.contact_phone  = "Phone is required";
    if (!form.contact_email.trim())  e.contact_email  = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.contact_email)) e.contact_email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setRejectReason(null);
    
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      const newItem = {
         ...form,
         id: undefined, // Supabase auto-generates UUID
         status: data.valid ? "active" : "rejected",
         created_at: new Date().toISOString(),
         updated_at: new Date().toISOString()
      };
      
      if (data.valid) {
         // Insert to db if valid
         const { error } = await supabase.from("opportunities").insert([newItem]);
         if (error) console.error("DB Insert Failed:", error);
         setOpportunities(prev => [{...newItem, id: "temp_" + Date.now()} as any, ...prev]);
         setSubmitted(true);
      } else {
         setRejectReason(data.reason || "We detected low-quality information in this post. Please fix it.");
      }
    } catch (err) {
      alert("AI Analysis failed. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Success state ── */
  if (submitted) {
    return (
      <div className="grid-bg" style={{ minHeight: "100vh" }}>
        <Navbar />
        <div className="container" style={{ paddingTop: 120, paddingBottom: 80, maxWidth: 560, textAlign: "center" }}>
          <div className="anim-float" style={{
            width: 88, height: 88, borderRadius: "50%", margin: "0 auto 32px",
            background: "#0099ff",
            boxShadow: "0 0 60px rgba(0,153,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CheckCircle size={42} color="#fff" />
          </div>
          <h1 className="heading-2" style={{ marginBottom: 16 }}>Submitted Successfully!</h1>
          <p style={{ color: "#a6a6a6", fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
            Your listing has been received. It will be reviewed and published within{" "}
            <strong style={{ color: "#ffffff" }}>24 hours</strong>. We'll notify you at{" "}
            <strong style={{ color: "#0099ff" }}>{form.contact_email}</strong>.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => { setForm(INIT); setSubmitted(false); }} className="btn btn-ghost">
              Submit Another
            </button>
            <a href="/" className="btn btn-primary">Browse Opportunities</a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="grid-bg" style={{ minHeight: "100vh" }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 56, paddingBottom: 100 }}>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>

          {/* ── Page header ── */}
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div className="ring-badge anim-in" style={{ marginBottom: 22, display: "inline-flex" }}>
              ✦ 100% Free · Live in 24 hrs
            </div>
            <h1 className="heading-1" style={{ marginBottom: 14 }}>
              Post an Opportunity
            </h1>
            <p style={{ color: "#a6a6a6", fontSize: 15, maxWidth: 460, margin: "0 auto", lineHeight: 1.65 }}>
              Reach hundreds of local students for free. Fill in the details below
              and your listing will go live within 24 hours.
            </p>
          </div>

          {/* ── Info banner ── */}
          {!rejectReason ? (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "14px 18px", borderRadius: 10, marginBottom: 32,
              background: "rgba(0,153,255,0.06)", border: "1px solid rgba(0,153,255,0.2)",
            }}>
              <Info size={14} style={{ color: "#0099ff", marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 13, lineHeight: 1.5, color: "#e0e0e0" }}>
                All user submissions are now analyzed in real-time by the AI Engine. High-quality posts go live instantly.
              </p>
            </div>
          ) : (
            <div className="anim-in" style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "16px 20px", borderRadius: 12, marginBottom: 32,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            }}>
              <Zap size={16} style={{ color: "#ef4444", marginTop: 2, flexShrink: 0 }} />
              <div>
                <h4 style={{ color: "#ef4444", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>AI Quality Check Failed</h4>
                <p style={{ fontSize: 13, lineHeight: 1.5, color: "#fca5a5" }}>
                  {rejectReason}
                </p>
              </div>
            </div>
          )}

          {/* ── The form ── */}
          <form onSubmit={submit} noValidate>
            <div className="card" style={{ padding: "36px 36px 32px" }}>

              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                {/* Category */}
                <Field label="Category *" error={errors.category}>
                  <select className="input" value={form.category} onChange={e => set("category", e.target.value)}>
                    <option value="">Select a category…</option>
                    {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>

                {/* Title */}
                <Field label={`Opportunity Title * (${form.title.length}/80)`} error={errors.title}>
                  <input type="text" className="input" maxLength={80}
                    placeholder="e.g. Cricket Trials — U19 Boys"
                    value={form.title} onChange={e => set("title", e.target.value)} />
                </Field>

                {/* City + Area */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Field label="City *" error={errors.location_city}>
                    <select className="input" value={form.location_city} onChange={e => set("location_city", e.target.value)}>
                      <option value="">Select city…</option>
                      <option value="Remote">🌐 Remote / Online</option>
                      <optgroup label="── All Cities ──">
                        {TOP_INDIAN_CITIES.sort().map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                    </select>
                  </Field>
                  <Field label="Area / Locality *" error={errors.location_area}>
                    <input type="text" className="input" placeholder="e.g. Anjurphata"
                      value={form.location_area} onChange={e => set("location_area", e.target.value)} />
                  </Field>
                </div>

                {/* Dates */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Field label="Last Date to Apply *" error={errors.deadline}>
                    <input type="date" className="input" value={form.deadline} onChange={e => set("deadline", e.target.value)} />
                  </Field>
                  <Field label="Event / Start Date (optional)">
                    <input type="date" className="input" value={form.event_date} onChange={e => set("event_date", e.target.value)} />
                  </Field>
                </div>

                {/* Description */}
                <Field label={`Description * (${form.description.length}/500)`} error={errors.description}>
                  <textarea className="textarea" maxLength={500}
                    placeholder="Describe the opportunity — what it offers, who can apply, what to expect…"
                    value={form.description} onChange={e => set("description", e.target.value)} />
                </Field>

              </div>

              {/* Divider */}
              <div style={{ margin: "32px 0 28px" }}>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginBottom: 22 }} />
                <span className="label-sm">Contact Details</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                <Field label="Your Name / Organization *" error={errors.organizer_name}>
                  <input type="text" className="input" placeholder="e.g. Delhi Cricket Club"
                    value={form.organizer_name} onChange={e => set("organizer_name", e.target.value)} />
                </Field>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Field label="WhatsApp / Phone *" error={errors.contact_phone}>
                    <input type="tel" className="input" placeholder="+91 98765 43210"
                      value={form.contact_phone} onChange={e => set("contact_phone", e.target.value)} />
                  </Field>
                  <Field label="Email *" error={errors.contact_email}>
                    <input type="email" className="input" placeholder="you@email.com"
                      value={form.contact_email} onChange={e => set("contact_email", e.target.value)} />
                  </Field>
                </div>

                <Field label="Registration / Website Link (optional)">
                  <input type="url" className="input" placeholder="https://your-form.com"
                    value={form.external_link} onChange={e => set("external_link", e.target.value)} />
                </Field>

              </div>

              {/* Submit */}
              <div style={{ marginTop: 36 }}>
                <button type="submit" disabled={loading} className="btn btn-primary"
                  style={{ width: "100%", padding: 14, fontSize: 15, justifyContent: "center" }}>
                  {loading ? (
                    <><span className="anim-spin" style={{
                      width: 15, height: 15, borderRadius: "50%",
                      border: "2px solid rgba(0,0,0,0.25)", borderTopColor: "#000",
                      display: "inline-block",
                    }} /> Submitting…</>
                  ) : (
                    <><Send size={14} /> Submit Opportunity</>
                  )}
                </button>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 16 }}>
                  By submitting, you confirm this is a genuine opportunity for students.
                </p>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: "#a6a6a6", letterSpacing: "-0.05px" }}>{label}</label>
      {children}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#f87171" }}>
          <AlertCircle size={11} /> {error}
        </div>
      )}
    </div>
  );
}
