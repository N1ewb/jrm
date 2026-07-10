"use server";

import { createClient } from "@/lib/supabase/server";

export interface AdminStats {
  totalRoutes: number;
  activeUsers: number;
  pendingReviews: number;
  routesAccepted: number;
  routesPending: number;
  routesRejected: number;
  communityMembers: number;
  totalComments: number;
  totalVotes: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();

  const [
    { count: totalRoutes },
    { count: profilesCount },
    { count: pendingReviews },
    { count: acceptedRoutes },
    { count: pendingRoutes },
    { count: rejectedRoutes },
    { count: comments },
    { count: routeVotes },
  ] = await Promise.all([
    supabase.from("routes").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("routes").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("routes").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("routes").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("routes").select("*", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("route_discussions").select("*", { count: "exact", head: true }),
    supabase.from("route_votes").select("*", { count: "exact", head: true }),
  ]);

  return {
    totalRoutes: totalRoutes ?? 0,
    activeUsers: profilesCount ?? 0,
    pendingReviews: pendingReviews ?? 0,
    routesAccepted: acceptedRoutes ?? 0,
    routesPending: pendingRoutes ?? 0,
    routesRejected: rejectedRoutes ?? 0,
    communityMembers: profilesCount ?? 0,
    totalComments: comments ?? 0,
    totalVotes: routeVotes ?? 0,
  };
}
