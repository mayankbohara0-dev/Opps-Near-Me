import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Using env vars from .env.local:
const url = "https://pwmqxsssaanievrbydrc.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bXF4c3NzYWFuaWV2cmJ5ZHJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkyODk3NCwiZXhwIjoyMDkxNTA0OTc0fQ.VY2C-V2GAKkgf4-HSk5p_UzuIGLNJpdaUFeLk3f2VJs";

const supabase = createClient(url, key);

async function checkUser() {
  const { data, error } = await supabase.from("app_users").select("*");
  console.log("Users:", data);
  console.log("Error:", error);
}

checkUser();
