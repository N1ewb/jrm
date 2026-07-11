"use client";

import { useEffect, useState } from "react";
import AdminDashboard from "./AdminDashboard";
import type { AdminStats } from "@/actions/admin.actions";

function DashboardFallback() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Loading analytics...
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { getAdminStats } = await import("@/actions/admin.actions");
        const result = await getAdminStats();
        setStats(result);
      } catch {
        setError("Failed to load stats");
      }
    }
    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-destructive font-medium">{error}</p>
      </div>
    );
  }

  if (!stats) return <DashboardFallback />;
  return <AdminDashboard stats={stats} />;
}
