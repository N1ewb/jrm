"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Search, RefreshCw, Ban, CheckCircle2, AlertTriangle,
  Undo2, Loader2, UserX, UserCheck,
} from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ModerationAction {
  id: string;
  admin_id: string;
  target_user_id: string;
  action: string;
  reason: string;
  created_at: string;
  target_email: string | null;
}

interface BannedUser {
  id: string;
  email: string | null;
  banned_at: string;
}

export default function ModerationPage() {
  const router = useRouter();
  const [log, setLog] = useState<ModerationAction[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [warnEmail, setWarnEmail] = useState("");
  const [warnReason, setWarnReason] = useState("");
  const [warnResult, setWarnResult] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [showWarnForm, setShowWarnForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { getModerationLog },
        { getBannedUsers },
      ] = await Promise.all([
        import("@/actions/moderation.actions"),
        import("@/actions/moderation.actions"),
      ]);
      const [logResult, bannedResult] = await Promise.all([
        getModerationLog(),
        getBannedUsers(),
      ]);
      if ("actions" in logResult) setLog(logResult.actions);
      if ("users" in bannedResult) setBannedUsers(bannedResult.users);
    } catch (err) {
      console.error("Failed to fetch moderation data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWarnUser = useCallback(async () => {
    if (!warnEmail.trim() || !warnReason.trim()) {
      setWarnResult("Please fill in all fields");
      return;
    }

    setActionLoading("warn");
    setWarnResult(null);

    try {
      const { warnUser } = await import("@/actions/moderation.actions");
      const result = await warnUser(warnEmail.trim(), warnReason.trim());
      if ("success" in result) {
        setWarnResult("Warning issued successfully");
        setWarnEmail("");
        setWarnReason("");
        setShowWarnForm(false);
        fetchData();
        router.refresh();
      } else {
        setWarnResult(result.error);
      }
    } catch {
      setWarnResult("Failed to issue warning");
    } finally {
      setActionLoading(null);
    }
  }, [warnEmail, warnReason, fetchData, router]);

  const handleBanUser = useCallback(async (userId: string, email: string | null) => {
    if (!window.confirm(`Ban user ${email ?? userId}?`)) return;

    setActionLoading(userId);
    try {
      const { banUser } = await import("@/actions/moderation.actions");
      const result = await banUser(userId, "Banned by moderator");
      if ("success" in result) {
        fetchData();
        router.refresh();
      }
    } catch {
      console.error("Failed to ban user");
    } finally {
      setActionLoading(null);
    }
  }, [fetchData, router]);

  const handleUnbanUser = useCallback(async (userId: string) => {
    if (!window.confirm("Unban this user?")) return;

    setActionLoading(userId);
    try {
      const { unbanUser } = await import("@/actions/moderation.actions");
      const result = await unbanUser(userId);
      if ("success" in result) {
        setBannedUsers((prev) => prev.filter((u) => u.id !== userId));
        fetchData();
        router.refresh();
      }
    } catch {
      console.error("Failed to unban user");
    } finally {
      setActionLoading(null);
    }
  }, [fetchData, router]);

  const filteredLog = log.filter((entry) => {
    if (actionFilter !== "all" && entry.action !== actionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        entry.target_email?.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q) ||
        entry.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Moderation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Warn or ban users, view moderation history
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              Issue Warning
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showWarnForm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWarnForm(true)}
              >
                <AlertTriangle size={14} />
                Warn a User
              </Button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    User email or ID
                  </label>
                  <input
                    type="text"
                    value={warnEmail}
                    onChange={(e) => setWarnEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Reason for warning
                  </label>
                  <textarea
                    value={warnReason}
                    onChange={(e) => setWarnReason(e.target.value)}
                    placeholder="Explain why this user is being warned..."
                    className="w-full h-20 px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
                {warnResult && (
                  <p className={`text-xs ${warnResult.includes("success") ? "text-green-600" : "text-destructive"}`}>
                    {warnResult}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    size="sm"
                    onClick={handleWarnUser}
                    disabled={actionLoading === "warn"}
                    className="w-full sm:w-auto"
                  >
                    {actionLoading === "warn" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <AlertTriangle size={14} />
                    )}
                    Issue Warning
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowWarnForm(false);
                      setWarnResult(null);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserX size={16} className="text-destructive" />
              Banned Users ({bannedUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bannedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No banned users</p>
            ) : (
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {bannedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.email ?? "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Banned {new Date(user.banned_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-green-600 hover:text-green-700 hover:bg-green-600/10 self-start sm:self-auto"
                      onClick={() => handleUnbanUser(user.id)}
                      disabled={actionLoading === user.id}
                    >
                      {actionLoading === user.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Undo2 size={14} />
                      )}
                      Unban
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              Moderation Log
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search moderation log..."
                className="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 overflow-x-auto">
              {([
                { key: "all", label: "All" },
                { key: "warn", label: "Warnings" },
                { key: "ban", label: "Bans" },
                { key: "unban", label: "Unbans" },
                { key: "hide_content", label: "Hidden" },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setActionFilter(opt.key)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    actionFilter === opt.key
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
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield size={32} className="text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No moderation actions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLog.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {entry.action === "ban" ? (
                      <Ban size={14} className="shrink-0 text-destructive" />
                    ) : entry.action === "unban" ? (
                      <CheckCircle2 size={14} className="shrink-0 text-green-600" />
                    ) : (
                      <AlertTriangle size={14} className="shrink-0 text-orange-500" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {entry.target_email ?? "Unknown user"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {entry.action.replace(/_/g, " ")} — {entry.reason}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
