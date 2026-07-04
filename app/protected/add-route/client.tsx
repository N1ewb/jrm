"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import RouteInfoForm from "@/components/route-info-form";

const MapRouteDraw = dynamic(() => import("@/components/map-route-draw"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-xl bg-muted animate-pulse flex items-center justify-center">
      <span className="text-muted-foreground text-sm">Loading map...</span>
    </div>
  ),
});

export default function AddRouteClient() {
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [distance, setDistance] = useState(0);

  const handleRouteComplete = useCallback(
    (coords: [number, number][], dist: number) => {
      setRouteCoords(coords);
      setDistance(dist);
    },
    [],
  );

  const handleReset = useCallback(() => {
    setRouteCoords(null);
    setDistance(0);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6 flex-1">
      <div className="flex-1 rounded-xl overflow-hidden border border-border min-h-[300px] lg:min-h-0">
        <MapRouteDraw
          onRouteComplete={handleRouteComplete}
          onReset={handleReset}
        />
      </div>

      <div className="w-full lg:w-96 shrink-0">
        {routeCoords ? (
          <RouteInfoForm
            routeCoords={routeCoords}
            distance={distance}
            onReset={handleReset}
          />
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground">
              No route drawn yet
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Use the map to draw a closed route, then fill in the details here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
