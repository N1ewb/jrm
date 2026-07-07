import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !EMAIL || !PASSWORD) {
  console.error("Missing required env vars: SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL, ADMIN_PASSWORD");
  process.exit(1);
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Step 1: Sign up the user (auto-confirm is enabled)
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: EMAIL,
    password: PASSWORD,
  });

  if (signUpError) {
    console.error("Sign-up error:", signUpError.message);
    process.exit(1);
  }

  const userId = signUpData.user?.id;
  if (!userId) {
    console.log("User may already exist. Trying sign-in...");
    // Try signing in instead
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD,
    });
    if (signInError) {
      console.error("Sign-in error:", signInError.message);
      process.exit(1);
    }
    await setProfile(supabase, signInData.user.id);
  } else {
    console.log("User created:", userId);
    await setProfile(supabase, userId);
  }
}

async function setProfile(supabase, userId) {
  // Step 2: Sign in to get an authenticated session
  const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });

  if (sessionError) {
    console.error("Session error:", sessionError.message);
    process.exit(1);
  }

  // Step 3: Upsert profile with admin role
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, role: "admin", updated_at: new Date().toISOString() });

  if (profileError) {
    console.error("Profile upsert error:", profileError.message);
    console.log("This likely means RLS prevents the insert. Need service_role key.");
    console.log("Add SUPABASE_SERVICE_ROLE_KEY to .env and re-run.");
    process.exit(1);
  }

  console.log("Profile set to admin for user:", userId);
  console.log(`Admin account ready! Email: ${EMAIL} / Password: ${PASSWORD}`);
}

main();
