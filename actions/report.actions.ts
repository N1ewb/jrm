"use server";

import { createClient } from "@/lib/supabase/server";

export async function reportRoute(
  routeId: string,
  reason: string,
  details?: string,
): Promise<{ success: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in to report a route" };

  const { data: existing } = await supabase
    .from("route_reports")
    .select("id")
    .eq("route_id", routeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return { error: "You have already reported this route" };
  }

  const { error: insertError } = await supabase.from("route_reports").insert({
    route_id: routeId,
    user_id: user.id,
    reporter_email: user.email,
    reason,
    details: details ?? null,
  });

  if (insertError) {
    console.error("Failed to submit report:", insertError);
    return { error: "Failed to submit report" };
  }

  await supabase.from("flagged_content").insert({
    content_type: "route_report",
    content_id: routeId,
    reason: `Route reported: ${reason}`,
    reported_by: user.id,
    reporter_email: user.email,
  });

  return { success: true };
}

export async function getReportReasons(): Promise<string[]> {
  return [
    "Inaccurate route path",
    "Wrong fare information",
    "Wrong ETA or distance",
    "Route no longer exists",
    "Duplicate route",
    "Inappropriate content",
    "Wrong vehicle type",
    "Other",
  ];
}
