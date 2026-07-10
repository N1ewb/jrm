"use client";

import { useState, useMemo } from "react";
import { MessageSquare } from "lucide-react";
import type { CommentRow } from "@/actions/discussion.actions";
import CommentForm from "@/components/comment-form";
import VoteButtons from "@/components/vote-buttons";

interface CommentThreadProps {
  routeId: string;
  comments: CommentRow[];
  myVotes: Record<string, -1 | 0 | 1>;
  onRefresh: () => void;
}

const MAX_VISUAL_DEPTH = 5;

function formatTimeAgo(dateStr: string): string {
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return "";
  const diff = Date.now() - time;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CommentNode({
  comment,
  myVote,
  routeId,
  depth,
  childrenMap,
  allVotes,
  onRefresh,
}: {
  comment: CommentRow;
  myVote: -1 | 0 | 1;
  routeId: string;
  depth: number;
  childrenMap: Map<string, CommentRow[]>;
  allVotes: Record<string, -1 | 0 | 1>;
  onRefresh: () => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const children = childrenMap.get(comment.id) ?? [];

  return (
    <div>
      <div className={`py-2 ${depth > 0 ? "ml-5 pl-3 border-l-2 border-border/40" : ""}`}>
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
            voteAction={async (id, v) => {
              const { voteComment } = await import("@/actions/discussion.actions");
              return voteComment(id, v);
            }}
          />

          <button
            type="button"
            onClick={() => setShowReply(!showReply)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showReply ? "Cancel" : "Reply"}
          </button>
        </div>

        {showReply && (
          <div className="mt-3 bg-muted/40 border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1.5 leading-relaxed">
              <span className="font-medium text-foreground">{comment.author_email}</span>
              {" — "}
              <span className="italic">
                {comment.body.length > 120
                  ? comment.body.slice(0, 120) + "…"
                  : comment.body}
              </span>
            </p>
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

      {children.length > 0 && (
        <div className={depth >= MAX_VISUAL_DEPTH ? "ml-5 pl-3 border-l-2 border-border/30" : ""}>
          {children.map((child) => (
            <CommentNode
              key={child.id}
              comment={child}
              myVote={allVotes[child.id] ?? 0}
              routeId={routeId}
              depth={depth + 1}
              childrenMap={childrenMap}
              allVotes={allVotes}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
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

  const childrenMap = useMemo(() => {
    const map = new Map<string, CommentRow[]>();
    for (const c of comments) {
      const parent = c.parent_id ?? "__root__";
      if (!map.has(parent)) map.set(parent, []);
      map.get(parent)!.push(c);
    }
    for (const [, children] of map) {
      children.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    }
    return map;
  }, [comments]);

  const topLevel = (childrenMap.get("__root__") ?? []).sort((a, b) =>
    sortBy === "recent"
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : b.upvotes - a.upvotes,
  );

  return (
    <div className="space-y-3">
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

      <CommentForm
        routeId={routeId}
        onCommentPosted={onRefresh}
        placeholder="Add a comment..."
      />

      {topLevel.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No comments yet. Be the first to share your thoughts.
        </p>
      )}

      <div className="divide-y divide-border/50">
        {topLevel.map((comment) => (
          <CommentNode
            key={comment.id}
            comment={comment}
            myVote={myVotes[comment.id] ?? 0}
            routeId={routeId}
            depth={0}
            childrenMap={childrenMap}
            allVotes={myVotes}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
}
