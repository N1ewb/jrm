"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { JEEPNEY_LINES, PUJ_TYPES } from "@/lib/constants";
import { calculateETA, calculateFare, calculateDistanceOutsideShudad } from "@/lib/route-calc";
import { cn } from "@/lib/utils";
import { Route, Clock, DollarSign, Loader2, Info, MapPin } from "lucide-react";

interface RouteInfoFormProps {
  routeCoords: [number, number][];
  distance: number;
  onReset?: () => void;
}

export default function RouteInfoForm({
  routeCoords,
  distance,
  onReset,
}: RouteInfoFormProps) {
  const [type, setType] = useState<"Jeep" | "Bus">("Jeep");
  const [line, setLine] = useState("");
  const [startPoint, setStartPoint] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const calculations = useMemo(() => {
    const fareableKm = calculateDistanceOutsideShudad(routeCoords);
    const eta = calculateETA(distance, type);
    const fare = calculateFare(fareableKm);
    return { eta, fare, fareableKm };
  }, [routeCoords, distance, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSubmitError("");

    try {
      const { saveRoute } = await import("@/actions/map.actions");
      const result = await saveRoute({
        type,
        line,
        startPoint,
        distanceKm: distance,
        etaMin: calculations.eta.minutes,
        farePhp: calculations.fare,
        waypoints: routeCoords,
      });

      if (result.error) {
        setSubmitError(result.error);
        setSaving(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Route size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">
                Route Submitted!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your {line} route has been submitted for community review.
              </p>
            </div>
            {onReset && (
              <Button variant="outline" size="sm" onClick={onReset}>
                Draw Another Route
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Route Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>PUJ Type</Label>
            <div className="flex gap-2">
              {PUJ_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "flex-1 h-10 rounded-lg text-sm font-medium transition-colors border",
                    type === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-muted",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="line">Jeepney Line</Label>
            <select
              id="line"
              value={line}
              onChange={(e) => setLine(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="" disabled>
                Select a line
              </option>
              {JEEPNEY_LINES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-point">Route Origin</Label>
            <Input
              id="start-point"
              placeholder="e.g., Suarez Public Market"
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Calculations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Route size={16} className="text-primary" />
              <span className="text-sm text-foreground">Route Distance</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {distance.toFixed(2)} km
            </span>
          </div>

          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <span className="text-sm text-foreground">ETA (full route)</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {calculations.eta.display}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <span className="text-sm text-foreground">Outside Shudad</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {calculations.fareableKm.toFixed(2)} km
            </span>
          </div>

          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">Fare (est.)</span>
            </div>
            <span className="text-lg font-bold text-primary">
              ₱{calculations.fare}
            </span>
          </div>

          <div className="flex items-start gap-2 pt-1 px-1">
            <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Fare calculated only for distance outside the shudad (city proper)
              area. Distance within the shudad is not charged.
            </p>
          </div>
        </CardContent>
      </Card>

      {submitError && (
        <p className="text-sm text-destructive text-center">{submitError}</p>
      )}

      <Button
        type="submit"
        className="w-full h-11 text-base"
        disabled={!line || !startPoint || saving}
      >
        {saving ? (
          <span className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Saving...
          </span>
        ) : (
          "Submit Route"
        )}
      </Button>
    </form>
  );
}
