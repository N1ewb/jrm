"use server";

import { createClient } from "@/lib/supabase/server";

export interface LandmarkRow {
  id: string;
  user_id: string;
  author_email: string | null;
  name: string;
  description: string | null;
  category: string;
  lat: number;
  lng: number;
  address: string | null;
  image_urls: string[];
  status: string;
  upvotes: number;
  downvotes: number;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string | null;
  images_hidden: boolean;
}

export interface LandmarkRouteRow {
  id: string;
  landmark_id: string;
  user_id: string;
  author_email: string | null;
  title: string;
  description: string | null;
  waypoints: [number, number][];
  distance_km: number | null;
  eta_min: number | null;
  fare_php: number | null;
  starting_point: string | null;
  status: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

import { LANDMARK_CATEGORIES } from "@/lib/constants";

export async function addLandmark(input: {
  name: string;
  description?: string;
  category: string;
  lat: number;
  lng: number;
  address?: string;
  image_urls?: string[];
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to add a landmark" };
  }

  const trimmedName = input.name.trim();
  if (trimmedName.length < 2) {
    return { error: "Name must be at least 2 characters" };
  }
  if (trimmedName.length > 100) {
    return { error: "Name is too long (max 100 characters)" };
  }

  if (!LANDMARK_CATEGORIES.includes(input.category as any)) {
    return { error: "Invalid category" };
  }

  const { data, error } = await supabase
    .from("landmarks")
    .insert({
      user_id: user.id,
      author_email: user.email,
      name: trimmedName,
      description: input.description?.trim() ?? null,
      category: input.category,
      lat: input.lat,
      lng: input.lng,
      address: input.address?.trim() ?? null,
      image_urls: input.image_urls ?? [],
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to save landmark:", error);
    return { error: "Failed to save landmark" };
  }

  return { id: data.id };
}

export async function getLandmarks(filters?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<{ landmarks: LandmarkRow[] } | { error: string }> {
  const supabase = await createClient();
  let query = supabase.from("landmarks").select("*");

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    query = query.or(
      `name.ilike.%${q}%,description.ilike.%${q}%,address.ilike.%${q}%`,
    );
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch landmarks:", error);
    return { error: "Failed to load landmarks" };
  }

  return { landmarks: (data ?? []) as LandmarkRow[] };
}

export async function getLandmarkById(
  id: string,
): Promise<{ landmark: LandmarkRow } | { error: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("landmarks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return { error: "Landmark not found" };
  }

  return { landmark: data as LandmarkRow };
}

export async function voteLandmark(
  landmarkId: string,
  vote: -1 | 0 | 1,
): Promise<{ upvotes: number; downvotes: number } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: "You must be signed in to vote" };

  if (vote === 0) {
    const { error: delError } = await supabase
      .from("landmark_votes")
      .delete()
      .eq("landmark_id", landmarkId)
      .eq("user_id", user.id);

    if (delError) return { error: "Failed to remove vote" };
  } else {
    const { error: upsertError } = await supabase
      .from("landmark_votes")
      .upsert(
        { landmark_id: landmarkId, user_id: user.id, vote },
        { onConflict: "landmark_id, user_id" },
      );

    if (upsertError) return { error: "Failed to save vote" };
  }

  const { data, error: rpcError } = await supabase.rpc(
    "update_landmark_vote_counts",
    { p_landmark_id: landmarkId },
  );

  if (rpcError) return { error: "Failed to update counts" };

  const row = data?.[0];
  if (!row) return { error: "Landmark not found" };

  return { upvotes: row.upvotes, downvotes: row.downvotes };
}

export async function getMyLandmarkVotes(
  landmarkIds: string[],
): Promise<Record<string, -1 | 0 | 1>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || landmarkIds.length === 0) return {};

    const { data, error } = await supabase
      .from("landmark_votes")
      .select("landmark_id, vote")
      .in("landmark_id", landmarkIds)
      .eq("user_id", user.id);

    if (error) return {};

    const result: Record<string, -1 | 0 | 1> = {};
    for (const id of landmarkIds) result[id] = 0;
    for (const row of data ?? []) {
      result[row.landmark_id] = row.vote as -1 | 0 | 1;
    }

    return result;
  } catch {
    return {};
  }
}

export async function addLandmarkRoute(input: {
  landmark_id: string;
  title: string;
  description?: string;
  waypoints: [number, number][];
  distance_km?: number;
  eta_min?: number;
  fare_php?: number;
  starting_point?: string;
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: "You must be signed in" };

  const trimmedTitle = input.title.trim();
  if (trimmedTitle.length < 2) return { error: "Title must be at least 2 characters" };

  const { data, error } = await supabase
    .from("landmark_routes")
    .insert({
      landmark_id: input.landmark_id,
      user_id: user.id,
      author_email: user.email,
      title: trimmedTitle,
      description: input.description?.trim() ?? null,
      waypoints: input.waypoints,
      distance_km: input.distance_km ?? null,
      eta_min: input.eta_min ?? null,
      fare_php: input.fare_php ?? null,
      starting_point: input.starting_point?.trim() ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to save landmark route:", error);
    return { error: "Failed to save landmark route" };
  }

  return { id: data.id };
}

export async function getLandmarkRoutes(
  landmarkId: string,
): Promise<{ routes: LandmarkRouteRow[] } | { error: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("landmark_routes")
    .select("*")
    .eq("landmark_id", landmarkId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch landmark routes:", error);
    return { error: "Failed to load routes" };
  }

  return { routes: (data ?? []) as LandmarkRouteRow[] };
}

export async function voteLandmarkRoute(
  routeId: string,
  vote: -1 | 0 | 1,
): Promise<{ upvotes: number; downvotes: number } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: "You must be signed in" };

  if (vote === 0) {
    const { error: delError } = await supabase
      .from("landmark_route_votes")
      .delete()
      .eq("landmark_route_id", routeId)
      .eq("user_id", user.id);

    if (delError) return { error: "Failed to remove vote" };
  } else {
    const { error: upsertError } = await supabase
      .from("landmark_route_votes")
      .upsert(
        { landmark_route_id: routeId, user_id: user.id, vote },
        { onConflict: "landmark_route_id, user_id" },
      );

    if (upsertError) return { error: "Failed to save vote" };
  }

  const { data, error: rpcError } = await supabase.rpc(
    "update_landmark_route_vote_counts",
    { p_route_id: routeId },
  );

  if (rpcError) return { error: "Failed to update counts" };

  const row = data?.[0];
  if (!row) return { error: "Route not found" };

  return { upvotes: row.upvotes, downvotes: row.downvotes };
}

export async function getMyLandmarkRouteVotes(
  routeIds: string[],
): Promise<Record<string, -1 | 0 | 1>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || routeIds.length === 0) return {};

    const { data } = await supabase
      .from("landmark_route_votes")
      .select("landmark_route_id, vote")
      .in("landmark_route_id", routeIds)
      .eq("user_id", user.id);

    const result: Record<string, -1 | 0 | 1> = {};
    for (const id of routeIds) result[id] = 0;
    for (const row of data ?? []) {
      result[row.landmark_route_id] = row.vote as -1 | 0 | 1;
    }

    return result;
  } catch {
    return {};
  }
}

export async function uploadLandmarkImage(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };

  if (file.size > 5 * 1024 * 1024) {
    return { error: "File too large (max 5 MB)" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Invalid file type. Allowed: JPEG, PNG, WebP" };
  }

  const ext = file.type.split("/")[1];
  const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from("landmark-images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload failed:", error);
    return { error: "Failed to upload image" };
  }

  const { data: urlData } = supabase.storage
    .from("landmark-images")
    .getPublicUrl(fileName);

  return { url: urlData.publicUrl };
}

export async function toggleLandmarkImagesHidden(
  landmarkId: string,
  hidden: boolean,
): Promise<{ success: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" && profile?.role !== "gov_official") {
    return { error: "Admin access required" };
  }

  const { error: updateError } = await supabase
    .from("landmarks")
    .update({ images_hidden: hidden })
    .eq("id", landmarkId);

  if (updateError) {
    console.error("Failed to toggle images hidden:", updateError);
    return { error: "Failed to update" };
  }

  return { success: true };
}

export async function getLandmarkComments(
  landmarkId: string,
): Promise<{ comments: any[] } | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("route_discussions")
    .select("id, route_id, landmark_id, user_id, author_email, body, parent_id, created_at, updated_at, is_hidden, upvotes, downvotes")
    .eq("landmark_id", landmarkId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch comments:", error);
    return { error: "Failed to fetch comments" };
  }

  return { comments: data ?? [] };
}
