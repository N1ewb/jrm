"use client";

import { useLocalStorage } from "./use-local-storage";

export interface RecentSearch {
  query: string;
  displayName: string;
  lat: number | null;
  lng: number | null;
  searchedAt: number;
}

const RECENT_SEARCHES_KEY = "jrm_recent_searches";
const MAX_SEARCHES = 10;

export function useRecentSearches() {
  const [searches, setSearches, clearSearches] = useLocalStorage<RecentSearch[]>(
    RECENT_SEARCHES_KEY,
    [],
  );

  function addSearch(search: Omit<RecentSearch, "searchedAt">) {
    setSearches((prev) => {
      const filtered = prev.filter(
        (s) => s.query.toLowerCase() !== search.query.toLowerCase(),
      );
      const updated: RecentSearch = { ...search, searchedAt: Date.now() };
      return [updated, ...filtered].slice(0, MAX_SEARCHES);
    });
  }

  function removeSearch(query: string) {
    setSearches((prev) =>
      prev.filter((s) => s.query.toLowerCase() !== query.toLowerCase()),
    );
  }

  return {
    searches,
    addSearch,
    removeSearch,
    clearSearches,
  };
}
