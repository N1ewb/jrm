"use client";

import { useLocalStorage } from "./use-local-storage";

export interface FavoritePlace {
  type: "place";
  id: string;
  name: string;
  lat: number;
  lng: number;
  savedAt: number;
}

export interface FavoriteRoute {
  type: "route";
  id: string;
  line: string;
  savedAt: number;
}

export type FavoriteItem = FavoritePlace | FavoriteRoute;

const FAVORITES_KEY = "jrm_favorites";

export function useFavorites() {
  const [favorites, setFavorites, clearFavorites] = useLocalStorage<FavoriteItem[]>(
    FAVORITES_KEY,
    [],
  );

  function addFavorite(item: FavoriteItem) {
    setFavorites((prev) => {
      const exists = prev.some(
        (f) => f.type === item.type && f.id === item.id,
      );
      if (exists) return prev;
      return [item, ...prev];
    });
  }

  function removeFavorite(type: "place" | "route", id: string) {
    setFavorites((prev) => prev.filter((f) => f.type !== type || f.id !== id));
  }

  function isFavorite(type: "place" | "route", id: string): boolean {
    return favorites.some((f) => f.type === type && f.id === id);
  }

  function toggleFavorite(item: FavoriteItem) {
    if (isFavorite(item.type, item.id)) {
      removeFavorite(item.type, item.id);
    } else {
      addFavorite(item);
    }
  }

  const favoritePlaces = favorites.filter(
    (f): f is FavoritePlace => f.type === "place",
  );
  const favoriteRoutes = favorites.filter(
    (f): f is FavoriteRoute => f.type === "route",
  );

  return {
    favorites,
    favoritePlaces,
    favoriteRoutes,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    clearFavorites,
  };
}
