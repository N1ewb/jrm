"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { Navigation, Search, Crosshair, MapPin } from "lucide-react";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const ILIGAN_CENTER: [number, number] = [124.2383, 8.2289];

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "granted" | "denied" | "error"
  >("idle");
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: ILIGAN_CENTER,
      zoom: 13,
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  const flyToLocation = useCallback(
    (lng: number, lat: number, zoom = 15) => {
      if (!mapInstance.current) return;
      mapInstance.current.flyTo({ center: [lng, lat], zoom, duration: 1500 });
    },
    []
  );

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("error");
      return;
    }

    setLocationStatus("loading");
    setIsLocating(true);

    function placeMarker(lng: number, lat: number) {
      if (!mapInstance.current) return;
      flyToLocation(lng, lat);
      if (markerRef.current) markerRef.current.remove();
      const el = document.createElement("div");
      el.className = "user-location-pulse";
      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current);
    }

    function onPosition(pos: GeolocationPosition) {
      const { longitude, latitude, accuracy } = pos.coords;
      setLocationStatus("granted");
      setIsLocating(false);
      placeMarker(longitude, latitude);
    }

    function onError(err: GeolocationPositionError) {
      setIsLocating(false);
      if (err.code === err.PERMISSION_DENIED) {
        setLocationStatus("denied");
      } else {
        setLocationStatus("error");
      }
    }

    navigator.geolocation.getCurrentPosition(onPosition, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  }, [flyToLocation]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Floating search bar - like Grab/Google Maps */}
      <div className="absolute top-4 left-4 right-4 z-10 max-w-md mx-auto">
        <div className="flex items-center gap-2 bg-white dark:bg-card rounded-xl shadow-lg px-4 py-3 border border-border/50">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Where to?"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Location status toasts */}
      {locationStatus === "loading" && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-white dark:bg-card px-4 py-2.5 rounded-full shadow-lg text-sm flex items-center gap-2.5 border border-border/50">
          <span className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
          <span className="text-foreground font-medium">Finding you...</span>
        </div>
      )}

      {locationStatus === "denied" && (
        <div className="absolute top-20 left-4 right-4 z-10 bg-destructive text-destructive-foreground px-4 py-2.5 rounded-xl shadow-lg text-sm text-center">
          Location access denied. Enable it in your browser settings.
        </div>
      )}

      {/* Floating action buttons */}
      <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-3">
        <button
          type="button"
          onClick={requestLocation}
          disabled={isLocating}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-card shadow-lg border border-border/50 hover:bg-muted transition-colors disabled:opacity-50"
          aria-label="My location"
        >
          <Crosshair
            size={20}
            className={
              locationStatus === "granted"
                ? "text-primary"
                : "text-muted-foreground"
            }
          />
        </button>
      </div>

      {/* Bottom bar - quick info */}
      <div className="absolute bottom-6 left-4 right-20 z-10">
        <div className="bg-white dark:bg-card rounded-xl shadow-lg px-4 py-3 border border-border/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Iligan City</p>
            <p className="text-sm font-medium text-foreground truncate">
              {locationStatus === "granted"
                ? "You are here"
                : "Tap to find your location"}
            </p>
          </div>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-label="Navigate"
          >
            <Navigation size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
