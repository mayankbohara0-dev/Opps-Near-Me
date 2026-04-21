import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In or Register — Free Student Account",
  description:
    "Create a free LocalOpps account to browse all opportunities, contact organizers, and post listings. Join thousands of students finding opportunities near them.",
  keywords: [
    "student login india",
    "localopps register",
    "free student account india",
    "sign up opportunities india",
  ],
  openGraph: {
    title: "Sign In | LocalOpps",
    description: "Join LocalOpps to access all student opportunities across India.",
    type: "website",
  },
  robots: {
    index: false, // login pages should not be indexed
    follow: false,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
