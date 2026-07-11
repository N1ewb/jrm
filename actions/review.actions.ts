"use server";

import { createClient } from "@/lib/supabase/server";

const SIGNAL_MULTIPLIER = 10;

export interface PendingRoute {
  id: string;
  user_id: string;
  author_email: string | null;
  type: string;
  line: string;
  start_point: string;
  distance_km: number;
  eta_min: number;
  fare_php: number;
  waypoints: [number, number][];
  status: string;
  version: number;
  created_at: string;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  priority_score: number;
  rejection_reason: string | null;
}

interface ReviewNotification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in", supabase: supabase as any };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "admin" && profile.role !== "gov_official")) {
    return { error: "Only admins can perform this action", supabase: supabase as any };
  }

  return { supabase, user, error: null };
}

export async function getPendingRoutes(): Promise<{
  routes: PendingRoute[];
} | { error: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch pending routes:", error);
    return { error: "Failed to load pending routes" };
  }

  const now = Date.now();
  const routes: PendingRoute[] = (data ?? []).map((r: Record<string, unknown>) => {
    const up = (r.upvotes as number) ?? 0;
    const down = (r.downvotes as number) ?? 0;
    const netVotes = up - down;
    const ageHours = (now - new Date(r.created_at as string).getTime()) / 3600000;
    const recencyScore = Math.max(0, 1 - ageHours / 720);
    const priorityScore = netVotes * SIGNAL_MULTIPLIER + recencyScore;

    return {
      id: r.id as string,
      user_id: r.user_id as string,
      author_email: (r.author_email as string) ?? null,
      type: r.type as string,
      line: r.line as string,
      start_point: r.start_point as string,
      distance_km: r.distance_km as number,
      eta_min: r.eta_min as number,
      fare_php: r.fare_php as number,
      waypoints: r.waypoints as [number, number][],
      status: r.status as string,
      version: r.version as number,
      created_at: r.created_at as string,
      upvotes: up,
      downvotes: down,
      comment_count: (r.comment_count as number) ?? 0,
      priority_score: Math.round(priorityScore * 100) / 100,
      rejection_reason: (r.rejection_reason as string) ?? null,
    };
  });

  routes.sort((a, b) => b.priority_score - a.priority_score);

  return { routes };
}

export async function acceptRoute(
  routeId: string,
  notifyMsg?: string,
): Promise<{ success: boolean } | { error: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { data: route, error: fetchError } = await supabase
    .from("routes")
    .select("id, user_id, author_email, upvotes, downvotes, status")
    .eq("id", routeId)
    .single();

  if (fetchError || !route) return { error: "Route not found" };
  if (route.status !== "pending") return { error: "Route is not in pending status" };

  const { data, error: updateError } = await supabase
    .from("routes")
    .update({ status: "active", rejection_reason: null })
    .eq("id", routeId)
    .select("id");

  if (updateError) {
    console.error("Failed to accept route:", updateError);
    return { error: "Failed to accept route" };
  }

  if (!data || data.length === 0) {
    return { error: "Database permission denied. Check RLS policies." };
  }

  if (route.user_id) {
    const netVotes = (route.upvotes ?? 0) - (route.downvotes ?? 0);
    const message = notifyMsg ||
      `Your route has been approved!${netVotes > 0 ? ` (+${netVotes} upvotes from the community)` : ""}`;

    await supabase.from("notifications").insert({
      user_id: route.user_id,
      type: "route_approved",
      message,
    });
  }

  return { success: true };
}

export async function rejectRoute(
  routeId: string,
  reason?: string,
): Promise<{ success: boolean } | { error: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { data: route, error: fetchError } = await supabase
    .from("routes")
    .select("id, user_id, author_email, status")
    .eq("id", routeId)
    .single();

  if (fetchError || !route) return { error: "Route not found" };
  if (route.status !== "pending") return { error: "Route is not in pending status" };

  const { data, error: updateError } = await supabase
    .from("routes")
    .update({ status: "rejected", rejection_reason: reason ?? null })
    .eq("id", routeId)
    .select("id");

  if (updateError) {
    console.error("Failed to reject route:", updateError);
    return { error: "Failed to reject route" };
  }

  if (!data || data.length === 0) {
    return { error: "Database permission denied. Check RLS policies." };
  }

  if (route.user_id) {
    const message = reason
      ? `Your route was rejected: ${reason}`
      : "Your route was rejected by an admin.";

    await supabase.from("notifications").insert({
      user_id: route.user_id,
      type: "route_rejected",
      message,
    });
  }

  return { success: true };
}

export async function bulkAcceptRoutes(
  routeIds: string[],
): Promise<{ accepted: number } | { error: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  if (routeIds.length === 0) return { accepted: 0 };

  const { data: routes } = await supabase
    .from("routes")
    .select("id, user_id, upvotes, downvotes, status")
    .in("id", routeIds)
    .eq("status", "pending");

  const pendingIds = (routes ?? []).map((r: { id: string }) => r.id);
  if (pendingIds.length === 0) return { accepted: 0 };

  const { error: updateError } = await supabase
    .from("routes")
    .update({ status: "active", rejection_reason: null })
    .in("id", pendingIds);

  if (updateError) {
    console.error("Failed to bulk accept:", updateError);
    return { error: "Failed to accept routes" };
  }

  for (const route of routes ?? []) {
    if (route.user_id) {
      const netVotes = (route.upvotes ?? 0) - (route.downvotes ?? 0);
      await supabase.from("notifications").insert({
        user_id: route.user_id,
        type: "route_approved",
        message: `Your route has been approved!${netVotes > 0 ? ` (+${netVotes} upvotes from the community)` : ""}`,
      });
    }
  }

  return { accepted: pendingIds.length };
}

export async function bulkRejectRoutes(
  routeIds: string[],
  reason?: string,
): Promise<{ rejected: number } | { error: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  if (routeIds.length === 0) return { rejected: 0 };

  const { data: routes } = await supabase
    .from("routes")
    .select("id, user_id, status")
    .in("id", routeIds)
    .eq("status", "pending");

  const pendingIds = (routes ?? []).map((r: { id: string }) => r.id);
  if (pendingIds.length === 0) return { rejected: 0 };

  const { error: updateError } = await supabase
    .from("routes")
    .update({ status: "rejected", rejection_reason: reason ?? null })
    .in("id", pendingIds);

  if (updateError) {
    console.error("Failed to bulk reject:", updateError);
    return { error: "Failed to reject routes" };
  }

  for (const route of routes ?? []) {
    if (route.user_id) {
      await supabase.from("notifications").insert({
        user_id: route.user_id,
        type: "route_rejected",
        message: reason
          ? `Your route was rejected: ${reason}`
          : "Your route was rejected by an admin.",
      });
    }
  }

  return { rejected: pendingIds.length };
}

export async function getMyNotifications(): Promise<{
  notifications: ReviewNotification[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { notifications: [] };

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return { notifications: (data ?? []) as ReviewNotification[] };
}

export async function markNotificationRead(
  notificationId: string,
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  return { success: true };
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: true };

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .is("read", false);

  return { success: true };
}
