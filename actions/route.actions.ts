"use server";

import { createClient } from "@/lib/supabase/server";

export interface RouteRow {
  id: string;
  line: string;
  type: "Jeep" | "Bus";
  start_point: string;
  distance_km: number;
  eta_min: number;
  fare_php: number;
  waypoints: [number, number][];
  status: string;
  upvotes: number;
  downvotes: number;
}

export async function getActiveRoutes() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("routes")
    .select("id, line, type, start_point, distance_km, eta_min, fare_php, waypoints, status, upvotes, downvotes")
    .eq("status", "active");

  if (error) {
    console.error("Failed to fetch active routes:", error);
    return { error: "Failed to load routes" };
  }

  return { routes: data as RouteRow[] | null };
}

export async function getRouteById(routeId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("routes")
    .select("id, line, type, start_point, distance_km, eta_min, fare_php, waypoints, status, upvotes, downvotes")
    .eq("id", routeId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch route:", error);
    return { error: "Failed to load route" };
  }

  if (!data) {
    return { error: "Route not found" };
  }

  return { route: data as RouteRow };
}
