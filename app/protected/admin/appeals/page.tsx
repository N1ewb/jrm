"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Scale, RefreshCw, CheckCircle2, XCircle, Search,
  ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Appeal {
  id: string;
  user_id: string;
  content_type: string;
  content_id: string;
  reason: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  user_email: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AppealsPage() {
  const router = useRouter();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const fetchAppeals = useCallback(async () => {
    setLoading(true);
    try {
      const { getAppeals } = await import("@/actions/moderation.actions");
      const result = await getAppeals();
      if ("appeals" in result) {
        setAppeals(result.appeals);
      }
    } catch (err) {
      console.error("Failed to fetch appeals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppeals();
  }, [fetchAppeals]);

  const filtered = appeals.filter((appeal) => {
    if (statusFilter !== "all" && appeal.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        appeal.user_email?.toLowerCase().includes(q) ||
        appeal.reason.toLowerCase().includes(q) ||
        appeal.content_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleReview = useCallback(async (
    appealId: string,
    status: "approved" | "rejected",
  ) => {
    setActionLoading(appealId);
    try {
      const { reviewAppeal } = await import("@/actions/moderation.actions");
      const notes = notesMap[appealId] ?? "";
      const result = await reviewAppeal(appealId, status, notes);
      if ("success" in result) {
        setAppeals((prev) =>
          prev.map((a) =>
            a.id === appealId
              ? { ...a, status, reviewed_at: new Date().toISOString(), reviewer_notes: notes || null }
              : a,
          ),
        );
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to review appeal:", err);
    } finally {
      setActionLoading(null);
    }
  }, [notesMap, router]);

  const pendingCount = appeals.filter((a) => a.status === "pending").length;

  return (
    <div className="w-full space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appeals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review user appeals for moderation actions and false positives
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAppeals}
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
            placeholder="Search appeals..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 overflow-x-auto">
          {([
            { key: "pending" as const, label: `Pending (${pendingCount})` },
            { key: "approved" as const, label: "Approved" },
            { key: "rejected" as const, label: "Rejected" },
            { key: "all" as const, label: "All" },
          ]).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setStatusFilter(opt.key)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === opt.key
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
          <Scale size={40} className="text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">No appeals found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {statusFilter === "pending"
              ? "No pending appeals to review."
              : "No appeals match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appeal) => {
            const isExpanded = expandedId === appeal.id;
            const isLoading = actionLoading === appeal.id;
            const isPending = appeal.status === "pending";

            return (
              <Card key={appeal.id}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : appeal.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpandedId(isExpanded ? null : appeal.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Scale size={16} className="shrink-0 text-primary" />
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {appeal.content_type}
                        </Badge>
                        <CardTitle className="text-sm truncate">
                          {appeal.user_email ?? "Unknown user"}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`text-[10px] ${statusColors[appeal.status] ?? ""}`}>
                          {appeal.status}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-muted-foreground" />
                        ) : (
                          <ChevronDown size={16} className="text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(appeal.created_at).toLocaleDateString()}
                      {appeal.content_id && ` — Ref: ${appeal.content_id.slice(0, 8)}...`}
                    </div>
                  </CardHeader>
                </div>

                {isExpanded && (
                  <CardContent className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Appeal reason
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {appeal.reason}
                      </p>
                    </div>

                    {appeal.reviewer_notes && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Reviewer notes
                        </p>
                        <p className="text-sm text-foreground">{appeal.reviewer_notes}</p>
                      </div>
                    )}

                    {isPending && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Reviewer notes (optional)
                          </label>
                          <textarea
                            value={notesMap[appeal.id] ?? ""}
                            onChange={(e) =>
                              setNotesMap((prev) => ({ ...prev, [appeal.id]: e.target.value }))
                            }
                            placeholder="Add notes about this appeal decision..."
                            className="w-full h-20 px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                            onClick={() => handleReview(appeal.id, "approved")}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/30 text-destructive hover:bg-destructive/10 w-full sm:w-auto"
                            onClick={() => handleReview(appeal.id, "rejected")}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <XCircle size={14} />
                            )}
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}

                    {!isPending && appeal.reviewed_at && (
                      <div className="text-xs text-muted-foreground">
                        Reviewed on {new Date(appeal.reviewed_at).toLocaleDateString()}
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
