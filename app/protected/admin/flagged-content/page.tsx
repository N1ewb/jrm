"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Flag, CheckCircle2, EyeOff, AlertTriangle, Ban, RefreshCw,
  ChevronDown, ChevronUp, Search, MessageSquare, Route,
  Loader2,
} from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FlaggedItem {
  id: string;
  content_type: string;
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

const typeIcons: Record<string, React.ElementType> = {
  discussion: MessageSquare,
  route: Route,
  route_report: Flag,
};

const typeLabels: Record<string, string> = {
  discussion: "Comment",
  route: "Route",
  route_report: "Route Report",
};

export default function FlaggedContentPage() {
  const router = useRouter();
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterReviewed, setFilterReviewed] = useState<"all" | "unreviewed" | "reviewed">("unreviewed");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { getFlaggedContent } = await import("@/actions/moderation.actions");
      const result = await getFlaggedContent();
      if ("items" in result) {
        setItems(result.items);
      }
    } catch (err) {
      console.error("Failed to fetch flagged content:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = items.filter((item) => {
    if (filterReviewed === "unreviewed" && item.reviewed) return false;
    if (filterReviewed === "reviewed" && !item.reviewed) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.reason.toLowerCase().includes(q) ||
        item.reporter_email?.toLowerCase().includes(q) ||
        item.content_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleReview = useCallback(async (
    itemId: string,
    action: "dismiss" | "hide" | "warn_user" | "ban_user",
  ) => {
    setActionLoading(itemId);
    try {
      const { reviewFlaggedItem } = await import("@/actions/moderation.actions");
      const notes = notesMap[itemId] ?? "";
      const result = await reviewFlaggedItem(itemId, action, notes);
      if ("success" in result) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? { ...i, reviewed: true, review_action: action, reviewed_at: new Date().toISOString() }
              : i,
          ),
        );
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to review item:", err);
    } finally {
      setActionLoading(null);
    }
  }, [notesMap, router]);

  const pendingCount = items.filter((i) => !i.reviewed).length;

  return (
    <div className="w-full space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flagged Content</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review reported comments, routes, and other content
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchItems}
          disabled={loading}
          className="self-start"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search flagged content..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 overflow-x-auto">
          {([
            { key: "unreviewed" as const, label: `Pending (${pendingCount})` },
            { key: "reviewed" as const, label: "Reviewed" },
            { key: "all" as const, label: "All" },
          ]).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilterReviewed(opt.key)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterReviewed === opt.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Flag size={40} className="text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">No flagged content</p>
          <p className="text-xs text-muted-foreground mt-1">
            {filterReviewed === "unreviewed"
              ? "All caught up! No pending items to review."
              : "No items match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const Icon = typeIcons[item.content_type] ?? Flag;
            const isExpanded = expandedId === item.id;
            const isLoading = actionLoading === item.id;

            return (
              <Card key={item.id} className={item.reviewed ? "opacity-60" : ""}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpandedId(isExpanded ? null : item.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon size={16} className="shrink-0 text-primary" />
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {typeLabels[item.content_type] ?? item.content_type}
                        </Badge>
                        <CardTitle className="text-sm truncate">
                          {item.reason}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.reviewed ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {item.review_action ?? "Reviewed"}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] animate-pulse">
                            Pending
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-muted-foreground" />
                        ) : (
                          <ChevronDown size={16} className="text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                      <span className="truncate">By: {item.reporter_email ?? "Anonymous"}</span>
                      <span className="shrink-0">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardHeader>
                </div>

                {isExpanded && (
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                      <span className="font-medium text-foreground">Content ID: </span>
                      {item.content_id}
                    </div>

                    {!item.reviewed && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Admin notes (optional)
                          </label>
                          <textarea
                            value={notesMap[item.id] ?? ""}
                            onChange={(e) =>
                              setNotesMap((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            placeholder="Add notes about this review..."
                            className="w-full h-20 px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReview(item.id, "dismiss")}
                            disabled={isLoading}
                            className="w-full sm:w-auto"
                          >
                            {isLoading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-yellow-600/30 text-yellow-600 hover:bg-yellow-600/10 w-full sm:w-auto"
                            onClick={() => handleReview(item.id, "hide")}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <EyeOff size={14} />
                            )}
                            Hide
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-600/30 text-orange-600 hover:bg-orange-600/10 w-full sm:w-auto"
                            onClick={() => handleReview(item.id, "warn_user")}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <AlertTriangle size={14} />
                            )}
                            Warn
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/30 text-destructive hover:bg-destructive/10 w-full sm:w-auto"
                            onClick={() => {
                              if (window.confirm("Ban this user? This action can be reversed via the appeals process.")) {
                                handleReview(item.id, "ban_user");
                              }
                            }}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Ban size={14} />
                            )}
                            Ban
                          </Button>
                        </div>
                      </div>
                    )}

                    {item.reviewed && item.review_action && (
                      <div className="text-xs text-muted-foreground">
                        Action: <span className="font-medium text-foreground">{item.review_action}</span>
                        {item.reviewed_at && (
                          <span className="ml-2">
                            on {new Date(item.reviewed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
