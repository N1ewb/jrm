"use client";

import { useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface VoteButtonsProps {
  routeId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  initialMyVote: -1 | 0 | 1;
  onVote?: (upvotes: number, downvotes: number) => void;
  voteAction?: (id: string, vote: -1 | 0 | 1) => Promise<
    { upvotes: number; downvotes: number } | { error: string }
  >;
  size?: "sm" | "md";
}

export default function VoteButtons({
  routeId,
  initialUpvotes,
  initialDownvotes,
  initialMyVote,
  onVote,
  voteAction,
  size = "sm",
}: VoteButtonsProps) {
  const [myVote, setMyVote] = useState<-1 | 0 | 1>(initialMyVote);
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [loading, setLoading] = useState(false);

  const handleVote = useCallback(
    async (vote: -1 | 1) => {
      if (loading) return;

      const newVote = myVote === vote ? 0 : vote;
      const prevMyVote = myVote;
      const prevUpvotes = upvotes;
      const prevDownvotes = downvotes;

      // Optimistic update — user can only have one active vote at a time
      setMyVote(newVote);
      if (newVote === 0) {
        if (prevMyVote === 1) setUpvotes((u) => Math.max(0, u - 1));
        if (prevMyVote === -1) setDownvotes((d) => Math.max(0, d - 1));
      } else if (newVote === 1) {
        setUpvotes((u) => u + 1);
        if (prevMyVote === -1) setDownvotes((d) => Math.max(0, d - 1));
      } else {
        setDownvotes((d) => d + 1);
        if (prevMyVote === 1) setUpvotes((u) => Math.max(0, u - 1));
      }

      setLoading(true);

      try {
        const action =
          voteAction ??
          (await import("@/actions/vote.actions")).voteRoute;
        const result = await action(routeId, newVote);

        if ("error" in result) {
          setMyVote(prevMyVote);
          setUpvotes(prevUpvotes);
          setDownvotes(prevDownvotes);
          return;
        }

        setUpvotes(result.upvotes);
        setDownvotes(result.downvotes);
        onVote?.(result.upvotes, result.downvotes);
      } catch {
        setMyVote(prevMyVote);
        setUpvotes(prevUpvotes);
        setDownvotes(prevDownvotes);
      } finally {
        setLoading(false);
      }
    },
    [routeId, myVote, upvotes, downvotes, loading, onVote, voteAction],
  );

  const compact = size === "sm";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-md transition-colors disabled:opacity-50 ${
          compact
            ? "px-2 py-1 text-xs"
            : "px-3 py-2 text-sm min-h-[44px]"
        } ${
          myVote === 1
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:text-primary hover:bg-primary/5"
        }`}
        aria-label={myVote === 1 ? "Remove upvote" : "Upvote"}
      >
        <ThumbsUp
          size={compact ? 14 : 18}
          className={myVote === 1 ? "fill-primary" : ""}
        />
        <span className="tabular-nums font-medium">{upvotes}</span>
      </button>

      <button
        type="button"
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-md transition-colors disabled:opacity-50 ${
          compact
            ? "px-2 py-1 text-xs"
            : "px-3 py-2 text-sm min-h-[44px]"
        } ${
          myVote === -1
            ? "text-destructive bg-destructive/10"
            : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"
        }`}
        aria-label={myVote === -1 ? "Remove downvote" : "Downvote"}
      >
        <ThumbsDown
          size={compact ? 14 : 18}
          className={myVote === -1 ? "fill-destructive" : ""}
        />
        <span className="tabular-nums font-medium">{downvotes}</span>
      </button>
    </div>
  );
}
