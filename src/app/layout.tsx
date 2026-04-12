import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";

export const metadata: Metadata = {
  title: "LocalOpps — Opportunities Near You | Bhiwandi, Thane, Mumbai",
  description:
    "Discover local sports trials, internships, events, and hackathons near you. Made for students in Bhiwandi, Thane, and Mumbai. Browse, filter, and apply — all in one place.",
  keywords: "local opportunities, internships bhiwandi, sports trials thane, hackathon mumbai, student events",
  openGraph: {
    title: "LocalOpps — Your Local Opportunity Hub",
    description: "Sports trials, internships, events & hackathons — all near you.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* DNS prefetch for faster external connections */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://pwmqxsssaanievrbydrc.supabase.co" />

        {/* Preconnect for Google Fonts — reduces font load latency */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Inter font — display=swap prevents invisible text during load */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
