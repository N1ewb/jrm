"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Crosshair, X } from "lucide-react";
import PlaceSearch from "@/components/place-search";
import RouteSuggestions from "@/components/route-suggestions";
import LocationDeniedOverlay from "@/components/location-denied-overlay";
import BottomInfoBar from "@/components/bottom-info-bar";
import { getActiveRoutes, type RouteRow } from "@/actions/route.actions";
import { findNearbyRoutes, findRouteTransfers, type NearbyRoute } from "@/lib/route-calc";
import { findMultiHopRoutes, type MultiHopJourney } from "@/lib/pathfinding";
import { ILIGAN_LANDMARKS } from "@/lib/iligan-landmarks";
import type { PlaceResult } from "@/lib/geocoding";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const ILIGAN_CENTER: [number, number] = [124.2383, 8.2289];

const ROUTE_COLORS = [
  "#5000BD",
  "#E63946",
  "#2A9D8F",
  "#E76F51",
  "#264653",
  "#F4A261",
  "#1D3557",
  "#457B9D",
  "#6D6875",
  "#B5838D",
];

function createPlaceMarker(place: PlaceResult): {
  element: HTMLElement;
  marker: maplibregl.Marker;
} {
  const el = document.createElement("div");
  el.style.cssText =
    "width:24px;height:24px;border-radius:50%;background:#E63946;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;";
  el.title = place.displayName;

  const label = document.createElement("div");
  label.style.cssText =
    "position:absolute;top:-32px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:white;padding:3px 10px;border-radius:8px;font-size:11px;font-weight:600;white-space:nowrap;pointer-events:none;";
  label.textContent = place.displayName.split(",")[0];
  el.appendChild(label);

  const marker = new maplibregl.Marker({ element: el, anchor: "center" });
  return { element: el, marker };
}

function createUserMarker(): {
  element: HTMLElement;
  marker: maplibregl.Marker;
} {
  const el = document.createElement("div");
  el.style.cssText =
    "width:20px;height:20px;border-radius:50%;background:var(--color-primary);border:3px solid white;box-shadow:0 0 0 4px color-mix(in srgb, var(--color-primary) 30%, transparent);";
  const pulse = document.createElement("div");
  pulse.style.cssText =
    "width:60px;height:60px;border-radius:50%;background:color-mix(in srgb, var(--color-primary) 10%, transparent);position:absolute;top:-20px;left:-20px;animation:pulse 2s infinite;";
  el.appendChild(pulse);
  const marker = new maplibregl.Marker({ element: el });
  return { element: el, marker };
}

export default function UserDashboard() {
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const placeMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "granted" | "denied" | "error"
  >("idle");
  const [position, setPosition] = useState<{ lng: number; lat: number } | null>(
    null,
  );
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [nearbyRoutes, setNearbyRoutes] = useState<NearbyRoute[]>([]);
  const [multiHopRoutes, setMultiHopRoutes] = useState<MultiHopJourney[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, -1 | 0 | 1>>({});
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [focusedRouteId, setFocusedRouteId] = useState<string | null>(null);

  const searchOrigin: { lat: number; lng: number } | null = useMemo(
    () =>
      position
        ? { lat: position.lat, lng: position.lng }
        : { lat: ILIGAN_CENTER[1], lng: ILIGAN_CENTER[0] },
    [position],
  );

  useEffect(() => {
    if (nearbyRoutes.length === 0) return;
    import("@/actions/vote.actions").then(({ getMyVotes }) => {
      getMyVotes(nearbyRoutes.map((r) => r.id)).then(setMyVotes).catch(() => {});
    }).catch(() => {});
  }, [nearbyRoutes]);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: ILIGAN_CENTER,
      zoom: 13,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.addSource("routes-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "routes-layer",
        type: "line",
        source: "routes-source",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["case", ["boolean", ["get", "focused"], false], 5, 3],
          "line-opacity": [
            "case",
            ["boolean", ["get", "focused"], false],
            0.9,
            0.5,
          ],
        },
      });

      map.addSource("focused-route-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "focused-route-layer",
        type: "line",
        source: "focused-route-source",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#5000BD",
          "line-width": 6,
          "line-opacity": 0.9,
        },
      });

      map.addSource("walking-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "walking-layer",
        type: "line",
        source: "walking-source",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#F97316",
          "line-width": 3,
          "line-opacity": 0.8,
          "line-dasharray": [4, 4],
        },
      });

      map.addSource("stops-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "boarding-stop-layer",
        type: "circle",
        source: "stops-source",
        filter: ["==", ["get", "type"], "boarding"],
        paint: {
          "circle-radius": 8,
          "circle-color": "#22C55E",
          "circle-stroke-width": 3,
          "circle-stroke-color": "#FFFFFF",
        },
      });

      map.addLayer({
        id: "alighting-stop-layer",
        type: "circle",
        source: "stops-source",
        filter: ["==", ["get", "type"], "alighting"],
        paint: {
          "circle-radius": 8,
          "circle-color": "#F97316",
          "circle-stroke-width": 3,
          "circle-stroke-color": "#FFFFFF",
        },
      });

      // Landmark pins
      map.addSource("landmarks-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: ILIGAN_LANDMARKS.map((lm) => ({
            type: "Feature",
            properties: { name: lm.name, category: lm.category },
            geometry: { type: "Point", coordinates: [lm.lng, lm.lat] },
          })),
        },
      });

      map.addLayer({
        id: "landmarks-layer",
        type: "circle",
        source: "landmarks-source",
        paint: {
          "circle-radius": 5,
          "circle-color": "#6B7280",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#FFFFFF",
          "circle-opacity": 0.7,
        },
      });

      map.addLayer({
        id: "landmarks-label",
        type: "symbol",
        source: "landmarks-source",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, -1.5],
          "text-anchor": "bottom",
          "text-optional": true,
        },
        paint: {
          "text-color": "#4B5563",
          "text-halo-color": "#FFFFFF",
          "text-halo-width": 1,
        },
      });
    });

    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  const flyTo = useCallback((lng: number, lat: number, zoom = 15) => {
    mapInstance.current?.flyTo({ center: [lng, lat], zoom, duration: 1500 });
  }, []);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("error");
      return;
    }

    setLocationStatus("loading");

    function onPosition(pos: GeolocationPosition) {
      const { longitude, latitude } = pos.coords;
      setLocationStatus("granted");
      setPosition({ lng: longitude, lat: latitude });
      flyTo(longitude, latitude);

      if (userMarkerRef.current) userMarkerRef.current.remove();
      const { marker } = createUserMarker();
      marker.setLngLat([longitude, latitude]).addTo(mapInstance.current!);
      userMarkerRef.current = marker;
    }

    function onError(err: GeolocationPositionError) {
      setLocationStatus(
        err.code === err.PERMISSION_DENIED ? "denied" : "error",
      );
    }

    navigator.geolocation.getCurrentPosition(onPosition, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  }, [flyTo]);

  const updateRoutesOnMap = useCallback(
    (routes: NearbyRoute[], focusedId: string | null) => {
      const map = mapInstance.current;
      if (!map) return;

      const source = map.getSource("routes-source") as maplibregl.GeoJSONSource;
      if (!source) return;

      source.setData({
        type: "FeatureCollection",
        features: routes.map((r, i) => ({
          type: "Feature" as const,
          properties: {
            id: r.id,
            color: ROUTE_COLORS[i % ROUTE_COLORS.length],
            focused: r.id === focusedId,
          },
          geometry: { type: "LineString" as const, coordinates: r.waypoints },
        })),
      });
    },
    [],
  );

  const focusRouteOnMap = useCallback(
    (route: NearbyRoute) => {
      const map = mapInstance.current;
      if (!map) return;

      setFocusedRouteId(route.id);
      updateRoutesOnMap(nearbyRoutes, route.id);

      const focusedSource = map.getSource(
        "focused-route-source",
      ) as maplibregl.GeoJSONSource;
      if (focusedSource) {
        focusedSource.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: route.waypoints },
            },
          ],
        });
      }

      const boardingCoord = route.waypoints[route.boardingIndex];
      const alightingCoord = route.waypoints[route.alightingIndex];

      const walkingLines: [number, number][] = [];
      const stopFeatures: Array<{
        type: "Feature";
        properties: { type: string };
        geometry: { type: "Point"; coordinates: [number, number] };
      }> = [];

      if (selectedPlace) {
        walkingLines.push(alightingCoord, [
          selectedPlace.lng,
          selectedPlace.lat,
        ]);
        stopFeatures.push({
          type: "Feature",
          properties: { type: "alighting" },
          geometry: { type: "Point", coordinates: alightingCoord },
        });
      }

      if (position) {
        walkingLines.unshift([position.lng, position.lat], boardingCoord);
        stopFeatures.unshift({
          type: "Feature",
          properties: { type: "boarding" },
          geometry: { type: "Point", coordinates: boardingCoord },
        });
      }

      const walkingSource = map.getSource(
        "walking-source",
      ) as maplibregl.GeoJSONSource;
      if (walkingSource && walkingLines.length >= 2) {
        const segmentCount = walkingLines.length - 1;
        walkingSource.setData({
          type: "FeatureCollection",
          features: Array.from({ length: segmentCount }, (_, i) => ({
            type: "Feature" as const,
            properties: {},
            geometry: {
              type: "LineString" as const,
              coordinates: [walkingLines[i], walkingLines[i + 1]],
            },
          })),
        });
      }

      const stopsSource = map.getSource(
        "stops-source",
      ) as maplibregl.GeoJSONSource;
      if (stopsSource && stopFeatures.length > 0) {
        stopsSource.setData({
          type: "FeatureCollection",
          features: stopFeatures,
        });
      }

      const bounds = route.waypoints.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(route.waypoints[0], route.waypoints[0]),
      );

      if (selectedPlace) {
        bounds.extend([selectedPlace.lng, selectedPlace.lat]);
      }
      if (position) {
        bounds.extend([position.lng, position.lat]);
      }

      map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1500 });
    },
    [nearbyRoutes, selectedPlace, updateRoutesOnMap, position],
  );

  const handleSelectPlace = useCallback(
    async (place: PlaceResult) => {
      setSelectedPlace(place);
      setFocusedRouteId(null);

      const map = mapInstance.current;
      if (!map) return;

      flyTo(place.lng, place.lat, 15);

      if (placeMarkerRef.current) placeMarkerRef.current.remove();
      const { marker } = createPlaceMarker(place);
      marker.setLngLat([place.lng, place.lat]).addTo(map);
      placeMarkerRef.current = marker;

      setIsLoadingRoutes(true);
      try {
        const result = await getActiveRoutes();
        if (result.error || !result.routes) return;

        const typedRoutes: RouteRow[] = result.routes;
        const userOrigin: [number, number] | undefined = position
          ? [position.lng, position.lat]
          : undefined;

        const near = findNearbyRoutes(
          [place.lng, place.lat],
          typedRoutes,
          1,
          userOrigin,
        );
        setNearbyRoutes(near);

        const origin: [number, number] = userOrigin ?? [place.lng, place.lat];
        const transfers = findRouteTransfers(typedRoutes);
        const multi = findMultiHopRoutes(
          origin,
          [place.lng, place.lat],
          typedRoutes,
          transfers,
        );
        setMultiHopRoutes(multi);

        updateRoutesOnMap(near, null);
      } finally {
        setIsLoadingRoutes(false);
      }
    },
    [flyTo, updateRoutesOnMap, position],
  );

  const handleClearPlace = useCallback(() => {
    setSelectedPlace(null);
    setNearbyRoutes([]);
    setMultiHopRoutes([]);
    setFocusedRouteId(null);

    if (placeMarkerRef.current) {
      placeMarkerRef.current.remove();
      placeMarkerRef.current = null;
    }

    const map = mapInstance.current;
    if (!map) return;

    const source = map.getSource("routes-source") as maplibregl.GeoJSONSource;
    if (source) source.setData({ type: "FeatureCollection", features: [] });

    const focusedSource = map.getSource(
      "focused-route-source",
    ) as maplibregl.GeoJSONSource;
    if (focusedSource)
      focusedSource.setData({ type: "FeatureCollection", features: [] });

    const walkingSource = map.getSource(
      "walking-source",
    ) as maplibregl.GeoJSONSource;
    if (walkingSource)
      walkingSource.setData({ type: "FeatureCollection", features: [] });

    const stopsSource = map.getSource(
      "stops-source",
    ) as maplibregl.GeoJSONSource;
    if (stopsSource)
      stopsSource.setData({ type: "FeatureCollection", features: [] });
  }, []);

  const handleStartTrip = useCallback(
    (route: NearbyRoute) => {
      if (!selectedPlace) return;

      localStorage.setItem(
        "active_trip",
        JSON.stringify({
          destinationName: selectedPlace.displayName.split(",")[0],
          destinationLng: selectedPlace.lng,
          destinationLat: selectedPlace.lat,
          boardingIndex: route.boardingIndex,
          alightingIndex: route.alightingIndex,
          boardingDistanceKm: route.boardingDistanceKm,
          alightingDistanceKm: route.alightingDistanceKm,
          originLng: position?.lng ?? null,
          originLat: position?.lat ?? null,
        }),
      );

      router.push(`/protected/trip/${route.id}`);
    },
    [selectedPlace, router],
  );

  const hasPosition = locationStatus === "granted" && position;

  return (
    <div className="w-full h-full min-h-[calc(100vh-8rem)] overflow-y-auto">
      {/* Search bar — outside the map, compact */}
      <div className="w-full  mx-auto px-4 pb-3">
        <PlaceSearch onSelectPlace={handleSelectPlace} origin={searchOrigin} />
      </div>

      {/* Map section — ~58% of viewport */}
      <div className="relative w-full h-[58vh] rounded-xl overflow-hidden border border-border bg-muted">
        <div ref={mapContainer} className="w-full h-full" />

        {locationStatus === "denied" && (
          <LocationDeniedOverlay onRequestLocation={requestLocation} />
        )}

        {locationStatus === "loading" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-card px-5 py-3 rounded-full shadow-xl text-sm flex items-center gap-3 border border-border">
            <span className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-foreground font-medium">
              Finding your location...
            </span>
          </div>
        )}

        {isLoadingRoutes && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-card px-5 py-3 rounded-full shadow-xl text-sm flex items-center gap-3 border border-border">
            <span className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-foreground font-medium">
              Finding nearby routes...
            </span>
          </div>
        )}

        {locationStatus === "error" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-destructive text-destructive-foreground px-5 py-3 rounded-xl shadow-xl text-sm">
            Could not determine your location. Try again.
          </div>
        )}

        {selectedPlace && (
          <div className="absolute top-3 left-3 right-3 z-20 max-w-lg">
            <BottomInfoBar
              mode="place-selected"
              place={selectedPlace}
              onClear={handleClearPlace}
            />
          </div>
        )}
      </div>

      {/* Content section — scrollable below the map */}
      <div className="w-full max-w-2xl mx-auto px-4 py-5 space-y-4">
        {!hasPosition && !selectedPlace && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Search for a place to find nearby jeepney routes
            </p>
            <button
              type="button"
              onClick={requestLocation}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Crosshair size={16} />
              Find my location
            </button>
          </div>
        )}

        {hasPosition && !selectedPlace && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Your location</p>
              <p className="text-sm font-medium text-foreground">
                {position!.lat.toFixed(4)}, {position!.lng.toFixed(4)}
              </p>
            </div>
            <button
              type="button"
              onClick={requestLocation}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Crosshair size={16} />
              Refresh
            </button>
          </div>
        )}

        {selectedPlace && (
            <RouteSuggestions
              routes={nearbyRoutes}
              multiHopRoutes={multiHopRoutes}
              placeName={selectedPlace.displayName.split(",")[0]}
              onFocusRoute={focusRouteOnMap}
              onStartTrip={handleStartTrip}
              myVotes={myVotes}
            />
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}
