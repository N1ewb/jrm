"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import maplibregl from "maplibre-gl";
import {
  MapPin, Loader2, CheckCircle2, Info, ArrowLeft,
} from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/image-upload";
import { LANDMARK_CATEGORIES } from "@/lib/constants";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/constants";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export default function AddLandmarkPage() {
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("landmark");
  const [address, setAddress] = useState("");
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      setMapReady(true);
    });

    map.on("click", (e: maplibregl.MapMouseEvent) => {
      const coord: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      setPosition(coord);

      if (markerRef.current) markerRef.current.remove();

      const el = document.createElement("div");
      el.className = "w-8 h-8 rounded-full bg-primary border-3 border-white shadow-lg flex items-center justify-center";
      el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(coord)
        .addTo(map);
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position) {
      setError("Please click on the map to set the landmark location");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { addLandmark } = await import("@/actions/landmark.actions");
      const result = await addLandmark({
        name,
        description: description || undefined,
        category,
        lat: position[1],
        lng: position[0],
        address: address || undefined,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      });

      if ("error" in result) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setTimeout(() => {
        router.push(`/protected/landmarks/detail?id=${result.id}`);
      }, 1500);
    } catch {
      setError("Failed to submit landmark");
      setSubmitting(false);
    }
  }, [position, name, description, category, address, imageUrls, router]);

  if (submitted) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Landmark Submitted!</h2>
          <p className="text-sm text-muted-foreground">
            Your landmark is pending admin review. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-20 lg:pb-6">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="text-2xl font-bold text-foreground">Add Landmark</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pin a location on the map and provide details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div
            ref={mapContainer}
            className="w-full h-[50vh] lg:h-[calc(100vh-16rem)] rounded-xl overflow-hidden border border-border"
          />
          {!mapReady && (
            <div className="flex items-center justify-center h-[50vh] lg:h-[calc(100vh-16rem)] rounded-xl bg-muted animate-pulse">
              <span className="text-sm text-muted-foreground">Loading map...</span>
            </div>
          )}
          {position ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin size={12} className="text-primary" />
              Coordinates: {position[1].toFixed(5)}, {position[0].toFixed(5)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Click on the map to place the landmark pin
            </p>
          )}
        </div>

        <div className="w-full lg:w-96 shrink-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Landmark Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., St. Michael's Cathedral"
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  {LANDMARK_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us about this landmark..."
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., Quezon Avenue, Iligan City"
                  maxLength={200}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Photos (optional)</Label>
                <ImageUpload
                  onImagesChange={setImageUrls}
                  maxImages={5}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting || !name.trim() || !position}
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <MapPin size={15} />
                )}
                {submitting ? "Submitting..." : "Submit Landmark"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
