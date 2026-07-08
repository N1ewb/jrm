"use server";

import { createClient } from "@/lib/supabase/server";

const RATE_LIMIT_SECONDS = 30;
const MAX_REPLIES_PER_THREAD = 5;

export interface CommentRow {
  id: string;
  route_id: string;
  user_id: string;
  body: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string | null;
  is_hidden: boolean;
  upvotes: number;
  downvotes: number;
  author_email: string;
}

export async function postComment(
  routeId: string,
  body: string,
  parentId?: string,
): Promise<{ comment: CommentRow } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to comment" };
  }

  const trimmed = body.trim();
  if (trimmed.length < 1) {
    return { error: "Comment cannot be empty" };
  }
  if (trimmed.length > 2000) {
    return { error: "Comment is too long (max 2000 characters)" };
  }

  // Rate limit: check last comment time
  const { data: lastComment } = await supabase
    .from("route_discussions")
    .select("created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastComment) {
    const elapsed = (Date.now() - new Date(lastComment.created_at).getTime()) / 1000;
    if (elapsed < RATE_LIMIT_SECONDS) {
      const wait = Math.ceil(RATE_LIMIT_SECONDS - elapsed);
      return { error: `Please wait ${wait}s before posting again` };
    }
  }

  // Max replies per thread
  if (parentId) {
    const { count: replyCount } = await supabase
      .from("route_discussions")
      .select("*", { count: "exact", head: true })
      .eq("parent_id", parentId);

    if ((replyCount ?? 0) >= MAX_REPLIES_PER_THREAD) {
      return { error: "This thread has reached the maximum number of replies" };
    }
  }

  const { data, error } = await supabase
    .from("route_discussions")
    .insert({
      route_id: routeId,
      user_id: user.id,
      body: trimmed,
      parent_id: parentId ?? null,
    })
    .select("id, route_id, user_id, body, parent_id, created_at, updated_at, is_hidden, upvotes, downvotes")
    .single();

  if (error) {
    console.error("Failed to post comment:", error);
    return { error: "Failed to post comment" };
  }

  // Increment comment_count on route
  await supabase.rpc("increment_comment_count", { row_id: routeId });

  return {
    comment: {
      ...data,
      author_email: user.email ?? "Unknown",
    },
  };
}

export async function getComments(routeId: string): Promise<{
  comments: CommentRow[];
  myVotes: Record<string, -1 | 0 | 1>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: comments, error } = await supabase
    .from("route_discussions")
    .select(`
      id, route_id, user_id, body, parent_id, created_at, updated_at, is_hidden, upvotes, downvotes,
      author:user_id (email)
    `)
    .eq("route_id", routeId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch comments:", error);
    return { comments: [], myVotes: {} };
  }

  const mapped: CommentRow[] = (comments ?? []).map((c: Record<string, unknown>) => {
    const author = c.author as { email?: string } | null;
    return {
      id: c.id as string,
      route_id: c.route_id as string,
      user_id: c.user_id as string,
      body: c.body as string,
      parent_id: (c.parent_id as string) ?? null,
      created_at: c.created_at as string,
      updated_at: (c.updated_at as string) ?? null,
      is_hidden: c.is_hidden as boolean,
      upvotes: c.upvotes as number,
      downvotes: c.downvotes as number,
      author_email: author?.email ?? "Unknown",
    };
  });

  // Fetch my votes
  let myVotes: Record<string, -1 | 0 | 1> = {};
  if (user && mapped.length > 0) {
    const { data: votes } = await supabase
      .from("comment_votes")
      .select("discussion_id, vote")
      .in(
        "discussion_id",
        mapped.map((c) => c.id),
      )
      .eq("user_id", user.id);

    for (const c of mapped) {
      myVotes[c.id] = 0;
    }
    for (const v of votes ?? []) {
      myVotes[v.discussion_id] = v.vote as -1 | 0 | 1;
    }
  }

  return { comments: mapped, myVotes };
}

export async function voteComment(
  discussionId: string,
  vote: -1 | 0 | 1,
): Promise<{ upvotes: number; downvotes: number } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in to vote" };

  if (vote === 0) {
    await supabase
      .from("comment_votes")
      .delete()
      .eq("discussion_id", discussionId)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("comment_votes")
      .upsert(
        { discussion_id: discussionId, user_id: user.id, vote },
        { onConflict: "discussion_id, user_id" },
      );
  }

  // Recalculate counts
  const { data: counts } = await supabase
    .from("comment_votes")
    .select("vote")
    .eq("discussion_id", discussionId);

  const upvotes = counts?.filter((r) => r.vote === 1).length ?? 0;
  const downvotes = counts?.filter((r) => r.vote === -1).length ?? 0;

  await supabase
    .from("route_discussions")
    .update({ upvotes, downvotes })
    .eq("id", discussionId);

  return { upvotes, downvotes };
}
