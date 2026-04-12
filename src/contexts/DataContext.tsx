"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Opportunity } from "@/lib/data";
import { supabase } from "@/lib/supabase";

interface DataContextType {
  opportunities: Opportunity[];        // public: only active; admin: all statuses
  allOpportunities: Opportunity[];     // admin only: all statuses
  setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>;
  setAllOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>;
  refreshData: (adminMode?: boolean) => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async (adminMode = false) => {
    setIsLoading(true);
    try {
      if (adminMode) {
        // Admin: fetch ALL statuses for management
        const { data, error } = await supabase
          .from("opportunities")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          setAllOpportunities(data as Opportunity[]);
          setOpportunities(data as Opportunity[]);
        } else {
          console.error("Supabase Admin Fetch Error:", error?.message);
        }
      } else {
        // Public users: ONLY fetch active opportunities
        // This respects Supabase RLS and ensures users see approved ops
        const { data, error } = await supabase
          .from("opportunities")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (!error && data) {
          setOpportunities(data as Opportunity[]);
        } else {
          console.error("Supabase Public Fetch Error:", error?.message);
        }
      }
    } catch (err) {
      console.error("Network error fetching opportunities:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On initial mount, fetch active opportunities for public view
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
