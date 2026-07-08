"use server";

import { createClient } from "@/lib/supabase/server";

export async function voteRoute(
  routeId: string,
  vote: -1 | 0 | 1,
): Promise<{ upvotes: number; downvotes: number } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to vote" };
  }

  // Remove vote
  if (vote === 0) {
    const { error: delError } = await supabase
      .from("route_votes")
      .delete()
      .eq("route_id", routeId)
      .eq("user_id", user.id);

    if (delError) {
      console.error("Failed to remove vote:", delError);
      return { error: "Failed to remove vote" };
    }
  } else {
    // Upsert vote
    const { error: upsertError } = await supabase
      .from("route_votes")
      .upsert(
        { route_id: routeId, user_id: user.id, vote },
        { onConflict: "route_id, user_id" },
      );

    if (upsertError) {
      console.error("Failed to save vote:", upsertError);
      return { error: "Failed to save vote" };
    }
  }

  // Recalculate denormalized counts
  const { data: counts, error: countError } = await supabase
    .from("route_votes")
    .select("vote")
    .eq("route_id", routeId);

  if (countError) {
    console.error("Failed to fetch vote counts:", countError);
    return { error: "Failed to fetch vote counts" };
  }

  const upvotes = counts.filter((r) => r.vote === 1).length;
  const downvotes = counts.filter((r) => r.vote === -1).length;

  const { error: updateError } = await supabase
    .from("routes")
    .update({ upvotes, downvotes })
    .eq("id", routeId);

  if (updateError) {
    console.error("Failed to update route counts:", updateError);
    return { error: "Failed to update counts" };
  }

  return { upvotes, downvotes };
}

export async function getMyVote(
  routeId: string,
): Promise<-1 | 0 | 1 | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { data, error } = await supabase
    .from("route_votes")
    .select("vote")
    .eq("route_id", routeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch vote:", error);
    return { error: "Failed to fetch vote" };
  }

  return (data?.vote as -1 | 0 | 1) ?? 0;
}

export async function getMyVotes(
  routeIds: string[],
): Promise<Record<string, -1 | 0 | 1>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || routeIds.length === 0) return {};

  const { data, error } = await supabase
    .from("route_votes")
    .select("route_id, vote")
    .in("route_id", routeIds)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to fetch votes:", error);
    return {};
  }

  const result: Record<string, -1 | 0 | 1> = {};
  for (const routeId of routeIds) {
    result[routeId] = 0;
  }
  for (const row of data ?? []) {
    result[row.route_id] = row.vote as -1 | 0 | 1;
  }

  return result;
}
