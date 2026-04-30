import { createClient } from "@supabase/supabase-js";

// ── Server-only Supabase client using the Service Role key ───────────────────
// This bypasses Row Level Security and must NEVER be used on the client side.
// Only import this inside /api routes or server actions.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabaseAdmin = createClient(supabaseUrl, serviceKey);
