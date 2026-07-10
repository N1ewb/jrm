"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Route,
  Clock,
  DollarSign,
  MapPin,
  User,
  ChevronLeft,
  Info,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  MessageSquare,
} from "lucide-react";
import VoteButtons from "@/components/vote-buttons";
import CommentThread from "@/components/comment-thread";
import type { CommentRow } from "@/actions/discussion.actions";

const RouteDetailMap = dynamic(
  () => import("@/components/route-detail-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center rounded-lg">
        <span className="text-muted-foreground text-sm">Loading map...</span>
      </div>
    ),
  },
);

export interface Route {
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
}

interface Props {
  routes: Route[];
  myVotes: Record<string, -1 | 0 | 1>;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

function RouteCard({
  route,
  myVote,
  onClick,
}: {
  route: Route;
  myVote: -1 | 0 | 1;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      role="button"
      tabIndex={0}
      className="w-full text-left rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors overflow-hidden cursor-pointer"
    >
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {route.line}
            </h3>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {route.start_point}
            </p>
          </div>
          <Badge
            className={
              statusColors[route.status] ?? "bg-gray-100 text-gray-800"
            }
          >
            {route.status}
          </Badge>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Route size={13} />
            {route.distance_km.toFixed(1)} km
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} />
            {route.eta_min} min
          </span>
          <span className="flex items-center gap-1">
            <DollarSign size={13} />
            ₱{route.fare_php}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={13} />
            {route.type}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User size={13} />
            <span className="truncate">{route.author_email ?? "Unknown"}</span>
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare size={13} />
            {route.comment_count}
          </span>
        </div>
      </div>

      <div
        className="border-t border-border px-4 py-2 flex items-center justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <VoteButtons
          routeId={route.id}
          initialUpvotes={route.upvotes}
          initialDownvotes={route.downvotes}
          initialMyVote={myVote}
          size="md"
        />
      </div>
    </div>
  );
}

export function AllRoutesClient({ routes, myVotes: initialMyVotes }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Route | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [myVotes, setMyVotes] = useState<Record<string, -1 | 0 | 1>>(initialMyVotes);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [myCommentVotes, setMyCommentVotes] = useState<Record<string, -1 | 0 | 1>>({});

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)user-role=([^;]*)/);
    setUserRole(match ? decodeURIComponent(match[1]) : "user");
  }, []);

  const isAdmin = userRole === "admin" || userRole === "gov_official";

  const loadComments = useCallback(async (routeId: string) => {
    const { getComments } = await import("@/actions/discussion.actions");
    const result = await getComments(routeId);
    setComments(result.comments);
    setMyCommentVotes(result.myVotes);
  }, []);

  useEffect(() => {
    if (selected) {
      loadComments(selected.id);
    } else {
      setComments([]);
      setMyCommentVotes({});
    }
  }, [selected, loadComments]);

  function updateSelectedStatus(routeId: string, status: string) {
    setSelected((prev) =>
      prev?.id === routeId ? { ...prev, status } : prev,
    );
  }

  const handleAccept = useCallback(async (routeId: string) => {
    setActionLoading(routeId);

    try {
      const { acceptRoute } = await import("@/actions/map.actions");
      const result = await acceptRoute(routeId);

      if (result.error) {
        alert(result.error);
        setActionLoading(null);
        return;
      }

      updateSelectedStatus(routeId, "active");
      setActionLoading(null);
      router.refresh();
    } catch {
      alert("Failed to accept route. Please try again.");
      setActionLoading(null);
    }
  }, [router]);

  const handleReject = useCallback(async (routeId: string) => {
    if (!window.confirm("Reject this route? It will be marked as rejected.")) return;
    setActionLoading(routeId);

    try {
      const { rejectRoute } = await import("@/actions/map.actions");
      const result = await rejectRoute(routeId);

      if (result.error) {
        alert(result.error);
        setActionLoading(null);
        return;
      }

      updateSelectedStatus(routeId, "rejected");
      setActionLoading(null);
      router.refresh();
    } catch {
      alert("Failed to reject route. Please try again.");
      setActionLoading(null);
    }
  }, [router]);

  const handleDelete = useCallback(async (routeId: string) => {
    if (!window.confirm("Permanently delete this route? This cannot be undone.")) return;
    setActionLoading(routeId);

    try {
      const { deleteRoute } = await import("@/actions/map.actions");
      const result = await deleteRoute(routeId);

      if (result.error) {
        alert(result.error);
        setActionLoading(null);
        return;
      }

      setActionLoading(null);
      setSelected(null);
      router.refresh();
    } catch {
      alert("Failed to delete route. Please try again.");
      setActionLoading(null);
    }
  }, [router]);

  if (selected) {
    const isPending = selected.status === "pending";
    const isLoading = actionLoading === selected.id;

    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} />
          Back to all routes
        </button>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="h-[300px] lg:h-[500px] lg:flex-1 rounded-xl overflow-hidden border border-border">
            <RouteDetailMap waypoints={selected.waypoints} />
          </div>

          <div className="w-full lg:w-80 shrink-0 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{selected.line}</CardTitle>
                  <Badge
                    className={
                      statusColors[selected.status] ??
                      "bg-gray-100 text-gray-800"
                    }
                  >
                    {selected.status}
                  </Badge>
                </div>
                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                  <VoteButtons
                    routeId={selected.id}
                    initialUpvotes={selected.upvotes}
                    initialDownvotes={selected.downvotes}
                    initialMyVote={myVotes[selected.id] ?? 0}
                    size="md"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{selected.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Starting Point</span>
                  <span className="font-medium text-right">
                    {selected.start_point}
                  </span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-medium">
                    {selected.distance_km.toFixed(2)} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ETA</span>
                  <span className="font-medium">{selected.eta_min} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fare</span>
                  <span className="font-bold text-primary text-base">
                    ₱{selected.fare_php}
                  </span>
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <Info size={12} className="text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Initial estimate based on full route (barangay to poblacion).
                  </p>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted by</span>
                  <span className="font-medium">
                    {selected.author_email ?? "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">v{selected.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {new Date(selected.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 pt-2">
                {isPending && isAdmin && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={() => handleAccept(selected.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => handleReject(selected.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <XCircle size={14} />
                      )}
                      Reject
                    </Button>
                  </>
                )}
                {isPending && !isAdmin && (
                  <p className="text-xs text-muted-foreground text-center w-full py-2">
                    Awaiting admin review
                  </p>
                )}
                {!isPending && isAdmin && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDelete(selected.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Delete
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Comments section */}
        <div className="border border-border rounded-xl bg-card p-4">
          <CommentThread
            routeId={selected.id}
            comments={comments}
            myVotes={myCommentVotes}
            onRefresh={() => loadComments(selected.id)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {routes.map((route) => (
        <RouteCard
          key={route.id}
          route={route}
          myVote={myVotes[route.id] ?? 0}
          onClick={() => setSelected(route)}
        />
      ))}
    </div>
  );
}
