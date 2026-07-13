"use client";

import { Heart } from "lucide-react";
import { useFavorites, type FavoriteItem } from "@/hooks/use-favorites";

interface FavoritesButtonProps {
  item: FavoriteItem;
  className?: string;
  size?: number;
}

export default function FavoritesButton({
  item,
  className = "",
  size = 18,
}: FavoritesButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(item.type, item.id);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(item);
      }}
      className={`inline-flex items-center justify-center rounded-full p-1.5 transition-colors ${
        fav
          ? "text-red-500 hover:text-red-600"
          : "text-muted-foreground hover:text-red-400"
      } ${className}`}
      aria-label={fav ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        size={size}
        className={fav ? "fill-red-500" : ""}
      />
    </button>
  );
}
