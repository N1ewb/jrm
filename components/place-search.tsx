"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Loader2, Building, TreePine, Church, Store, Landmark } from "lucide-react";
import { searchPlaces, type PlaceResult } from "@/lib/geocoding";

interface PlaceSearchProps {
  onSelectPlace: (place: PlaceResult) => void;
  origin?: { lat: number; lng: number } | null;
  className?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  church: Church,
  school: Building,
  mall: Store,
  park: TreePine,
  landmark: Landmark,
  government: Building,
};

function getIcon(type: string, category: string): React.ElementType {
  if (typeIcons[type]) return typeIcons[type];
  if (typeIcons[category]) return typeIcons[category];
  return MapPin;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <strong key={i} className="text-primary font-semibold">{part}</strong>
    ) : (
      part
    ),
  );
}

function shortenDisplayName(displayName: string): string {
  const parts = displayName.split(", ");
  if (parts.length <= 3) return displayName;
  return parts.slice(0, 3).join(", ");
}

export default function PlaceSearch({ onSelectPlace, origin, className }: PlaceSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const places = await searchPlaces(query, origin ?? undefined);
        setResults(places);
        setIsOpen(places.length > 0);
        setSelectedIndex(-1);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, origin]);

  const handleSelect = (place: PlaceResult) => {
    setQuery(shortenDisplayName(place.displayName));
    setIsOpen(false);
    setResults([]);
    onSelectPlace(place);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className ?? ""}`}>
      <div className="flex items-center gap-2 bg-white dark:bg-card rounded-xl shadow-lg px-4 py-3 border border-border/50">
        <Search size={18} className="text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Where to? (e.g., St. Michael's Cathedral, Robinsons Place...)"
          className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
        />
        {isSearching && (
          <Loader2 size={16} className="animate-spin text-muted-foreground shrink-0" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-card rounded-xl shadow-xl border border-border/50 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          <ul className="py-2">
            {results.map((place, idx) => {
              const Icon = getIcon(place.type, place.category);
              return (
                <li
                  key={`${place.osmType}-${place.osmId}`}
                  onMouseDown={() => handleSelect(place)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors ${
                    idx === selectedIndex
                      ? "bg-primary/10"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {highlightMatch(shortenDisplayName(place.displayName), query)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      {place.type.replace(/_/g, " ")}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
