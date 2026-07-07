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

// Iligan jeepney routes with realistic waypoints
const DUMMY_ROUTES = [
  {
    line: "Suarez",
    start_point: "Suarez Public Market",
    waypoints: [
      [124.2383, 8.2289],
      [124.2400, 8.2300],
      [124.2450, 8.2350],
      [124.2500, 8.2400],
      [124.2550, 8.2450],
      [124.2600, 8.2500],
      [124.2650, 8.2550],
      [124.2700, 8.2580],
      [124.2750, 8.2600],
      [124.2800, 8.2620],
    ],
  },
  {
    line: "Buru-un",
    start_point: "Buru-un Terminal",
    waypoints: [
      [124.2383, 8.2289],
      [124.2350, 8.2250],
      [124.2300, 8.2200],
      [124.2250, 8.2150],
      [124.2200, 8.2100],
      [124.2150, 8.2050],
      [124.2100, 8.2000],
    ],
  },
  {
    line: "Tominobo",
    start_point: "Tominobo Barangay Hall",
    waypoints: [
      [124.2383, 8.2289],
      [124.2420, 8.2320],
      [124.2480, 8.2380],
      [124.2550, 8.2420],
      [124.2620, 8.2480],
      [124.2680, 8.2520],
      [124.2750, 8.2580],
      [124.2800, 8.2620],
      [124.2850, 8.2650],
    ],
  },
  {
    line: "Fuentes",
    start_point: "Fuentes Barangay",
    waypoints: [
      [124.2383, 8.2289],
      [124.2360, 8.2260],
      [124.2320, 8.2220],
      [124.2280, 8.2180],
      [124.2240, 8.2140],
      [124.2200, 8.2100],
      [124.2160, 8.2060],
      [124.2120, 8.2020],
    ],
  },
  {
    line: "Tibanga",
    start_point: "Tibanga Highway Junction",
    waypoints: [
      [124.2383, 8.2289],
      [124.2400, 8.2260],
      [124.2440, 8.2220],
      [124.2480, 8.2180],
      [124.2520, 8.2140],
      [124.2560, 8.2100],
      [124.2600, 8.2060],
      [124.2640, 8.2020],
    ],
  },
  {
    line: "Pala-o",
    start_point: "Pala-o Barangay Plaza",
    waypoints: [
      [124.2383, 8.2289],
      [124.2340, 8.2320],
      [124.2280, 8.2360],
      [124.2220, 8.2400],
      [124.2160, 8.2440],
      [124.2100, 8.2480],
      [124.2040, 8.2520],
    ],
  },
  {
    line: "Hinaplanon",
    start_point: "Hinaplanon National High School",
    waypoints: [
      [124.2383, 8.2289],
      [124.2430, 8.2340],
      [124.2500, 8.2400],
      [124.2570, 8.2460],
      [124.2640, 8.2520],
      [124.2710, 8.2580],
      [124.2780, 8.2640],
    ],
  },
  {
    line: "Mahayahay",
    start_point: "Mahayahay Barangay Hall",
    waypoints: [
      [124.2383, 8.2289],
      [124.2330, 8.2240],
      [124.2260, 8.2180],
      [124.2190, 8.2120],
      [124.2120, 8.2060],
      [124.2050, 8.2000],
      [124.1980, 8.1940],
    ],
  },
  {
    line: "Tambacan",
    start_point: "Tambacan Port Area",
    waypoints: [
      [124.2383, 8.2289],
      [124.2410, 8.2330],
      [124.2450, 8.2380],
      [124.2490, 8.2430],
      [124.2530, 8.2480],
      [124.2570, 8.2530],
      [124.2610, 8.2580],
    ],
  },
  {
    line: "Villa Verde",
    start_point: "Villa Verde Subdivision",
    waypoints: [
      [124.2383, 8.2289],
      [124.2370, 8.2250],
      [124.2350, 8.2200],
      [124.2330, 8.2150],
      [124.2310, 8.2100],
      [124.2290, 8.2050],
      [124.2270, 8.2000],
    ],
  },
];

function haversineDistance(coord1, coord2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(coord2[1] - coord1[1]);
  const dLon = toRad(coord2[0] - coord1[0]);
  const lat1 = toRad(coord1[1]);
  const lat2 = toRad(coord2[1]);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateRouteDistance(coords) {
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    total += haversineDistance(coords[i], coords[i + 1]);
  }
  return total;
}

const FARE_FIRST_4KM = 13;
const FARE_PER_KM = 1;
const JEEP_SPEED = 20;

function calculateFare(distanceKm) {
  const remaining = Math.max(0, distanceKm - 4);
  return FARE_FIRST_4KM + Math.ceil(remaining) * FARE_PER_KM;
}

function calculateETA(distanceKm) {
  const hours = distanceKm / JEEP_SPEED;
  return Math.round(hours * 60) || 1;
}

async function signInAsAdmin(supabase) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (error) {
    console.error("Sign-in failed:", error.message);
    console.log("Trying to sign up first...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    if (signUpError) {
      console.error("Sign-up also failed:", signUpError.message);
      process.exit(1);
    }
    console.log("Admin user created. Signing in...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    if (signInError) {
      console.error("Sign-in after sign-up failed:", signInError.message);
      process.exit(1);
    }
    return signInData.user;
  }

  console.log("Signed in as:", data.user.email);
  return data.user;
}

async function ensureAdminProfile(supabase, userId) {
  console.log("Checking admin profile...");
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.log("Profile query error (likely RLS):", profileError.message);
  }

  if (profile?.role === "admin") {
    console.log("Admin profile exists with role:", profile.role);
    return true;
  }

  console.log("Admin profile not found or wrong role. Attempting to create...");
  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert({ id: userId, role: "admin", updated_at: new Date().toISOString() });

  if (upsertError) {
    console.error("Profile upsert failed:", upsertError.message);
    console.log("\n⚠️  RLS is blocking profile creation.");
    console.log("Run this SQL in Supabase SQL Editor (https://supabase.com/dashboard/project/dawyfazhbxhajhvrcvuy/sql/new):");
    console.log(`
-- 1. Create the admin profile
INSERT INTO profiles (id, role, updated_at)
VALUES ('${userId}', 'admin', NOW())
ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = NOW();

-- 2. Fix existing routes (set NULL statuses to 'pending')
UPDATE routes SET status = 'pending' WHERE status IS NULL;

-- 3. Set version on routes that have no version
UPDATE routes SET version = 1 WHERE version IS NULL;
    `);
    return false;
  }

  console.log("Admin profile created successfully!");
  return true;
}

async function manageRoutes(supabase, user) {
  console.log("\n=== Checking existing routes ===");
  const { data: existingRoutes, error: fetchError } = await supabase
    .from("routes")
    .select("*");

  if (fetchError) {
    console.error("Failed to fetch routes:", fetchError.message);
    return;
  }

  console.log(`Found ${existingRoutes.length} existing route(s).`);

  if (existingRoutes.length > 0) {
    console.log("\nExisting routes:");
    existingRoutes.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.line} - ${r.start_point} (status: ${r.status ?? "NULL"}, version: ${r.version ?? "NULL"})`);
    });

    console.log("\nDeleting existing routes...");
    const { error: deleteError } = await supabase
      .from("routes")
      .delete()
      .in("id", existingRoutes.map((r) => r.id));

    if (deleteError) {
      console.error("Failed to delete routes:", deleteError.message);
      console.log("\n⚠️  RLS might be blocking deletion. Routes are owned by different users.");
      console.log("Need to run SQL to fix. See instructions above.");
      return false;
    }

    console.log("Existing routes deleted successfully.");
  }

  console.log("\n=== Creating dummy routes ===");

  for (const route of DUMMY_ROUTES) {
    const dist = calculateRouteDistance(route.waypoints);
    const eta = calculateETA(dist);
    const fare = calculateFare(dist);

    const { error: insertError } = await supabase.from("routes").insert({
      user_id: user.id,
      author_email: user.email,
      type: "Jeep",
      line: route.line,
      start_point: route.start_point,
      distance_km: Math.round(dist * 100) / 100,
      eta_min: eta,
      fare_php: fare,
      waypoints: route.waypoints,
      status: "pending",
      version: 1,
    });

    if (insertError) {
      console.error(`Failed to create route "${route.line}":`, insertError.message);
    } else {
      console.log(`  ✓ ${route.line} — ${route.start_point} (${dist.toFixed(2)} km, ₱${fare}, ${eta} min)`);
    }
  }

  console.log("\n✅ All routes created successfully!");
  return true;
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log("=== JRM Route Seeder ===\n");

  const user = await signInAsAdmin(supabase);
  const profileOk = await ensureAdminProfile(supabase, user.id);

  if (!profileOk) {
    console.log("\nProceeding with route management anyway (may fail if RLS blocks)...");
  }

  const success = await manageRoutes(supabase, user);

  if (success) {
    console.log("\n🎉 Done! Routes are ready with status='pending'.");
    if (!profileOk) {
      console.log("⚠️  Still need to set up admin profile via SQL (see above).");
    }
  }
}

main().catch(console.error);
