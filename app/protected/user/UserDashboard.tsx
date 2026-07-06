"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Crosshair, Navigation, MapPin, LocateFixed, Locate } from "lucide-react";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const ILIGAN_CENTER: [number, number] = [124.2383, 8.2289];

export default function UserDashboard() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "granted" | "denied" | "error"
  >("idle");
  const [isLocating, setIsLocating] = useState(false);
  const [position, setPosition] = useState<{ lng: number; lat: number } | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: ILIGAN_CENTER,
      zoom: 13,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  const flyTo = useCallback((lng: number, lat: number, zoom = 15) => {
    if (!mapInstance.current) return;
    mapInstance.current.flyTo({ center: [lng, lat], zoom, duration: 1500 });
  }, []);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("error");
      return;
    }

    setLocationStatus("loading");
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;
        setLocationStatus("granted");
        setIsLocating(false);
        setPosition({ lng: longitude, lat: latitude });

        if (!mapInstance.current) return;

        flyTo(longitude, latitude);

        if (markerRef.current) markerRef.current.remove();

        const el = document.createElement("div");
        el.className = "user-location-pulse";
        el.style.cssText =
          "width:20px;height:20px;border-radius:50%;background:#250057;border:3px solid white;box-shadow:0 0 0 4px rgba(37,0,87,0.3);";

        markerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(mapInstance.current);

        // Add pulsing circle
        const pulseEl = document.createElement("div");
        pulseEl.style.cssText =
          "width:60px;height:60px;border-radius:50%;background:rgba(37,0,87,0.1);position:absolute;top:-20px;left:-20px;animation:pulse 2s infinite;";
        el.appendChild(pulseEl);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus("denied");
        } else {
          setLocationStatus("error");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [flyTo]);

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-border">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Permission denied overlay */}
      {locationStatus === "denied" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center border border-border">
            <Locate size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Location Access Denied
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Enable location access to see your position on the map and find nearby jeepney routes.
            </p>
            <button
              type="button"
              onClick={requestLocation}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg"
            >
              <LocateFixed size={18} />
              Allow Location Access
            </button>
          </div>
        </div>
      )}

      {/* Locating toast */}
      {locationStatus === "loading" && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 bg-card px-5 py-3 rounded-full shadow-xl text-sm flex items-center gap-3 border border-border">
          <span className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
          <span className="text-foreground font-medium">Finding your location...</span>
        </div>
      )}

      {/* Location error toast */}
      {locationStatus === "error" && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 bg-destructive text-destructive-foreground px-5 py-3 rounded-xl shadow-xl text-sm">
          Could not determine your location. Try again.
        </div>
      )}

      {/* Locate button */}
      <div className="absolute bottom-6 right-6 z-10">
        <button
          type="button"
          onClick={requestLocation}
          disabled={isLocating}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-card shadow-lg border border-border hover:bg-muted transition-all disabled:opacity-50"
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

      {/* Bottom info bar */}
      <div className="absolute bottom-6 left-6 right-20 z-10 max-w-md">
        <div className="bg-card rounded-xl shadow-lg px-4 py-3 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Iligan City</p>
            <p className="text-sm font-medium text-foreground truncate">
              {locationStatus === "granted" && position
                ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
                : "Tap the crosshair to find your location"}
            </p>
          </div>
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0"
            aria-label="Navigate"
          >
            <Navigation size={16} />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
