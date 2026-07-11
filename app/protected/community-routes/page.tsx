"use client";

import { useEffect, useState } from "react";
import { AllRoutesClient } from "../all-routes/client";
import type { Route } from "../all-routes/client";

export default function CommunityRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const { getRoutes } = await import("@/actions/map.actions");
        const result = await getRoutes();
        if (result.error) {
          setError(result.error);
        } else {
          setRoutes(result.routes?.filter((r: Route) => r.status === "pending") ?? []);
        }
      } catch {
        setError("Failed to load routes");
      } finally {
        setLoading(false);
      }
    }
    fetchRoutes();
  }, []);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Community Routes
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Routes submitted by the community that are pending review
        </p>
      </div>

      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && routes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-xl font-semibold text-foreground">
            No Community Routes
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            No pending community submissions at this time.
          </p>
        </div>
      )}

      {!loading && !error && routes.length > 0 && (
        <AllRoutesClient routes={routes} myVotes={{}} />
      )}
    </div>
  );
}
