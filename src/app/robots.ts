import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = "https://localopps.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/opportunity/", "/submit", "/auth"],
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
