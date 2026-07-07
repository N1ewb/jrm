"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/constants";
import { calculateRouteDistance, haversineDistance } from "@/lib/route-calc";
import { RotateCcw, Check, Loader2, AlertCircle, Undo2 } from "lucide-react";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const CLOSE_THRESHOLD_KM = 0.05;

interface RouteDrawProps {
  onRouteComplete: (coords: [number, number][], distance: number) => void;
  onReset: () => void;
}

export default function MapRouteDraw({ onRouteComplete, onReset }: RouteDrawProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const points = useRef<[number, number][]>([]);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [status, setStatus] = useState<"drawing" | "snapping" | "snapped" | "error">("drawing");
  const [errorMsg, setErrorMsg] = useState("");
  const statusRef = useRef(status);
  statusRef.current = status;

  const onRouteCompleteRef = useRef(onRouteComplete);
  onRouteCompleteRef.current = onRouteComplete;

  const addLayer = useCallback((id: string, sourceId: string, paint: any, layout?: any) => {
    const map = mapInstance.current;
    if (!map) return;
    try {
      if (map.getLayer(id)) map.removeLayer(id);
      map.addLayer({ id, type: "line", source: sourceId, layout: layout ?? { "line-cap": "round", "line-join": "round" }, paint });
    } catch {}
  }, []);

  const addSourceAndLayer = useCallback((
    sourceId: string,
    coords: [number, number][],
    paint: any,
    layout?: any,
  ) => {
    const map = mapInstance.current;
    if (!map || coords.length < 2) return;
    try {
      if (map.getLayer(`${sourceId}-line`)) map.removeLayer(`${sourceId}-line`);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch {}
    map.addSource(sourceId, {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } },
    });
    addLayer(`${sourceId}-line`, sourceId, paint, layout);
  }, [addLayer]);

  const clearAll = useCallback(() => {
    const map = mapInstance.current;
    if (!map) return;
    for (const m of markers.current) m.remove();
    markers.current = [];
    for (const id of ["draw-line", "snapped-line", "draw-source", "snapped-source"]) {
      try {
        if (map.getLayer(`${id}-line`)) map.removeLayer(`${id}-line`);
        if (map.getSource(id)) map.removeSource(id);
      } catch {}
    }
    points.current = [];
    setStatus("drawing");
    setErrorMsg("");
  }, []);

  const redrawDrawLine = useCallback(() => {
    addSourceAndLayer(
      "draw-source",
      points.current,
      { "line-color": "#5000BD", "line-width": 3, "line-opacity": 0.7, "line-dasharray": [2, 2] },
    );
  }, [addSourceAndLayer]);

  const displaySnappedRoute = useCallback((coords: [number, number][]) => {
    addSourceAndLayer(
      "snapped-source",
      coords,
      { "line-color": "#22c55e", "line-width": 5, "line-opacity": 0.9 },
    );
  }, [addSourceAndLayer]);

  const placeMarker = useCallback((coord: [number, number], index: number) => {
    const el = document.createElement("div");
    el.className = "w-7 h-7 rounded-full bg-primary border-2 border-white shadow-md flex items-center justify-center text-[10px] font-bold text-primary-foreground";
    el.textContent = String(index + 1);
    el.style.cursor = "default";
    const marker = new maplibregl.Marker({ element: el }).setLngLat(coord).addTo(mapInstance.current!);
    markers.current.push(marker);
  }, []);

  const matchRoute = useCallback(async (waypoints: [number, number][]) => {
    setStatus("snapping");
    setErrorMsg("");

    try {
      const { matchRouteToRoads } = await import("@/actions/map.actions");
      const result = await matchRouteToRoads(waypoints);

      if (result.error) throw new Error(result.error);

      const snappedCoords = result.coordinates!;
      const distanceM = result.distance!;
      const distanceKm = distanceM / 1000;

      displaySnappedRoute(snappedCoords);
      setStatus("snapped");
      onRouteCompleteRef.current(snappedCoords, distanceKm);
    } catch (err) {
      console.error("Route matching failed:", err);
      setErrorMsg("Could not snap to roads. Using straight-line route.");
      setStatus("snapped");

      const closed = [...waypoints];
      const distance = calculateRouteDistance(closed);
      redrawDrawLine();
      onRouteCompleteRef.current(closed, distance);
    }
  }, [displaySnappedRoute, redrawDrawLine]);

  const handleMapClick = useCallback((e: maplibregl.MapMouseEvent) => {
    if (statusRef.current !== "drawing") return;

    const coord: [number, number] = [e.lngLat.lng, e.lngLat.lat];

    if (points.current.length >= 2) {
      const first = points.current[0];
      const dist = haversineDistance(coord, first);
      if (dist <= CLOSE_THRESHOLD_KM) {
        const waypoints = [...points.current, points.current[0]];
        matchRoute(waypoints);
        return;
      }
    }

    points.current.push(coord);
    placeMarker(coord, points.current.length - 1);
    redrawDrawLine();
  }, [placeMarker, redrawDrawLine, matchRoute]);

  const handleForceComplete = useCallback(() => {
    if (points.current.length < 2 || statusRef.current !== "drawing") return;
    const waypoints = [...points.current, points.current[0]];
    matchRoute(waypoints);
  }, [matchRoute]);

  const handleUndo = useCallback(() => {
    if (points.current.length === 0 || statusRef.current !== "drawing") return;

    const lastMarker = markers.current.pop();
    if (lastMarker) lastMarker.remove();

    points.current.pop();

    if (points.current.length < 2) {
      const map = mapInstance.current;
      if (map) {
        try {
          if (map.getLayer("draw-source-line")) map.removeLayer("draw-source-line");
          if (map.getSource("draw-source")) map.removeSource("draw-source");
        } catch {}
      }
    } else {
      redrawDrawLine();
    }
  }, [redrawDrawLine]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      handleUndo();
    }
    if (e.key === "Enter" && statusRef.current === "drawing" && points.current.length >= 3) {
      e.preventDefault();
      handleForceComplete();
    }
  }, [handleUndo, handleForceComplete]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.on("click", handleMapClick);
    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, [handleMapClick]);

  const handleReset = useCallback(() => {
    clearAll();
    onReset();
  }, [clearAll, onReset]);

  const isDrawing = status === "drawing";
  const isSnapping = status === "snapping";
  const isComplete = status === "snapped";

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {isDrawing && points.current.length === 0 && (
        <div className="absolute top-4 left-4 right-4 z-10 max-w-md mx-auto">
          <div className="bg-white dark:bg-card rounded-xl shadow-lg px-4 py-3 border border-border/50 text-center">
            <p className="text-sm font-medium text-foreground">
              Click on the map to draw the route
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click along the roads.{" "}
              <strong>Click near the first stop or tap &quot;Complete&quot;</strong> to snap to roads
            </p>
          </div>
        </div>
      )}

      {isSnapping && (
        <div className="absolute top-4 left-4 right-4 z-10 max-w-md mx-auto">
          <div className="bg-white dark:bg-card rounded-xl shadow-lg px-4 py-3 border border-border/50 flex items-center gap-3">
            <Loader2 size={18} className="animate-spin text-primary shrink-0" />
            <span className="text-sm text-foreground">Snapping route to roads...</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="absolute top-20 left-4 right-4 z-10 max-w-md mx-auto">
          <div className="bg-destructive/10 text-destructive rounded-xl px-4 py-2.5 border border-destructive/20 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            {errorMsg}
          </div>
        </div>
      )}

      {/* Undo button — always visible when drawing with at least 1 stop */}
      {isDrawing && points.current.length > 0 && (
        <button
          type="button"
          onClick={handleUndo}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 h-10 px-4 flex items-center gap-2 rounded-full bg-white dark:bg-card shadow-lg border border-border/50 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          aria-label="Undo last stop"
        >
          <Undo2 size={15} />
          Undo
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Ctrl+Z
          </span>
        </button>
      )}

      {/* Keyboard hint for Enter — desktop */}
      {isDrawing && points.current.length >= 3 && (
        <div className="absolute top-20 right-4 z-10 hidden lg:flex items-center gap-1.5 bg-white dark:bg-card px-3 py-1.5 rounded-full shadow-lg border border-border/50 text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px]">Enter</kbd> to finish
        </div>
      )}

      <div className="absolute bottom-6 left-4 right-4 z-10 max-w-md mx-auto">
        {isDrawing && points.current.length >= 3 && (
          <div className="bg-white dark:bg-card rounded-xl shadow-lg border border-border/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{points.current.length} stops</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleForceComplete}
                  className="h-9 px-4 flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Check size={15} />
                  Snap to Roads
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Reset"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {isDrawing && points.current.length > 0 && points.current.length < 3 && (
          <div className="bg-white dark:bg-card rounded-xl shadow-lg border border-border/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{points.current.length} stop{points.current.length !== 1 ? "s" : ""}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-9 px-4 flex items-center gap-1.5 rounded-lg bg-muted text-muted-foreground hover:text-destructive transition-colors text-sm font-medium"
                >
                  <RotateCcw size={15} />
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {isSnapping && (
          <div className="bg-white dark:bg-card rounded-xl shadow-lg border border-border/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{points.current.length} stops</span>
              <button
                type="button"
                onClick={handleReset}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Reset"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="bg-white dark:bg-card rounded-xl shadow-lg border border-green-200 dark:border-green-800 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-foreground">Route ready</span>
                <span className="text-xs text-muted-foreground">{points.current.length} stops</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Reset"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
