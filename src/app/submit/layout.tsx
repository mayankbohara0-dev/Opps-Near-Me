import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post an Opportunity — Free Student Listing",
  description:
    "List your sports trial, internship, hackathon, or event for free. Reach thousands of students across India. Go live in under 24 hours.",
  keywords: [
    "post free opportunity india",
    "list internship india",
    "advertise sports trial",
    "free student event listing",
    "hackathon organizer india",
    "submit opportunity students india",
  ],
  openGraph: {
    title: "Post a Free Student Opportunity | LocalOpps",
    description:
      "Reach students across India for free. 100% free listing — no fees, no registration required.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
