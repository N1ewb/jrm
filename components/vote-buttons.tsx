"use client";

import { useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface VoteButtonsProps {
  routeId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  initialMyVote: -1 | 0 | 1;
  onVote?: (upvotes: number, downvotes: number) => void;
  /** Override the voting action (e.g., for comment voting) */
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

  const netScore = upvotes - downvotes;

  const handleVote = useCallback(
    async (vote: -1 | 1) => {
      if (loading) return;

      const newVote = myVote === vote ? 0 : vote;
      const prevMyVote = myVote;
      const prevUpvotes = upvotes;
      const prevDownvotes = downvotes;

      // Optimistic update
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

  const iconSize = size === "md" ? 18 : 14;

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`p-1 rounded transition-colors ${
          myVote === 1
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:text-primary hover:bg-primary/5"
        } disabled:opacity-50`}
        aria-label={myVote === 1 ? "Remove upvote" : "Upvote"}
      >
        <ThumbsUp
          size={iconSize}
          className={myVote === 1 ? "fill-primary" : ""}
        />
      </button>

      <span
        className={`text-xs font-semibold tabular-nums min-w-[1.5ch] text-center ${
          netScore > 0
            ? "text-primary"
            : netScore < 0
              ? "text-destructive"
              : "text-muted-foreground"
        }`}
      >
        {netScore}
      </span>

      <button
        type="button"
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`p-1 rounded transition-colors ${
          myVote === -1
            ? "text-destructive bg-destructive/10"
            : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"
        } disabled:opacity-50`}
        aria-label={myVote === -1 ? "Remove downvote" : "Downvote"}
      >
        <ThumbsDown
          size={iconSize}
          className={myVote === -1 ? "fill-destructive" : ""}
        />
      </button>
    </div>
  );
}
