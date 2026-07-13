"use client";

import { useMemo } from "react";
import { TrendingUp, Star } from "lucide-react";
import { useTrendingDestinations } from "@/hooks/use-trending-destinations";
import { getPlaceInitialsBg, generatePlaceImageFallback } from "@/lib/discovery";

interface TrendingDestinationsProps {
  onSelect: (name: string, lat: number, lng: number) => void;
}

function TrendingCard({
  name,
  count,
  lat,
  lng,
  onSelect,
}: {
  name: string;
  count: number;
  lat: number;
  lng: number;
  onSelect: (name: string, lat: number, lng: number) => void;
}) {
  const initials = generatePlaceImageFallback(name);
  const bgColor = getPlaceInitialsBg(name);

  return (
    <button
      type="button"
      onClick={() => onSelect(name, lat, lng)}
      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors border border-border/50 min-w-[100px] snap-start"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
        style={{ backgroundColor: bgColor }}
      >
        {initials}
      </div>
      <div className="text-center min-w-0 w-full">
        <p className="text-xs font-medium text-foreground truncate">
          {name}
        </p>
        <div className="flex items-center justify-center gap-0.5 mt-0.5">
          <Star size={10} className="text-amber-500 fill-amber-500" />
          <span className="text-[10px] text-muted-foreground">{count}</span>
        </div>
      </div>
    </button>
  );
}

export default function TrendingDestinations({
  onSelect,
}: TrendingDestinationsProps) {
  const { trending } = useTrendingDestinations();

  const sliced = useMemo(() => trending.slice(0, 10), [trending]);

  if (sliced.length === 0) return null;

  return (
    <div className="bg-card rounded-xl shadow-lg border border-border/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <TrendingUp size={16} className="text-primary" />
        <p className="text-sm font-semibold text-foreground">
          Trending Destinations
        </p>
        <span className="text-xs text-muted-foreground ml-auto">
          Most searched
        </span>
      </div>

      <div className="px-4 py-3 overflow-x-auto scrollbar-thin">
        <div className="flex gap-3 snap-x snap-mandatory">
          {sliced.map((entry) => (
            <TrendingCard
              key={entry.name}
              name={entry.name}
              count={entry.count}
              lat={entry.lat}
              lng={entry.lng}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
