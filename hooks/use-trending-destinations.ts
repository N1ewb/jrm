"use client";

import { useLocalStorage } from "./use-local-storage";

export interface TrendingEntry {
  name: string;
  lat: number;
  lng: number;
  count: number;
  lastSearchedAt: number;
}

const TRENDING_KEY = "jrm_trending";

export function useTrendingDestinations() {
  const [trending, setTrending] = useLocalStorage<TrendingEntry[]>(
    TRENDING_KEY,
    [],
  );

  function recordSearch(name: string, lat: number, lng: number) {
    setTrending((prev) => {
      const existing = prev.find(
        (e) => e.name.toLowerCase() === name.toLowerCase(),
      );
      if (existing) {
        return prev
          .map((e) =>
            e.name.toLowerCase() === name.toLowerCase()
              ? { ...e, count: e.count + 1, lastSearchedAt: Date.now(), lat, lng }
              : e,
          )
          .sort((a, b) => b.count - a.count || b.lastSearchedAt - a.lastSearchedAt);
      }
      const entry: TrendingEntry = {
        name,
        lat,
        lng,
        count: 1,
        lastSearchedAt: Date.now(),
      };
      return [entry, ...prev]
        .sort((a, b) => b.count - a.count || b.lastSearchedAt - a.lastSearchedAt)
        .slice(0, 20);
    });
  }

  const sorted = [...trending].sort(
    (a, b) => b.count - a.count || b.lastSearchedAt - a.lastSearchedAt,
  );

  return {
    trending: sorted,
    recordSearch,
  };
}
