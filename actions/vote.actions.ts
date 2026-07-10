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

  const { data, error: rpcError } = await supabase.rpc("update_route_vote_counts", {
    p_route_id: routeId,
  });

  if (rpcError) {
    console.error("Failed to update route counts:", rpcError);
    return { error: "Failed to update counts" };
  }

  const row = data?.[0];
  if (!row) {
    return { error: "Route not found" };
  }

  return { upvotes: row.upvotes, downvotes: row.downvotes };
}

export async function getMyVotes(
  routeIds: string[],
): Promise<Record<string, -1 | 0 | 1>> {
  try {
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
  } catch (err) {
    console.error("Failed to get my votes:", err);
    return {};
  }
}
