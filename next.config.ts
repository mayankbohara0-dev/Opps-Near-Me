import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Content-Security-Policy", value: "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'none';" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Referrer-Policy", value: "no-referrer" }
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
      ? { exclude: ["error"] }
      : false,
  },

  // ── Webpack memory/performance tuning (only used when NOT on Turbopack) ───
  webpack: (config, { dev }) => {
    if (dev) {
      config.parallelism = 2;
      config.watchOptions = {
        ...config.watchOptions,
        poll: false,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**', '**/.agent/**', '**/dist/**']
      };
    }
    return config;
  },

  // ── Security headers on every route ──────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
