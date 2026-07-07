"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TripView from "@/components/trip-view";
import { getRouteById, type RouteRow } from "@/actions/route.actions";

export default function TripPageInner() {
  const params = useParams<{ routeId: string }>();
  const router = useRouter();
  const [route, setRoute] = useState<RouteRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRouteById(params.routeId).then((result) => {
      if (result.error) {
        setError(result.error);
      } else if (result.route) {
        setRoute(result.route);
      }
      setLoading(false);
    });
  }, [params.routeId]);

  if (loading) {
    return (
      <div className="w-full h-full min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <span className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-destructive font-medium">{error ?? "Route not found"}</p>
        <button
          type="button"
          onClick={() => router.push("/protected/user")}
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return <TripView route={route} />;
}
