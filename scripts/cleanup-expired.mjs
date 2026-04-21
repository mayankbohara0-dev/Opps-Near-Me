/**
 * cleanup-expired.mjs
 * Deletes all opportunities from Supabase whose deadline has already passed.
 * Run with: node scripts/cleanup-expired.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL       = "https://pwmqxsssaanievrbydrc.supabase.co";
const SERVICE_ROLE_KEY   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bXF4c3NzYWFuaWV2cmJ5ZHJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkyODk3NCwiZXhwIjoyMDkxNTA0OTc0fQ.VY2C-V2GAKkgf4-HSk5p_UzuIGLNJpdaUFeLk3f2VJs";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Today at midnight (compare date only)
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayStr = today.toISOString().split("T")[0]; // "YYYY-MM-DD"

console.log(`\n🗑️  Cleaning up opportunities with deadline < ${todayStr}...\n`);

// 1. First: fetch & display what will be deleted
const { data: toDelete, error: fetchErr } = await supabase
  .from("opportunities")
  .select("id, title, deadline, status")
  .lt("deadline", todayStr);

if (fetchErr) {
  console.error("❌ Failed to fetch expired rows:", fetchErr.message);
  process.exit(1);
}

if (!toDelete || toDelete.length === 0) {
  console.log("✅ No outdated opportunities found. Database is clean!");
  process.exit(0);
}

console.log(`Found ${toDelete.length} expired opportunit${toDelete.length === 1 ? "y" : "ies"}:\n`);
toDelete.forEach((o, i) => {
  console.log(`  ${i + 1}. [${o.status.toUpperCase()}] "${o.title}" — deadline: ${o.deadline}`);
});

// 2. Delete them all
const { error: deleteErr } = await supabase
  .from("opportunities")
  .delete()
  .lt("deadline", todayStr);

if (deleteErr) {
  console.error("\n❌ Delete failed:", deleteErr.message);
  process.exit(1);
}

console.log(`\n✅ Successfully deleted ${toDelete.length} outdated opportunities from the database.`);
