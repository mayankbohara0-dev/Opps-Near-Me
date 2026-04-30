import type { Metadata } from "next";
import OpportunityDetailClient from "./OpportunityDetailClient";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://localopps.vercel.app";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const { data: opp } = await supabase
      .from("opportunities")
      .select("title, description, category, location_city, organizer_name, deadline, what_offered")
      .eq("id", id)
      .single();

    if (!opp) {
      return {
        title: "Opportunity Not Found",
        description: "This opportunity may have been removed or expired.",
        robots: { index: false, follow: false },
      };
    }

    const categoryLabel: Record<string, string> = {
      hackathon: "Hackathon",
      internship: "Internship",
      sports: "Sports Trial",
      event: "Event",
    };

    const cat = categoryLabel[opp.category] ?? "Opportunity";
    const title = `${opp.title} — ${cat} in ${opp.location_city}`;
    const description = `${opp.description?.slice(0, 155)}… Apply before ${new Date(opp.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}. Organised by ${opp.organizer_name}.`;
    const canonicalUrl = `${SITE_URL}/opportunity/${id}`;

    return {
      title,
      description,
      keywords: [
        opp.title,
        cat,
        opp.location_city,
        opp.organizer_name,
        `${cat.toLowerCase()} ${opp.location_city}`,
        "student opportunity india",
        "local opportunities",
      ],
      alternates: { canonical: canonicalUrl },
      openGraph: {
        type: "article",
        url: canonicalUrl,
        title,
        description,
        siteName: "LocalOpps",
        locale: "en_IN",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      // Structured data is injected by the client component via a <script> tag
    };
  } catch {
    return { title: "LocalOpps — Opportunity Detail" };
  }
}

export default async function OpportunityDetailPage({ params }: Props) {
  const { id } = await params;
  return <OpportunityDetailClient id={id} />;
}
