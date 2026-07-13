"use client";

import { Clock, X, Trash2, Search } from "lucide-react";
import { useRecentSearches } from "@/hooks/use-recent-searches";

interface RecentSearchesProps {
  onSelect: (query: string, lat: number | null, lng: number | null) => void;
}

export default function RecentSearches({ onSelect }: RecentSearchesProps) {
  const { searches, removeSearch, clearSearches } = useRecentSearches();

  if (searches.length === 0) return null;

  return (
    <div className="bg-card rounded-xl shadow-lg border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Recent Searches</p>
        </div>
        <button
          type="button"
          onClick={clearSearches}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
        >
          <Trash2 size={12} />
          Clear all
        </button>
      </div>

      <ul className="divide-y divide-border/50">
        {searches.map((search) => (
          <li key={`${search.query}-${search.searchedAt}`}>
            <button
              type="button"
              onClick={() => onSelect(search.query, search.lat, search.lng)}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Search size={13} className="text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">
                  {search.displayName}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSearch(search.query);
                }}
                className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                aria-label="Remove search"
              >
                <X size={14} className="text-muted-foreground" />
              </button>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
