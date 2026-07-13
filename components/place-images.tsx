"use client";

import { useState, useEffect } from "react";
import { ImageIcon, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { searchPlaceImages, getPlaceInitialsBg, generatePlaceImageFallback } from "@/lib/discovery";

interface PlaceImagesProps {
  placeName: string;
  className?: string;
}

export default function PlaceImages({ placeName, className = "" }: PlaceImagesProps) {
  const [images, setImages] = useState<{ thumbnailUrl: string; fullUrl: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!placeName.trim()) return;

    let cancelled = false;
    setLoading(true);
    setError(false);
    setCurrentIndex(0);

    searchPlaceImages(placeName).then((results) => {
      if (cancelled) return;
      setImages(results);
      setLoading(false);
      if (results.length === 0) setError(true);
    }).catch(() => {
      if (cancelled) return;
      setLoading(false);
      setError(true);
    });

    return () => { cancelled = true; };
  }, [placeName]);

  const initials = generatePlaceImageFallback(placeName);
  const bgColor = getPlaceInitialsBg(placeName);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-40 bg-muted/30 rounded-xl border border-border/50 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Loading images...
        </div>
      </div>
    );
  }

  if (error || images.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-40 rounded-xl border border-border/50 ${className}`}
        style={{ backgroundColor: bgColor }}
      >
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
            <ImageIcon size={24} className="text-white/80" />
          </div>
          <span className="text-white/90 text-lg font-bold">{initials}</span>
        </div>
      </div>
    );
  }

  const current = images[currentIndex];

  return (
    <div className={`relative h-48 rounded-xl overflow-hidden border border-border/50 group ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.thumbnailUrl}
        alt={current.title}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            aria-label="Previous image"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            aria-label="Next image"
          >
            <ChevronRight size={16} />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentIndex ? "bg-white" : "bg-white/50"
                }`}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded">
        {currentIndex + 1}/{images.length}
      </div>
    </div>
  );
}
