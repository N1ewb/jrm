"use client";

import { useState, useCallback } from "react";
import { Flag, Loader2, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ReportRouteButtonProps {
  routeId: string;
}

const REPORT_REASONS = [
  "Inaccurate route path",
  "Wrong fare information",
  "Wrong ETA or distance",
  "Route no longer exists",
  "Duplicate route",
  "Inappropriate content",
  "Wrong vehicle type",
  "Other",
];

export default function ReportRouteButton({ routeId }: ReportRouteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [customDetails, setCustomDetails] = useState("");

  const handleReport = useCallback(async (reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const { reportRoute } = await import("@/actions/report.actions");
      const result = await reportRoute(routeId, reason, customDetails || undefined);
      if ("success" in result) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to submit report");
    } finally {
      setLoading(false);
    }
  }, [routeId, customDetails]);

  if (success) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-green-600">
        <CheckCircle2 size={12} />
        Reported
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive gap-1.5"
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Flag size={13} />
          )}
          <span className="hidden sm:inline">Report</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {REPORT_REASONS.slice(0, 7).map((reason) => (
          <DropdownMenuItem
            key={reason}
            onClick={() => handleReport(reason)}
            disabled={loading}
          >
            {reason}
          </DropdownMenuItem>
        ))}
        {showMore ? (
          <div className="p-2 space-y-2">
            <textarea
              value={customDetails}
              onChange={(e) => setCustomDetails(e.target.value)}
              placeholder="Describe the issue..."
              className="w-full h-20 px-2 py-1.5 rounded border border-border text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30 resize-none"
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="default"
                className="text-xs h-7"
                onClick={() => handleReport("Other")}
                disabled={loading || !customDetails.trim()}
              >
                Submit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7"
                onClick={() => setShowMore(false)}
              >
                Back
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        ) : (
          <>
            <DropdownMenuItem
              onClick={() => setShowMore(true)}
            >
              Other (describe)...
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
