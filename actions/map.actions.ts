"use server";

import { createClient } from "@/lib/supabase/server";
import { moderateRouteName, moderateRouteDescription, detectObscenePattern } from "@/lib/moderation";

const OSRM_BASE = "https://router.project-osrm.org";

interface SaveRouteInput {
  type: "Jeep" | "Bus";
  line: string;
  startPoint: string;
  distanceKm: number;
  etaMin: number;
  farePhp: number;
  waypoints: [number, number][];
}

export async function saveRoute(input: SaveRouteInput) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to submit a route" };
  }

  const nameCheck = moderateRouteName(input.line);
  if (!nameCheck.pass) {
    return { error: "Route name contains prohibited content. Please review our community guidelines." };
  }

  const startCheck = moderateRouteDescription(input.startPoint);
  if (!startCheck.pass) {
    return { error: "Route description contains prohibited content. Please review our community guidelines." };
  }

  const patternCheck = detectObscenePattern(input.waypoints);
  if (patternCheck.isObscene && patternCheck.confidence > 0.9) {
    return { error: "Your route was flagged by our safety system. Contact support if you believe this is an error." };
  }

  const { error } = await supabase.from("routes").insert({
    user_id: user.id,
    author_email: user.email,
    type: input.type,
    line: input.line,
    start_point: input.startPoint,
    distance_km: input.distanceKm,
    eta_min: input.etaMin,
    fare_php: input.farePhp,
    waypoints: input.waypoints,
    status: "pending",
    version: 1,
  });

  if (error) {
    console.error("Failed to save route:", error);
    return { error: "Failed to save route. Please try again." };
  }

  if (patternCheck.isObscene) {
    await supabase.from("flagged_content").insert({
      content_type: "route",
      content_id: input.line,
      reason: `Auto-flagged: Obscene pattern detected (confidence: ${Math.round(patternCheck.confidence * 100)}%)`,
      reported_by: user.id,
      reporter_email: user.email,
    });
  }

  return { success: true };
}

export async function getRoutes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch routes:", error);
    return { error: "Failed to load routes" };
  }

  return { routes: data };
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in", supabase: null as any };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "admin" && profile.role !== "gov_official")) {
    return { error: "Only admins can perform this action", supabase: null as any };
  }

  return { supabase, error: null };
}

export async function acceptRoute(routeId: string) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };

  const { data, error: updateError } = await supabase
    .from("routes")
    .update({ status: "active" })
    .eq("id", routeId)
    .select("id");

  if (updateError) {
    console.error("Failed to accept route:", updateError);
    return { error: "Failed to accept route" };
  }

  if (!data || data.length === 0) {
    console.error("acceptRoute: RLS blocked update — no rows affected");
    return { error: "Database permission denied. Run the SQL migration to fix RLS policies (see scripts/migrations/001-add-rls-policies.sql)." };
  }

  return { success: true };
}

export async function rejectRoute(routeId: string) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };

  const { data, error: updateError } = await supabase
    .from("routes")
    .update({ status: "rejected" })
    .eq("id", routeId)
    .select("id");

  if (updateError) {
    console.error("Failed to reject route:", updateError);
    return { error: "Failed to reject route" };
  }

  if (!data || data.length === 0) {
    console.error("rejectRoute: RLS blocked update — no rows affected");
    return { error: "Database permission denied. Run the SQL migration to fix RLS policies (see scripts/migrations/001-add-rls-policies.sql)." };
  }

  return { success: true };
}

export async function deleteRoute(routeId: string) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };

  const { data, error: deleteError } = await supabase
    .from("routes")
    .delete()
    .eq("id", routeId)
    .select("id");

  if (deleteError) {
    console.error("Failed to delete route:", deleteError);
    return { error: "Failed to delete route" };
  }

  if (!data || data.length === 0) {
    console.error("deleteRoute: RLS blocked delete — no rows affected");
    return { error: "Database permission denied. Run the SQL migration to fix RLS policies (see scripts/migrations/001-add-rls-policies.sql)." };
  }

  return { success: true };
}

export async function matchRouteToRoads(waypoints: [number, number][]) {
  if (waypoints.length < 2) {
    return { error: "At least 2 waypoints required" };
  }

  try {
    const coordsStr = waypoints.map((p) => `${p[0]},${p[1]}`).join(";");
    const url = `${OSRM_BASE}/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&alternatives=false&steps=false`;

    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) throw new Error(`OSRM returned ${res.status}`);

    const data = await res.json();

    if (data.code !== "Ok" || !data.routes.length) {
      throw new Error("OSRM returned no route");
    }

    const route = data.routes[0];

    return {
      coordinates: route.geometry.coordinates as [number, number][],
      distance: route.distance as number,
      duration: route.duration as number,
    };
  } catch (err) {
    console.error("Route matching failed:", err);
    return { error: "Could not snap route to roads" };
  }
}
