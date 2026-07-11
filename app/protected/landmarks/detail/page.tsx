"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import maplibregl from "maplibre-gl";
import {
  MapPin, Clock, DollarSign, Route, ArrowLeft, Loader2, MessageSquare,
  ThumbsUp, ThumbsDown, Navigation, EyeOff, Eye, Plus,
} from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VoteButtons from "@/components/vote-buttons";
import CommentThread from "@/components/comment-thread";
import type { CommentRow } from "@/actions/discussion.actions";
import type { LandmarkRow, LandmarkRouteRow } from "@/actions/landmark.actions";
import { LANDMARK_CATEGORIES } from "@/lib/constants";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export default function LandmarkDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);

  const [landmark, setLandmark] = useState<LandmarkRow | null>(null);
  const [routes, setRoutes] = useState<LandmarkRouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myVote, setMyVote] = useState<-1 | 0 | 1>(0);
  const [voteCounts, setVoteCounts] = useState({ upvotes: 0, downvotes: 0 });
  const [routeVotes, setRouteVotes] = useState<Record<string, -1 | 0 | 1>>({});
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [myCommentVotes, setMyCommentVotes] = useState<Record<string, -1 | 0 | 1>>({});
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [routeTitle, setRouteTitle] = useState("");
  const [routeDesc, setRouteDesc] = useState("");
  const [routeStart, setRouteStart] = useState("");
  const [submittingRoute, setSubmittingRoute] = useState(false);
  const [imagesHidden, setImagesHidden] = useState(false);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)user-role=([^;]*)/);
    setUserRole(match ? decodeURIComponent(match[1]) : null);
  }, []);

  const isAdmin = userRole === "admin" || userRole === "gov_official";

  useEffect(() => {
    if (!id) return;
    const landmarkId = id;
    async function load() {
      try {
        const [
          { getLandmarkById },
          { getLandmarkRoutes },
          { getMyLandmarkVotes },
        ] = await Promise.all([
          import("@/actions/landmark.actions"),
          import("@/actions/landmark.actions"),
          import("@/actions/landmark.actions"),
        ]);

        const [landmarkRes, routesRes, votesRes] = await Promise.all([
          getLandmarkById(landmarkId),
          getLandmarkRoutes(landmarkId),
          getMyLandmarkVotes([landmarkId]),
        ]);

        if ("landmark" in landmarkRes) {
          setLandmark(landmarkRes.landmark);
          setVoteCounts({
            upvotes: landmarkRes.landmark.upvotes,
            downvotes: landmarkRes.landmark.downvotes,
          });
          setMyVote(votesRes[landmarkId] ?? 0);
          setImagesHidden(landmarkRes.landmark.images_hidden ?? false);
        } else {
          setError(landmarkRes.error);
        }

        if ("routes" in routesRes) {
          setRoutes(routesRes.routes);
          const routeIds = routesRes.routes.map((r) => r.id);
          if (routeIds.length > 0) {
            const { getMyLandmarkRouteVotes } = await import("@/actions/landmark.actions");
            const rv = await getMyLandmarkRouteVotes(routeIds);
            setRouteVotes(rv);
          }
        }
      } catch (err) {
        console.error("Failed to load landmark:", err);
        setError("Failed to load landmark");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const cid = id;
    async function loadComments() {
      try {
        const { getComments } = await import("@/actions/discussion.actions");
        const result = await getComments(cid);
        setComments(result.comments);
        setMyCommentVotes(result.myVotes);
      } catch {
        console.error("Failed to load comments");
      }
    }
    loadComments();
  }, [id]);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current || !landmark) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [landmark.lng, landmark.lat],
      zoom: 15,
    });

    map.on("load", () => {
      const el = document.createElement("div");
      el.className = "w-8 h-8 rounded-full bg-primary border-3 border-white shadow-lg flex items-center justify-center";
      el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

      new maplibregl.Marker({ element: el })
        .setLngLat([landmark.lng, landmark.lat])
        .addTo(map);
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapInstance.current = map;

    return () => { map.remove(); mapInstance.current = null; };
  }, [landmark]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || routes.length === 0) return;

    const topRoute = routes.length > 0
      ? [...routes].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))[0]
      : null;

    const routeToDraw = activeRouteId
      ? routes.find((r) => r.id === activeRouteId)
      : topRoute;

    if (!routeToDraw || routeToDraw.waypoints.length < 2) return;

    try {
      if (map.getLayer("route-line")) map.removeLayer("route-line");
      if (map.getSource("route-source")) map.removeSource("route-source");
    } catch {}

    map.addSource("route-source", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: routeToDraw.waypoints,
        },
      },
    });

    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route-source",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#5000BD",
        "line-width": 4,
        "line-opacity": 0.8,
      },
    });

    if (routeToDraw.waypoints.length >= 2) {
      const bounds = routeToDraw.waypoints.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(routeToDraw.waypoints[0], routeToDraw.waypoints[0]),
      );
      if (landmark) bounds.extend([landmark.lng, landmark.lat]);
      map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1000 });
    }
  }, [routes, activeRouteId, landmark]);

  const handleLandmarkVote = useCallback(async (vote: -1 | 0 | 1) => {
    if (!id) return;
    try {
      const { voteLandmark } = await import("@/actions/landmark.actions");
      const result = await voteLandmark(id, vote);
      if ("upvotes" in result) {
        setVoteCounts({ upvotes: result.upvotes, downvotes: result.downvotes });
        setMyVote(vote);
      }
    } catch {
      console.error("Vote failed");
    }
  }, [id]);

  const handleSubmitRoute = useCallback(async () => {
    if (!id || !routeTitle.trim() || !landmark) return;
    setSubmittingRoute(true);
    try {
      const { addLandmarkRoute } = await import("@/actions/landmark.actions");
      const result = await addLandmarkRoute({
        landmark_id: id,
        title: routeTitle.trim(),
        description: routeDesc || undefined,
        starting_point: routeStart || undefined,
        waypoints: [[landmark.lng, landmark.lat]],
      });

      if ("id" in result) {
        setShowAddRoute(false);
        setRouteTitle("");
        setRouteDesc("");
        setRouteStart("");
        const { getLandmarkRoutes } = await import("@/actions/landmark.actions");
        const res = await getLandmarkRoutes(id);
        if ("routes" in res) setRoutes(res.routes);
      }
    } catch {
      console.error("Failed to add route");
    } finally {
      setSubmittingRoute(false);
    }
  }, [id, routeTitle, routeDesc, routeStart, landmark]);

  const handleToggleImages = useCallback(async () => {
    if (!id) return;
    try {
      const { toggleLandmarkImagesHidden } = await import("@/actions/landmark.actions");
      const result = await toggleLandmarkImagesHidden(id, !imagesHidden);
      if ("success" in result) setImagesHidden(!imagesHidden);
    } catch {
      console.error("Failed to toggle images");
    }
  }, [id, imagesHidden]);

  const recommendedRoute = routes.length > 0
    ? [...routes].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))[0]
    : null;

  const categoryLabel = landmark
    ? (LANDMARK_CATEGORIES.find((c) => c === landmark.category)
        ? landmark.category.charAt(0).toUpperCase() + landmark.category.slice(1)
        : landmark.category)
    : "";

  if (!id) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 text-center">
        <MapPin size={40} className="text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground">No landmark selected</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/protected/landmarks")}>
          Browse Landmarks
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !landmark) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 text-center">
        <MapPin size={40} className="text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground">{error ?? "Landmark not found"}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/protected/landmarks")}>
          Browse Landmarks
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full pb-20 lg:pb-6 space-y-6">
      <button
        type="button"
        onClick={() => router.push("/protected/landmarks")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Landmarks
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="h-[300px] lg:h-[450px] rounded-xl overflow-hidden border border-border">
            <div ref={mapContainer} className="w-full h-full" />
          </div>

          {landmark.image_urls.length > 0 && !imagesHidden && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {landmark.image_urls.map((url, i) => (
                <div key={i} className="aspect-video rounded-lg overflow-hidden border border-border">
                  <img
                    src={url}
                    alt={`${landmark.name} ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {landmark.image_urls.length > 0 && imagesHidden && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <EyeOff size={16} />
              Images are hidden by moderator
            </div>
          )}

          {isAdmin && landmark.image_urls.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleImages}
              className="gap-1.5"
            >
              {imagesHidden ? <Eye size={14} /> : <EyeOff size={14} />}
              {imagesHidden ? "Show Images" : "Hide Images"}
            </Button>
          )}
        </div>

        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-lg truncate">{landmark.name}</CardTitle>
                  <Badge variant="outline" className="mt-1 text-[10px]">{categoryLabel}</Badge>
                </div>
                <Badge
                  className={`text-[10px] ${
                    landmark.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : landmark.status === "rejected"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {landmark.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <button
                  type="button"
                  onClick={() => handleLandmarkVote(myVote === 1 ? 0 : 1)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-primary/5"
                  aria-label={myVote === 1 ? "Remove upvote" : "Upvote"}
                >
                  <ThumbsUp
                    size={16}
                    className={myVote === 1 ? "fill-primary text-primary" : "text-muted-foreground"}
                  />
                  <span className="tabular-nums font-medium">{voteCounts.upvotes}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLandmarkVote(myVote === -1 ? 0 : -1)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-destructive/5"
                  aria-label={myVote === -1 ? "Remove downvote" : "Downvote"}
                >
                  <ThumbsDown
                    size={16}
                    className={myVote === -1 ? "fill-destructive text-destructive" : "text-muted-foreground"}
                  />
                  <span className="tabular-nums font-medium">{voteCounts.downvotes}</span>
                </button>
              </div>

              {landmark.description && (
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {landmark.description}
                </p>
              )}

              {landmark.address && (
                <p className="text-xs text-muted-foreground">{landmark.address}</p>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Submitted by {landmark.author_email ?? "Unknown"}</p>
                <p>{new Date(landmark.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {recommendedRoute && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Navigation size={15} className="text-primary" />
                  Recommended Route
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium text-foreground">{recommendedRoute.title}</p>
                {recommendedRoute.description && (
                  <p className="text-xs text-muted-foreground">{recommendedRoute.description}</p>
                )}
                {recommendedRoute.starting_point && (
                  <p className="text-xs text-muted-foreground">From: {recommendedRoute.starting_point}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ThumbsUp size={12} className="text-primary" />
                    {recommendedRoute.upvotes}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsDown size={12} className="text-destructive" />
                    {recommendedRoute.downvotes}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Route size={16} className="text-primary" />
              Community Routes ({routes.length})
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddRoute(!showAddRoute)}
            >
              <Plus size={14} />
              Add Route
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddRoute && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
              <div className="space-y-1.5">
                <Label htmlFor="routeTitle">Title *</Label>
                <Input
                  id="routeTitle"
                  value={routeTitle}
                  onChange={(e) => setRouteTitle(e.target.value)}
                  placeholder="e.g., From City Terminal"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="routeDesc">Description</Label>
                <textarea
                  id="routeDesc"
                  value={routeDesc}
                  onChange={(e) => setRouteDesc(e.target.value)}
                  placeholder="e.g., Take the Suarez jeep, alight at the Cathedral"
                  rows={2}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="routeStart">Starting Point</Label>
                <Input
                  id="routeStart"
                  value={routeStart}
                  onChange={(e) => setRouteStart(e.target.value)}
                  placeholder="e.g., City Terminal"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmitRoute}
                  disabled={submittingRoute || !routeTitle.trim()}
                >
                  {submittingRoute ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Route size={14} />
                  )}
                  Submit Route
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddRoute(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {routes.length === 0 && !showAddRoute ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No routes yet. Be the first to share how to get here!
            </p>
          ) : (
            <div className="space-y-2">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    activeRouteId === route.id
                      ? "bg-primary/5 border-primary/30"
                      : "bg-muted/30 border-border/50 hover:bg-muted/50"
                  }`}
                  onClick={() => setActiveRouteId(activeRouteId === route.id ? null : route.id)}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{route.title}</p>
                    {route.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{route.description}</p>
                    )}
                    {route.starting_point && (
                      <p className="text-xs text-muted-foreground mt-0.5">From: {route.starting_point}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Route size={12} />
                        {route.distance_km ? `${route.distance_km.toFixed(1)} km` : "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {route.eta_min ? `${route.eta_min} min` : "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
                        {route.fare_php ? `₱${route.fare_php}` : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="text-primary font-medium tabular-nums">▲{route.upvotes}</span>
                      <span className="text-destructive font-medium tabular-nums">▼{route.downvotes}</span>
                      <span className="text-muted-foreground">({(route.upvotes - route.downvotes) > 0 ? "+" : ""}{route.upvotes - route.downvotes})</span>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <VoteButtons
                      routeId={route.id}
                      initialUpvotes={route.upvotes}
                      initialDownvotes={route.downvotes}
                      initialMyVote={routeVotes[route.id] ?? 0}
                      size="sm"
                      voteAction={async (rid, v) => {
                        const { voteLandmarkRoute } = await import("@/actions/landmark.actions");
                        return voteLandmarkRoute(rid, v);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="border border-border rounded-xl bg-card p-4">
        <CommentThread
          routeId={id}
          comments={comments}
          myVotes={myCommentVotes}
          onRefresh={async () => {
            if (!id) return;
            const { getComments } = await import("@/actions/discussion.actions");
            const result = await getComments(id);
            setComments(result.comments);
            setMyCommentVotes(result.myVotes);
          }}
        />
      </div>
    </div>
  );
}
