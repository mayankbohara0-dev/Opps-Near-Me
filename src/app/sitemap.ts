import { MetadataRoute } from "next";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = "https://localopps.vercel.app";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/auth`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Dynamic opportunity pages — fetch all active opportunity IDs from Supabase
  try {
    const { data } = await supabase
      .from("opportunities")
      .select("id, updated_at")
      .eq("status", "active")
      .limit(1000);

    const dynamicRoutes: MetadataRoute.Sitemap = (data ?? []).map((opp) => ({
      url: `${siteUrl}/opportunity/${opp.id}`,
      lastModified: new Date(opp.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...dynamicRoutes];
  } catch {
    // Fall back to static routes only if DB is unreachable
    return staticRoutes;
  }
}
