"use client";

import { useState, useRef } from "react";
import { Send, Loader2 } from "lucide-react";

interface CommentFormProps {
  routeId: string;
  parentId?: string;
  placeholder?: string;
  onCommentPosted: () => void;
  onCancel?: () => void;
}

export default function CommentForm({
  routeId,
  parentId,
  placeholder = "Write a comment...",
  onCommentPosted,
  onCancel,
}: CommentFormProps) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || body.trim().length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const { postComment } = await import("@/actions/discussion.actions");
      const result = await postComment(routeId, body, parentId);

      if ("error" in result) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      setBody("");
      onCommentPosted();
    } catch {
      setError("Failed to post comment");
      setSubmitting(false);
    }
  };

  return (
    <div ref={formRef} className="space-y-2">
      <form onSubmit={handleSubmit} className="flex items-start gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          rows={2}
          maxLength={2000}
          className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-2 focus:ring-primary/30 transition-shadow"
        />
        <button
          type="submit"
          disabled={submitting || body.trim().length === 0}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          aria-label="Submit comment"
        >
          {submitting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
        </button>
      </form>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
