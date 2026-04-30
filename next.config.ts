import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Content-Security-Policy", value: "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self';" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  // ── Compression ───────────────────────────────────────────────────────────
  compress: true,

  // ── Package import optimizations (reduce bundle size) ────────────────────
  experimental: {
    optimizePackageImports: ["lucide-react", "@supabase/supabase-js"],
  },

  // ── Production source maps: OFF (faster builds, smaller output) ──────────
  productionBrowserSourceMaps: false,

  // ── Power-user compiler options ───────────────────────────────────────────
  compiler: {
    // Remove console.log in production (keep errors)
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  // ── Image optimization ────────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // cache optimized images for 24h
  },

  // ── Headers: security + aggressive caching of static assets ──────────────
  async headers() {
    return [
      {
        // Static files: cache for 1 year
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // All other routes: security headers + short revalidation
        source: "/(.*)",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "public, max-age=0, s-maxage=60, stale-while-revalidate=300" },
        ],
      },
    ];
  },
};

export default nextConfig;
