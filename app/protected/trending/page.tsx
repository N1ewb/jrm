"use client";

import { TrendingUp, Star, MapPin, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTrendingDestinations } from "@/hooks/use-trending-destinations";
import { getPlaceInitialsBg, generatePlaceImageFallback } from "@/lib/discovery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrendingPage() {
  const router = useRouter();
  const { trending } = useTrendingDestinations();

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp size={22} className="text-primary" />
          Trending Destinations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Most searched places by the community
        </p>
      </div>

      {trending.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp size={40} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-foreground">No trending data yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Search for places to start building trending destinations.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {trending.map((entry, i) => {
          const initials = generatePlaceImageFallback(entry.name);
          const bgColor = getPlaceInitialsBg(entry.name);
          return (
            <button
              key={entry.name}
              type="button"
              onClick={() => router.push(`/protected/user?place=${encodeURIComponent(entry.name)}&lat=${entry.lat}&lng=${entry.lng}`)}
              className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{ backgroundColor: bgColor }}
                  >
                    {initials}
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow">
                    {i + 1}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {entry.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star size={11} className="text-amber-500 fill-amber-500" />
                      {entry.count} search{entry.count === 1 ? "" : "es"}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {entry.lat.toFixed(4)}, {entry.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
              <Navigation size={16} className="text-muted-foreground shrink-0 mt-2" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
