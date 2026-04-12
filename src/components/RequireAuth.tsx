"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  /** If true, only admins are allowed — others get redirected to "/" */
  adminOnly?: boolean;
}

export default function RequireAuth({ children, adminOnly = false }: Props) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (adminOnly && !isAdmin) {
      router.replace("/");
    }
  }, [user, isAdmin, loading, adminOnly, router]);

  // While checking, render a minimal loading state
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.1)",
          borderTopColor: "#0099ff",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not authed or wrong role — render nothing while redirect fires
  if (!user || (adminOnly && !isAdmin)) return null;

  return <>{children}</>;
}
