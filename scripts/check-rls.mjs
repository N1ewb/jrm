import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Missing required env vars: SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL, ADMIN_PASSWORD");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (error) {
    console.error("Sign in failed:", error.message);
    process.exit(1);
  }
  console.log("Signed in as:", user.email);

  // Try calling exec_sql or similar RPC functions
  for (const fn of ["exec_sql", "exec", "run_sql", "query"]) {
    const { data, error: rpcErr } = await supabase.rpc(fn, { query: "SELECT 1" });
    console.log(`rpc.${fn}:`, { data, error: rpcErr?.message ?? null });
  }

  // Try to see what RPCs are available
  const { data: rpcs, error: rpcErr2 } = await supabase
    .from("pg_proc")
    .select("proname")
    .limit(5);

  console.log("pg_proc query:", { data: rpcs?.map(r => r.proname), error: rpcErr2?.message ?? null });

  // Check if we can query the profiles table for the current user
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  console.log("Profile:", JSON.stringify(profile), "Error:", profileErr?.message ?? null);
}

main().catch(console.error);
