"use server";

import { createClient } from "@/lib/supabase/server";

export interface FlaggedItem {
  id: string;
  content_type: "discussion" | "route" | "route_report";
  content_id: string;
  reason: string;
  reported_by: string;
  reporter_email: string | null;
  reviewed: boolean;
  reviewed_by: string | null;
  review_action: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface ModerationAction {
  id: string;
  admin_id: string;
  target_user_id: string;
  action: "warn" | "ban" | "unban" | "hide_content" | "unhide_content";
  reason: string;
  created_at: string;
  target_email: string | null;
}

export interface Appeal {
  id: string;
  user_id: string;
  content_type: string;
  content_id: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  user_email: string | null;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated", supabase: supabase as any, user: null as any };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" && profile?.role !== "gov_official") {
    return { error: "Admin access required", supabase: supabase as any, user: null as any };
  }

  return { supabase, user: user as { id: string }, error: null as string | null };
}

export async function getFlaggedContent(): Promise<{
  items: FlaggedItem[];
}> {
  const auth = await requireAdmin();
  if (auth.error) {
    console.error("Auth required for flagged content:", auth.error);
    return { items: [] };
  }
  const supabase = auth.supabase;

  try {
    const { data, error } = await supabase
      .from("flagged_content")
      .select(`
        id, content_type, content_id, reason, reported_by, reporter_email,
        reviewed, reviewed_by, review_action, created_at, reviewed_at
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Failed to fetch flagged content:", error);
      return { items: [] };
    }

    return { items: (data ?? []) as FlaggedItem[] };
  } catch (err) {
    console.error("Flagged content query failed:", err);
    return { items: [] };
  }
}

export async function getFlaggedContentCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("flagged_content")
      .select("*", { count: "exact", head: true })
      .eq("reviewed", false);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getRouteReports(): Promise<{
  items: FlaggedItem[];
}> {
  const auth = await requireAdmin();
  if (auth.error) {
    console.error("Auth required:", auth.error);
    return { items: [] };
  }
  const supabase = auth.supabase;

  try {
    const { data, error } = await supabase
      .from("flagged_content")
      .select(`
        id, content_type, content_id, reason, reported_by, reporter_email,
        reviewed, reviewed_by, review_action, created_at, reviewed_at
      `)
      .eq("content_type", "route_report")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Failed to fetch route reports:", error);
      return { items: [] };
    }

    return { items: (data ?? []) as FlaggedItem[] };
  } catch (err) {
    console.error("Route reports query failed:", err);
    return { items: [] };
  }
}

export async function reviewFlaggedItem(
  itemId: string,
  action: "dismiss" | "hide" | "warn_user" | "ban_user",
  notes?: string,
): Promise<{ success: boolean } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = auth.supabase;
  const adminUser = auth.user;

  let item: Record<string, unknown> | null = null;
  try {
    const { data } = await supabase
      .from("flagged_content")
      .select("*")
      .eq("id", itemId)
      .maybeSingle();
    item = data;
  } catch (queryErr) {
    console.error("Failed to query flagged content:", queryErr);
  }

  const updateData: Record<string, unknown> = {
    reviewed: true,
    reviewed_by: adminUser.id,
    reviewed_at: new Date().toISOString(),
    review_action: action,
    admin_notes: notes ?? null,
  };

  try {
    const { error: updateError } = await supabase
      .from("flagged_content")
      .update(updateData)
      .eq("id", itemId);
    if (updateError) console.error("Failed to update flagged item:", updateError);
  } catch (updateErr) {
    console.error("Flagged content update failed:", updateErr);
  }

  if (item) {
    if (action === "hide" && item.content_type === "discussion") {
      await supabase
        .from("route_discussions")
        .update({ is_hidden: true, hidden_reason: notes ?? "Hidden by moderator" })
        .eq("id", item.content_id as string);
    }

    if (action === "ban_user") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", item.reported_by as string)
        .maybeSingle();

      if (profile && profile.role !== "admin") {
        await supabase
          .from("profiles")
          .update({ role: "banned" })
          .eq("id", item.reported_by as string);
      }
    }

    try {
      await supabase.from("moderation_log").insert({
        admin_id: adminUser.id,
        target_user_id: item.reported_by,
        action: action === "dismiss" ? "dismiss_report" :
                action === "hide" ? "hide_content" :
                action === "warn_user" ? "warn" : "ban",
        reason: notes ?? action,
        content_type: item.content_type,
        content_id: item.content_id,
      });
    } catch (logErr) {
      console.error("Failed to write moderation log:", logErr);
    }
  }

  return { success: true };
}

export async function getModerationLog(): Promise<{
  actions: ModerationAction[];
} | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = auth.supabase;

  try {
    const { data, error } = await supabase
      .from("moderation_log")
      .select(`
        id, admin_id, target_user_id, action, reason, created_at,
        target_email
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Failed to fetch moderation log:", error);
      return { error: "Failed to fetch moderation log" };
    }

    return { actions: (data ?? []) as ModerationAction[] };
  } catch (err) {
    console.error("Moderation log query failed:", err);
    return { actions: [] };
  }
}

export async function warnUser(
  targetUserId: string,
  reason: string,
): Promise<{ success: boolean } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = auth.supabase;
  const adminUser = auth.user;

  try {
    const { error: logError } = await supabase.from("moderation_log").insert({
      admin_id: adminUser.id,
      target_user_id: targetUserId,
      action: "warn",
      reason,
    });

    if (logError) {
      console.error("Failed to log warning:", logError);
    }
  } catch (logErr) {
    console.error("Moderation log unavailable:", logErr);
  }

  return { success: true };
}

export async function banUser(
  targetUserId: string,
  reason: string,
): Promise<{ success: boolean } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = auth.supabase;
  const adminUser = auth.user;

  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (target?.role === "admin") {
    return { error: "Cannot ban another admin" };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: "banned" })
    .eq("id", targetUserId);

  if (updateError) {
    console.error("Failed to ban user:", updateError);
    return { error: "Failed to ban user" };
  }

  try {
    await supabase.from("moderation_log").insert({
      admin_id: adminUser.id,
      target_user_id: targetUserId,
      action: "ban",
      reason,
    });
  } catch (logErr) {
    console.error("Moderation log unavailable:", logErr);
  }

  return { success: true };
}

export async function unbanUser(
  targetUserId: string,
): Promise<{ success: boolean } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = auth.supabase;
  const adminUser = auth.user;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: "user" })
    .eq("id", targetUserId);

  if (updateError) {
    console.error("Failed to unban user:", updateError);
    return { error: "Failed to unban user" };
  }

  try {
    await supabase.from("moderation_log").insert({
      admin_id: adminUser.id,
      target_user_id: targetUserId,
      action: "unban",
      reason: "User unbanned",
    });
  } catch (logErr) {
    console.error("Moderation log unavailable:", logErr);
  }

  return { success: true };
}

export async function getAppeals(): Promise<{
  appeals: Appeal[];
} | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = auth.supabase;

  try {
    const { data, error } = await supabase
      .from("appeals")
      .select(`
        id, user_id, content_type, content_id, reason, status,
        created_at, reviewed_at, reviewer_notes, user_email
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Failed to fetch appeals:", error);
      return { appeals: [] };
    }

    return { appeals: (data ?? []) as Appeal[] };
  } catch (err) {
    console.error("Appeals query failed:", err);
    return { appeals: [] };
  }
}

export async function reviewAppeal(
  appealId: string,
  status: "approved" | "rejected",
  reviewerNotes?: string,
): Promise<{ success: boolean } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = auth.supabase;
  const adminUser = auth.user;

  const { data: appeal } = await supabase
    .from("appeals")
    .select("*")
    .eq("id", appealId)
    .single();

  if (!appeal) return { error: "Appeal not found" };

  const { error: updateError } = await supabase
    .from("appeals")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUser.id,
      reviewer_notes: reviewerNotes ?? null,
    })
    .eq("id", appealId);

  if (updateError) {
    console.error("Failed to update appeal:", updateError);
    return { error: "Failed to update appeal" };
  }

  if (status === "approved") {
    if (appeal.content_type === "flag") {
      await supabase
        .from("flagged_content")
        .update({ reviewed: false, review_action: "appeal_granted" })
        .eq("id", appeal.content_id);

      await supabase
        .from("route_discussions")
        .update({ is_hidden: false, hidden_reason: null })
        .eq("id", appeal.content_id);
    }

    if (appeal.content_type === "ban") {
      await supabase
        .from("profiles")
        .update({ role: "user" })
        .eq("id", appeal.user_id);
    }
  }

  return { success: true };
}

export async function submitAppeal(
  contentType: string,
  contentId: string,
  reason: string,
): Promise<{ success: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in to submit an appeal" };

  const trimmed = reason.trim();
  if (trimmed.length < 10) {
    return { error: "Please provide a detailed reason for your appeal (at least 10 characters)" };
  }

  const { error: insertError } = await supabase.from("appeals").insert({
    user_id: user.id,
    user_email: user.email,
    content_type: contentType,
    content_id: contentId,
    reason: trimmed,
    status: "pending",
  });

  if (insertError) {
    console.error("Failed to submit appeal:", insertError);
    return { error: "Failed to submit appeal" };
  }

  return { success: true };
}

export async function getBannedUsers(): Promise<{
  users: { id: string; email: string | null; banned_at: string }[];
} | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };
  const supabase = auth.supabase;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, updated_at")
    .eq("role", "banned")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch banned users:", error);
    return { error: "Failed to fetch banned users" };
  }

  return {
    users: (data ?? []).map((u: { id: string; updated_at: string }) => ({
      id: u.id,
      email: null,
      banned_at: u.updated_at,
    })),
  };
}
