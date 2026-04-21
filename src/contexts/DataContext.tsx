"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { Opportunity } from "@/lib/data";
import { supabase } from "@/lib/supabase";

interface DataContextType {
  opportunities: Opportunity[];
  allOpportunities: Opportunity[];
  setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>;
  setAllOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>;
  refreshData: (adminMode?: boolean) => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Only columns needed for the public card feed — avoids fetching heavy text fields upfront
const PUBLIC_COLUMNS = [
  "id", "title", "category", "description",
  "location_city", "location_area", "organizer_name",
  "deadline", "event_date", "status", "created_at", "updated_at",
  "what_offered", "external_link", "contact_email"
].join(", ");

const CACHE_TTL_MS = 60_000; // Re-use data for 60 seconds before hitting Supabase again

export function DataProvider({ children }: { children: ReactNode }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastFetchedAt = useRef<number>(0);

  const refreshData = useCallback(async (adminMode = false) => {
    const now = Date.now();

    // Skip re-fetch if we fetched recently (public mode only)
    if (!adminMode && now - lastFetchedAt.current < CACHE_TTL_MS && opportunities.length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      if (adminMode) {
        // Admin: fetch ALL statuses with all columns for management
        const { data, error } = await supabase
          .from("opportunities")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);

        if (!error && data) {
          setAllOpportunities(data as Opportunity[]);
          setOpportunities(data as Opportunity[]);
        } else {
          console.error("Supabase Admin Fetch Error:", error?.message);
        }
      } else {
        // Public: only active records, only the columns cards & filtering need
        const { data, error } = await supabase
          .from("opportunities")
          .select(PUBLIC_COLUMNS)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(200);

        if (!error && data) {
          setOpportunities(data as unknown as Opportunity[]);
          lastFetchedAt.current = Date.now();
        } else {
          console.error("Supabase Public Fetch Error:", error?.message);
        }
      }
    } catch (err) {
      console.error("Network error fetching opportunities:", err);
    } finally {
      setIsLoading(false);
    }
  }, [opportunities.length]);

  // Initial fetch on mount
  useEffect(() => {
    refreshData(false);
  }, [refreshData]);

  return (
    <DataContext.Provider value={{
      opportunities,
      allOpportunities,
      setOpportunities,
      setAllOpportunities,
      refreshData,
      isLoading,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}
