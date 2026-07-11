"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, DollarSign, MapPin, User, Route, Search,
  CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronUp,
  Loader2, MessageSquare, CheckSquare, Square, Filter,
  ArrowUpDown, Flag,
} from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PendingRoute {
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

type SortKey = "priority" | "votes" | "date" | "line";
type FilterType = "all" | "Jeep" | "Bus";

export default function ReviewQueuePage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<PendingRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortKey>("priority");
  const [sortAsc, setSortAsc] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [bulkRejectReason, setBulkRejectReason] = useState("");

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const { getPendingRoutes } = await import("@/actions/review.actions");
      const result = await getPendingRoutes();
      if ("routes" in result) {
        setRoutes(result.routes);
      }
    } catch (err) {
      console.error("Failed to fetch pending routes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const filteredRoutes = useMemo(() => {
    let result = routes;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.line.toLowerCase().includes(q) ||
          r.start_point.toLowerCase().includes(q) ||
          r.author_email?.toLowerCase().includes(q),
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((r) => r.type === typeFilter);
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "priority":
          cmp = a.priority_score - b.priority_score;
          break;
        case "votes":
          cmp = (a.upvotes - a.downvotes) - (b.upvotes - b.downvotes);
          break;
        case "date":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "line":
          cmp = a.line.localeCompare(b.line);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [routes, searchQuery, typeFilter, sortBy, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(key === "priority");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(filteredRoutes.map((r) => r.id)));
      setSelectAll(true);
    }
  };

  const handleSingleAccept = useCallback(async (routeId: string) => {
    setActionLoading(routeId);
    try {
      const { acceptRoute } = await import("@/actions/review.actions");
      const result = await acceptRoute(routeId);
      if ("success" in result) {
        setRoutes((prev) => prev.filter((r) => r.id !== routeId));
        setSelectedIds((prev) => { const n = new Set(prev); n.delete(routeId); return n; });
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to accept route:", err);
    } finally {
      setActionLoading(null);
    }
  }, [router]);

  const handleSingleReject = useCallback(async (routeId: string) => {
    setRejectTargetId(routeId);
    setRejectionReason("");
    setShowRejectModal(true);
  }, []);

  const confirmReject = useCallback(async () => {
    if (!rejectTargetId) return;
    setActionLoading(rejectTargetId);
    setShowRejectModal(false);
    try {
      const { rejectRoute } = await import("@/actions/review.actions");
      const result = await rejectRoute(rejectTargetId, rejectionReason || undefined);
      if ("success" in result) {
        setRoutes((prev) => prev.filter((r) => r.id !== rejectTargetId));
        setSelectedIds((prev) => { const n = new Set(prev); n.delete(rejectTargetId!); return n; });
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to reject route:", err);
    } finally {
      setActionLoading(null);
      setRejectTargetId(null);
    }
  }, [rejectTargetId, rejectionReason, router]);

  const handleBulkAccept = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setActionLoading("bulk");
    try {
      const { bulkAcceptRoutes } = await import("@/actions/review.actions");
      const result = await bulkAcceptRoutes(Array.from(selectedIds));
      if ("accepted" in result) {
        setRoutes((prev) => prev.filter((r) => !selectedIds.has(r.id)));
        setSelectedIds(new Set());
        setSelectAll(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to bulk accept:", err);
    } finally {
      setActionLoading(null);
    }
  }, [selectedIds, router]);

  const handleBulkReject = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const reason = bulkRejectReason || undefined;
    setActionLoading("bulk");
    try {
      const { bulkRejectRoutes } = await import("@/actions/review.actions");
      const result = await bulkRejectRoutes(Array.from(selectedIds), reason);
      if ("rejected" in result) {
        setRoutes((prev) => prev.filter((r) => !selectedIds.has(r.id)));
        setSelectedIds(new Set());
        setSelectAll(false);
        setBulkRejectReason("");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to bulk reject:", err);
    } finally {
      setActionLoading(null);
    }
  }, [selectedIds, bulkRejectReason, router]);

  const SortButton = ({ label, sortKey }: { label: string; sortKey: SortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(sortKey)}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        sortBy === sortKey
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {label}
      <ArrowUpDown size={12} className={sortBy === sortKey ? "opacity-100" : "opacity-40"} />
    </button>
  );

  const netVotes = (r: PendingRoute) => r.upvotes - r.downvotes;

  return (
    <div className="w-full space-y-6 pb-24 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Review Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {routes.length} pending route{routes.length !== 1 ? "s" : ""} — sorted by community priority score
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRoutes}
          disabled={loading}
          className="self-start"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by line, route, or author..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 overflow-x-auto">
            {(["all", "Jeep", "Bus"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  typeFilter === t
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "all" ? "All Types" : t}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Filter size={14} />
            Sort
          </button>
        </div>

        <div className={`${showFilters ? "flex" : "hidden"} sm:flex flex-wrap items-center gap-1`}>
          <span className="text-xs text-muted-foreground mr-1">Sort:</span>
          <SortButton label="Priority" sortKey="priority" />
          <SortButton label="Votes" sortKey="votes" />
          <SortButton label="Date" sortKey="date" />
          <SortButton label="Line" sortKey="line" />
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 bg-card border border-border rounded-xl p-3 shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            {selectedIds.size} selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleBulkAccept}
              disabled={actionLoading === "bulk"}
            >
              {actionLoading === "bulk" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Accept All
            </Button>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={bulkRejectReason}
                onChange={(e) => setBulkRejectReason(e.target.value)}
                placeholder="Rejection reason (optional)..."
                className="h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30 w-40 sm:w-56"
              />
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={handleBulkReject}
                disabled={actionLoading === "bulk"}
              >
                {actionLoading === "bulk" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <XCircle size={14} />
                )}
                Reject All
              </Button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setSelectedIds(new Set()); setSelectAll(false); }}
            className="text-xs text-muted-foreground hover:text-foreground ml-auto"
          >
            Clear selection
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Flag size={40} className="text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">
            {searchQuery || typeFilter !== "all"
              ? "No routes match your search or filters."
              : "All caught up!"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {searchQuery || typeFilter !== "all"
              ? "Try adjusting your search."
              : "No pending routes need review."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Select all row */}
          <div className="flex items-center gap-2 px-1 py-1">
            <button
              type="button"
              onClick={handleSelectAll}
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {selectAll ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
              Select all {filteredRoutes.length}
            </button>
          </div>

          {filteredRoutes.map((route) => {
            const isSelected = selectedIds.has(route.id);
            const isLoading = actionLoading === route.id;
            const net = netVotes(route);

            return (
              <Card
                key={route.id}
                className={`transition-colors ${isSelected ? "ring-2 ring-primary/30" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSelect(route.id)}
                      className="mt-1 shrink-0"
                      aria-label={isSelected ? "Deselect" : "Select"}
                    >
                      {isSelected ? (
                        <CheckSquare size={18} className="text-primary" />
                      ) : (
                        <Square size={18} className="text-muted-foreground" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h3 className="font-semibold text-foreground truncate text-sm">
                          {route.line}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{route.type}</Badge>
                          <Badge className="text-[10px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            Pending
                          </Badge>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {route.start_point}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          <span className="truncate max-w-[120px]">{route.author_email ?? "Unknown"}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Route size={12} />
                          {route.distance_km.toFixed(1)} km
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {route.eta_min} min
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={12} />
                          ₱{route.fare_php}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} />
                          {route.comment_count}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                        <span className="text-xs">
                          <span className="text-muted-foreground">Votes:</span>{" "}
                          <span className="text-primary font-medium tabular-nums">▲{route.upvotes}</span>{" "}
                          <span className="text-destructive font-medium tabular-nums">▼{route.downvotes}</span>
                          <span className="text-muted-foreground ml-1">({net > 0 ? "+" : ""}{net})</span>
                        </span>
                        <span className="text-xs">
                          <span className="text-muted-foreground">Priority:</span>{" "}
                          <span className="font-mono font-medium text-foreground">{route.priority_score.toFixed(1)}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(route.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {route.rejection_reason && (
                        <div className="mt-2 text-xs text-destructive/80 bg-destructive/5 rounded-lg px-2 py-1">
                          Previously rejected: {route.rejection_reason}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 h-8 text-xs"
                        onClick={() => handleSingleAccept(route.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={12} />
                        )}
                        <span className="hidden sm:inline">Accept</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 h-8 text-xs"
                        onClick={() => handleSingleReject(route.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <XCircle size={12} />
                        )}
                        <span className="hidden sm:inline">Reject</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Single reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-5 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Reject Route</h3>
            <p className="text-sm text-muted-foreground">
              Provide a reason for rejection (optional). The submitter will be notified.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full h-24 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setShowRejectModal(false); setRejectTargetId(null); }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={confirmReject}
              >
                <XCircle size={14} />
                Reject Route
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
