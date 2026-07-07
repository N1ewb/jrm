"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ArrowLeft, Bell } from "lucide-react";
import { useTripTracking } from "@/hooks/use-trip-tracking";
import TripInfoPanel from "@/components/trip-info-panel";
import type { RouteRow } from "@/actions/route.actions";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

interface TripData {
  destinationName: string;
  destinationLng: number;
  destinationLat: number;
  boardingIndex: number;
  alightingIndex: number;
  boardingDistanceKm: number;
  alightingDistanceKm: number;
  originLng: number | null;
  originLat: number | null;
}

function readTripData(): TripData | null {
  try {
    const raw = localStorage.getItem("active_trip");
    if (!raw) return null;
    return JSON.parse(raw) as TripData;
  } catch {
    return null;
  }
}

export default function TripView({ route }: { route: RouteRow }) {
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [tripData] = useState<TripData | null>(readTripData);
  const [arrived, setArrived] = useState(false);

  const boardingCoord = route.waypoints[tripData?.boardingIndex ?? 0];
  const alightingCoord = route.waypoints[tripData?.alightingIndex ?? route.waypoints.length - 1];

  const handleArrival = useCallback(() => {
    setArrived(true);

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Arriving at " + (tripData?.destinationName ?? "destination"), {
        body: "Get ready to alight. Your stop is near.",
      });
    }
  }, [tripData?.destinationName]);

  const tracking = useTripTracking({
    waypoints: route.waypoints,
    alightingIndex: tripData?.alightingIndex ?? route.waypoints.length - 1,
    arrivalThresholdKm: 0.1,
    onArrival: handleArrival,
  });

  // Request notification permission + start tracking on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    tracking.requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: boardingCoord,
      zoom: 14,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      // Route line
      map.addSource("route-line", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: route.waypoints },
        },
      });

      map.addLayer({
        id: "route-line-layer",
        type: "line",
        source: "route-line",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#5000BD", "line-width": 5, "line-opacity": 0.9 },
      });

      // Walking paths
      const walkingCoords: [number, number][] = [];
      if (tripData) {
        walkingCoords.push(boardingCoord, [tripData.destinationLng, tripData.destinationLat]);
      }

      if (walkingCoords.length >= 2) {
        map.addSource("walking-path", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates: [boardingCoord, alightingCoord] },
              },
            ],
          },
        });

        map.addLayer({
          id: "walking-path-layer",
          type: "line",
          source: "walking-path",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#F97316", "line-width": 3, "line-opacity": 0.8, "line-dasharray": [4, 4] },
        });
      }

      // Boarding stop marker
      map.addSource("boarding-stop", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: boardingCoord },
        },
      });

      map.addLayer({
        id: "boarding-stop-layer",
        type: "circle",
        source: "boarding-stop",
        paint: {
          "circle-radius": 8,
          "circle-color": "#22C55E",
          "circle-stroke-width": 3,
          "circle-stroke-color": "#FFFFFF",
        },
      });

      // Alighting stop marker
      map.addSource("alighting-stop", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: alightingCoord },
        },
      });

      map.addLayer({
        id: "alighting-stop-layer",
        type: "circle",
        source: "alighting-stop",
        paint: {
          "circle-radius": 8,
          "circle-color": "#F97316",
          "circle-stroke-width": 3,
          "circle-stroke-color": "#FFFFFF",
        },
      });

      // Fit bounds
      const bounds = route.waypoints.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(route.waypoints[0], route.waypoints[0]),
      );
      if (tripData) {
        bounds.extend([tripData.destinationLng, tripData.destinationLat]);
      }
      map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
    });

    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update user marker on GPS position change
  useEffect(() => {
    if (!tracking.currentPosition || !mapInstance.current) return;

    const { lng, lat } = tracking.currentPosition;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([lng, lat]);
    } else {
      const el = document.createElement("div");
      el.style.cssText =
        "width:18px;height:18px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 0 0 3px rgba(59,130,246,0.3);";
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current);
      userMarkerRef.current = marker;
    }
  }, [tracking.currentPosition]);

  const handleEndTrip = useCallback(() => {
    localStorage.removeItem("active_trip");
    router.push("/protected/user");
  }, [router]);

  if (!tripData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-destructive font-medium">No active trip found.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Start a trip from the route suggestions on the dashboard.
        </p>
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

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-border">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/40 to-transparent px-4 pt-4 pb-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleEndTrip}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/90 dark:bg-card/90 shadow-lg"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div className="bg-white/90 dark:bg-card/90 rounded-lg shadow-lg px-3 py-2">
            <p className="text-xs text-muted-foreground">Active Trip</p>
            <p className="text-sm font-semibold text-foreground">{route.line}</p>
          </div>
          <div className="ml-auto bg-white/90 dark:bg-card/90 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
            <Bell size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {tracking.isTracking ? "Tracking" : "No GPS"}
            </span>
          </div>
        </div>
      </div>

      {/* GPS error toast */}
      {tracking.error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-destructive text-destructive-foreground px-4 py-2 rounded-xl shadow-lg text-xs">
          {tracking.error}
        </div>
      )}

      {/* Info panel */}
      <div className="absolute bottom-4 left-4 right-4 z-10 max-w-md mx-auto">
        <TripInfoPanel
          destinationName={tripData.destinationName}
          lineName={route.line}
          vehicleType={route.type}
          boardingDistanceKm={tripData.boardingDistanceKm}
          alightingDistanceKm={tripData.alightingDistanceKm}
          routeDistanceKm={route.distance_km}
          progress={tracking.progress}
          etaMin={route.eta_min}
          farePhp={route.fare_php}
          distanceToAlightingKm={tracking.distanceToAlightingKm}
          isArriving={arrived}
          onEndTrip={handleEndTrip}
        />
      </div>
    </div>
  );
}
