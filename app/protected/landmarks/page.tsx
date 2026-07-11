"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  MapPin, Search, Filter, ThumbsUp, ThumbsDown, Plus, Loader2,
} from "lucide-react";
import {
  Card, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LANDMARK_CATEGORIES } from "@/lib/constants";
import type { LandmarkRow } from "@/actions/landmark.actions";

export default function LandmarksListPage() {
  const [landmarks, setLandmarks] = useState<LandmarkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [myVotes, setMyVotes] = useState<Record<string, -1 | 0 | 1>>({});

  const fetchLandmarks = useCallback(async () => {
    setLoading(true);
    try {
      const { getLandmarks, getMyLandmarkVotes } = await import("@/actions/landmark.actions");
      const result = await getLandmarks({ status: "active" });
      if ("landmarks" in result) {
        setLandmarks(result.landmarks);
        const ids = result.landmarks.map((l) => l.id);
        if (ids.length > 0) {
          const votes = await getMyLandmarkVotes(ids);
          setMyVotes(votes);
        }
      }
    } catch (err) {
      console.error("Failed to fetch landmarks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLandmarks();
  }, [fetchLandmarks]);

  const filtered = useMemo(() => {
    let result = landmarks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.address?.toLowerCase().includes(q),
      );
    }
    if (categoryFilter !== "all") {
      result = result.filter((l) => l.category === categoryFilter);
    }
    return result;
  }, [landmarks, searchQuery, categoryFilter]);

  return (
    <div className="w-full pb-20 lg:pb-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Landmarks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover community-added points of interest
          </p>
        </div>
        <Link href="/protected/add-landmark">
          <Button size="sm" className="gap-1.5">
            <Plus size={15} />
            Add Landmark
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search landmarks..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Filter size={14} />
            Category
          </button>
        </div>

        <div className={`${showFilters ? "flex" : "hidden"} sm:flex flex-wrap items-center gap-1 overflow-x-auto`}>
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              categoryFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            All
          </button>
          {LANDMARK_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MapPin size={40} className="text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">No landmarks found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {searchQuery || categoryFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Be the first to add a landmark!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((landmark) => {
            const myVote = myVotes[landmark.id] ?? 0;
            const categoryLabel = landmark.category.charAt(0).toUpperCase() + landmark.category.slice(1);

            return (
              <Link key={landmark.id} href={`/protected/landmarks/detail?id=${landmark.id}`}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground truncate text-sm">
                        {landmark.name}
                      </h3>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {categoryLabel}
                      </Badge>
                    </div>

                    {landmark.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {landmark.description}
                      </p>
                    )}

                    {landmark.image_urls.length > 0 && !landmark.images_hidden && (
                      <div className="aspect-video rounded-lg overflow-hidden border border-border mb-2">
                        <img
                          src={landmark.image_urls[0]}
                          alt={landmark.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={12} className="text-primary" />
                          {landmark.upvotes}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsDown size={12} className="text-destructive" />
                          {landmark.downvotes}
                        </span>
                      </span>
                      <span>{new Date(landmark.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
