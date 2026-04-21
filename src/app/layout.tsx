import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import CookieConsent from "@/components/CookieConsent";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

const SITE_URL = "https://opps-near-me.vercel.app";
const SITE_NAME = "LocalOpps";
const SITE_DESCRIPTION =
  "Discover free local sports trials, paid internships, hackathons, and student events across India. Made for students across India.";

export const metadata: Metadata = {
  // ── Core ──────────────────────────────────────────────────────────────────
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LocalOpps — Student Opportunities Near You | India",
    template: "%s | LocalOpps",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "student opportunities india",
    "local internships bhiwandi",
    "sports trials thane",
    "hackathon mumbai",
    "student events india",
    "free internship listing",
    "coding competitions india",
    "cricket trials near me",
    "college opportunities india",
    "student jobs india",
    "workshop events for students",
    "opportunities near me india",
  ],
  authors: [{ name: "LocalOpps Team" }],
  creator: "LocalOpps",
  publisher: "LocalOpps",
  category: "Education",

  // ── Search engine directives ───────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Canonical ─────────────────────────────────────────────────────────────
  alternates: {
    canonical: SITE_URL,
  },

  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "LocalOpps — Find Student Opportunities Near You",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "LocalOpps — Student Opportunities Across India",
      },
    ],
  },

  // ── Twitter / X ───────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "LocalOpps — Student Opportunities Near You",
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },

  // ── Verification placeholders (fill in once you verify on each platform) ──
  verification: {
    google: "google-site-verification-token",   // replace after GSC verification
  },

  // ── App manifest ──────────────────────────────────────────────────────────
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preconnect to Supabase for faster first DB query */}
        <link rel="preconnect" href="https://pwmqxsssaanievrbydrc.supabase.co" />
        <link rel="dns-prefetch" href="https://pwmqxsssaanievrbydrc.supabase.co" />
        {/* JSON-LD structured data — WebSite + SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              url: SITE_URL,
              description: SITE_DESCRIPTION,
              inLanguage: "en-IN",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${SITE_URL}/?search={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`} style={{ background: "#f5f4ed", color: "#141413" }}>
        <AuthProvider>
          <DataProvider>
            {children}
            <CookieConsent />
            <SpeedInsights />
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
