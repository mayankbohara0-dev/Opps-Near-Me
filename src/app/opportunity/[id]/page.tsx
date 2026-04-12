import type { Metadata } from "next";
import OpportunityDetailClient from "./OpportunityDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // We cannot statically generate title easily when DB is localStorage
  return {
    title: `Opportunity Detail — LocalOpps`,
  };
}

export default async function OpportunityDetailPage({ params }: Props) {
  const { id } = await params;
  return <OpportunityDetailClient id={id} />;
}
