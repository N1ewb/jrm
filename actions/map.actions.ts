"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
  });

  if (error) {
    console.error("Failed to save route:", error);
    return { error: "Failed to save route. Please try again." };
  }

  revalidatePath("/protected/all-routes");
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

export async function acceptRoute(routeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in" };

  const { error } = await supabase
    .from("routes")
    .update({ status: "active" })
    .eq("id", routeId);

  if (error) {
    console.error("Failed to accept route:", error);
    return { error: "Failed to accept route" };
  }

  revalidatePath("/protected/all-routes");
  return { success: true };
}

export async function deleteRoute(routeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in" };

  const { error } = await supabase
    .from("routes")
    .delete()
    .eq("id", routeId);

  if (error) {
    console.error("Failed to delete route:", error);
    return { error: "Failed to delete route" };
  }

  revalidatePath("/protected/all-routes");
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
