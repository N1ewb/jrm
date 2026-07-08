"use client";

import { useState, useCallback } from "react";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import type { CommentRow } from "@/actions/discussion.actions";
import CommentForm from "@/components/comment-form";
import VoteButtons from "@/components/vote-buttons";

interface CommentThreadProps {
  routeId: string;
  comments: CommentRow[];
  myVotes: Record<string, -1 | 0 | 1>;
  onRefresh: () => void;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CommentItem({
  comment,
  myVote,
  routeId,
  depth,
  onRefresh,
}: {
  comment: CommentRow;
  myVote: -1 | 0 | 1;
  routeId: string;
  depth: number;
  onRefresh: () => void;
}) {
  const [showReply, setShowReply] = useState(false);

  return (
    <div className={`${depth > 0 ? "ml-6 pl-3 border-l-2 border-border/50" : ""}`}>
      <div className="py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground truncate max-w-[120px]">
            {comment.author_email}
          </span>
          <span>{formatTimeAgo(comment.created_at)}</span>
        </div>

        <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">
          {comment.body}
        </p>

        <div className="flex items-center gap-3 mt-1.5">
          <VoteButtons
            routeId={comment.id}
            initialUpvotes={comment.upvotes}
            initialDownvotes={comment.downvotes}
            initialMyVote={myVote}
            size="sm"
          />

          {depth === 0 && (
            <button
              type="button"
              onClick={() => setShowReply(!showReply)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Reply
            </button>
          )}
        </div>

        {showReply && (
          <div className="mt-2">
            <CommentForm
              routeId={routeId}
              parentId={comment.id}
              placeholder="Write a reply..."
              onCommentPosted={() => {
                setShowReply(false);
                onRefresh();
              }}
              onCancel={() => setShowReply(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentThread({
  routeId,
  comments,
  myVotes,
  onRefresh,
}: CommentThreadProps) {
  const [sortBy, setSortBy] = useState<"recent" | "best">("recent");

  const topLevel = comments.filter((c) => !c.parent_id);
  const replies = comments.filter((c) => c.parent_id);

  const sorted = [...topLevel].sort((a, b) =>
    sortBy === "recent"
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : b.upvotes - a.upvotes,
  );

  const getReplies = useCallback(
    (parentId: string) =>
      replies
        .filter((r) => r.parent_id === parentId)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
    [replies],
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">
            Comments ({comments.length})
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSortBy("recent")}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              sortBy === "recent"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Recent
          </button>
          <button
            type="button"
            onClick={() => setSortBy("best")}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              sortBy === "best"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Best
          </button>
        </div>
      </div>

      {/* Comment form (top-level) */}
      <CommentForm
        routeId={routeId}
        onCommentPosted={onRefresh}
        placeholder="Add a comment..."
      />

      {/* Comment list */}
      {sorted.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No comments yet. Be the first to share your thoughts.
        </p>
      )}

      <div className="divide-y divide-border/50">
        {sorted.map((comment) => (
          <div key={comment.id}>
            <CommentItem
              comment={comment}
              myVote={myVotes[comment.id] ?? 0}
              routeId={routeId}
              depth={0}
              onRefresh={onRefresh}
            />

            {getReplies(comment.id).map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                myVote={myVotes[reply.id] ?? 0}
                routeId={routeId}
                depth={1}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
