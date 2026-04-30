"use client";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div style={{ padding: "40px", fontFamily: "monospace", background: "#fee", color: "#900", minHeight: "100vh" }}>
      <h1>App Error (Custom Error Boundary)</h1>
      <h2>{error.name}: {error.message}</h2>
      {error.digest && <p>Digest: {error.digest}</p>}
      <pre style={{ background: "#fff", padding: "20px", overflowX: "auto", border: "1px solid #fcc", marginTop: "20px" }}>
        {error.stack}
      </pre>
      <button 
        onClick={() => reset()} 
        style={{ marginTop: 20, padding: "10px 20px", background: "#900", color: "#fff", border: "none", cursor: "pointer" }}
      >
        Try Again
      </button>
    </div>
  );
}
