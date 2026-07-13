"use client";

import { Heart, MapPin, Route, Trash2, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFavorites } from "@/hooks/use-favorites";
import { getPlaceInitialsBg, generatePlaceImageFallback } from "@/lib/discovery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FavoritesPage() {
  const router = useRouter();
  const { favoritePlaces, favoriteRoutes, removeFavorite, clearFavorites } = useFavorites();

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Heart size={22} className="text-red-500" />
            Favorites
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {favoritePlaces.length + favoriteRoutes.length} saved items
          </p>
        </div>
        {(favoritePlaces.length > 0 || favoriteRoutes.length > 0) && (
          <button
            type="button"
            onClick={clearFavorites}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={13} />
            Clear all
          </button>
        )}
      </div>

      {favoritePlaces.length === 0 && favoriteRoutes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart size={40} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-foreground">No favorites yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tap the heart icon on places and routes to save them here.
            </p>
          </CardContent>
        </Card>
      )}

      {favoritePlaces.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin size={16} className="text-red-500" />
              Places
              <span className="text-xs text-muted-foreground font-normal ml-auto">
                {favoritePlaces.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {favoritePlaces.map((place) => {
              const initials = generatePlaceImageFallback(place.name);
              const bgColor = getPlaceInitialsBg(place.name);
              return (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => router.push(`/protected/user?place=${encodeURIComponent(place.name)}&lat=${place.lat}&lng=${place.lng}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors text-left border border-border/50"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: bgColor }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{place.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Saved {new Date(place.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFavorite("place", place.id); }}
                    className="shrink-0 p-2 rounded-full hover:bg-muted transition-colors"
                    aria-label="Remove favorite"
                  >
                    <Heart size={14} className="text-red-500 fill-red-500" />
                  </button>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {favoriteRoutes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Route size={16} className="text-red-500" />
              Routes
              <span className="text-xs text-muted-foreground font-normal ml-auto">
                {favoriteRoutes.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {favoriteRoutes.map((route) => (
              <div
                key={route.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Route size={16} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{route.line}</p>
                  <p className="text-xs text-muted-foreground">
                    Saved {new Date(route.savedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFavorite("route", route.id)}
                  className="shrink-0 p-2 rounded-full hover:bg-muted transition-colors"
                  aria-label="Remove favorite route"
                >
                  <Heart size={14} className="text-red-500 fill-red-500" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
