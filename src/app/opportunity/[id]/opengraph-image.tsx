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
    return new ImageResponse(<div style={{ background: '#f5f4ed', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: '#c96442' }}>Opportunity Not Found</div>, { ...size });
  }

  return new ImageResponse(
    (
      <div style={{ background: '#f5f4ed', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 80, borderTop: '20px solid #c96442' }}>
        <div style={{ display: 'flex', alignItems: 'center', color: '#c96442', fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
           🎓 Local Opportunities Finder
        </div>
        <div style={{ marginTop: 40, fontSize: 64, fontWeight: 'bold', color: '#141413', lineHeight: 1.1, fontFamily: 'serif' }}>
          {opp.title}
        </div>
        <div style={{ marginTop: 24, fontSize: 32, color: '#5e5d59' }}>
          {opp.organizer_name}
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e8e6dc', paddingTop: 40 }}>
           <div style={{ display: 'flex', flexDirection: 'column', color: '#141413' }}>
             <span style={{ fontSize: 20, color: '#87867f', marginBottom: 8 }}>LOCATION</span>
             <span style={{ fontSize: 32, fontWeight: 'bold' }}>{opp.location_city}</span>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', color: '#141413' }}>
             <span style={{ fontSize: 20, color: '#87867f', marginBottom: 8 }}>DEADLINE</span>
             <span style={{ fontSize: 32, fontWeight: 'bold', color: '#c96442' }}>{opp.deadline ? new Date(opp.deadline).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "N/A"}</span>
           </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
