import { ImageResponse } from 'next/og';
import { supabaseAdmin as supabase } from "@/lib/supabase-server";

export const runtime = 'edge';
export const alt = 'Student Opportunity';
export const size = { width: 1200, height: 630 };

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const { data: opp } = await supabase.from("opportunities").select("*").eq("id", id).single();

  if (!opp) {
    return new ImageResponse(
      (
        <div style={{ background: '#f5f4ed', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: '#c96442', fontFamily: 'serif' }}>
          Opportunity Not Found
        </div>
      ), 
      { ...size }
    );
  }

  const categoryLabel: Record<string, { text: string, color: string, bg: string, emoji: string }> = {
    hackathon:  { text: "Hackathon", color: "#c96442", bg: "rgba(201,100,66,0.12)", emoji: "💻" },
    internship: { text: "Internship", color: "#c96442", bg: "rgba(201,100,66,0.12)", emoji: "💼" },
    sports:     { text: "Sports Trial", color: "#c96442", bg: "rgba(201,100,66,0.12)", emoji: "🏏" },
    event:      { text: "Event", color: "#c96442", bg: "rgba(201,100,66,0.12)", emoji: "🎤" },
  };

  const cat = categoryLabel[opp.category] ?? { text: "Opportunity", color: "#c96442", bg: "rgba(201,100,66,0.12)", emoji: "🎯" };

  return new ImageResponse(
    (
      <div style={{ 
        background: '#f5f4ed', 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '70px 80px', 
        borderTop: '16px solid #c96442',
        position: 'relative'
      }}>
        {/* Top bar: Brand + Category Pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: '#141413', fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: 'serif' }}>
            <span style={{ color: '#c96442', marginRight: 8 }}>✦</span> LocalOpps
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: cat.bg, 
            padding: '12px 24px', 
            borderRadius: 999,
            border: `2px solid rgba(201,100,66,0.2)`
          }}>
            <span style={{ fontSize: 28, marginRight: 12 }}>{cat.emoji}</span>
            <span style={{ fontSize: 24, fontWeight: 600, color: cat.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {cat.text}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', marginBottom: 'auto' }}>
          <div style={{ 
            fontSize: 72, 
            fontWeight: 700, 
            color: '#141413', 
            lineHeight: 1.15, 
            fontFamily: 'serif',
            maxWidth: '1000px',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {opp.title}
          </div>
          <div style={{ marginTop: 24, fontSize: 36, color: '#5e5d59', display: 'flex', alignItems: 'center' }}>
            <span style={{ opacity: 0.7, marginRight: 12 }}>Organised by</span>
            <span style={{ color: '#c96442', fontWeight: 600 }}>{opp.organizer_name}</span>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          borderTop: '2px solid #e8e6dc', 
          paddingTop: 40 
        }}>
           <div style={{ display: 'flex', flexDirection: 'column', color: '#141413' }}>
             <span style={{ fontSize: 20, color: '#87867f', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em' }}>LOCATION</span>
             <div style={{ display: 'flex', alignItems: 'center', fontSize: 36, fontWeight: 700 }}>
               📍 {opp.location_city}
             </div>
           </div>
           
           <div style={{ display: 'flex', flexDirection: 'column', color: '#141413', alignItems: 'flex-end' }}>
             <span style={{ fontSize: 20, color: '#87867f', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em' }}>DEADLINE</span>
             <div style={{ display: 'flex', alignItems: 'center', fontSize: 36, fontWeight: 700, color: '#c96442' }}>
               ⏳ {opp.deadline ? new Date(opp.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
             </div>
           </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
