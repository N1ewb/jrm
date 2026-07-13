"use client";

import { useState } from "react";
import {
  Route, Clock, DollarSign, MapPin, Navigation, Footprints, ArrowRight, ChevronDown, ChevronUp, Play, Repeat,
} from "lucide-react";
import type { NearbyRoute } from "@/lib/route-calc";
import type { MultiHopJourney } from "@/lib/pathfinding";
import VoteButtons from "@/components/vote-buttons";
import FavoritesButton from "@/components/favorites-button";

interface RouteSuggestionsProps {
  routes: NearbyRoute[];
  multiHopRoutes?: MultiHopJourney[];
  placeName: string;
  onFocusRoute: (route: NearbyRoute) => void;
  onStartTrip?: (route: NearbyRoute) => void;
  myVotes?: Record<string, -1 | 0 | 1>;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function formatTime(min: number): string {
  if (min < 1) return "<1 min";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function RouteCardCollapsed({
  route,
  rank,
  placeName,
  myVote,
  isExpanded,
  onToggle,
  onFocus,
  onStartTrip,
}: {
  route: NearbyRoute;
  rank: number;
  placeName: string;
  myVote?: -1 | 0 | 1;
  isExpanded: boolean;
  onToggle: () => void;
  onFocus: () => void;
  onStartTrip?: () => void;
}) {
  const totalWalkKm = route.boardingDistanceKm + route.alightingDistanceKm;

  return (
    <div className="divide-y divide-border/50">
      <div
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        role="button"
        tabIndex={0}
        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-start gap-3 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-primary">
          {rank}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{route.line}</p>
            <span className="text-[10px] uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
              {route.type}
            </span>
          </div>

          {/* Desktop: full chain */}
          <div className="hidden sm:flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1" title="Walk to jeep stop">
              <Footprints size={12} />
              {formatDistance(route.boardingDistanceKm)}
            </span>
            <ArrowRight size={11} className="text-muted-foreground/50" />
            <span className="flex items-center gap-1" title="Ride the jeep">
              <Route size={12} />
              {route.distanceKm.toFixed(1)} km
            </span>
            <ArrowRight size={11} className="text-muted-foreground/50" />
            <span className="flex items-center gap-1" title="Walk to destination">
              <Footprints size={12} />
              {formatDistance(route.alightingDistanceKm)}
            </span>
          </div>

          {/* Mobile: compact stats */}
          <div className="flex sm:hidden items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Footprints size={12} />
              {formatDistance(totalWalkKm)} walk
            </span>
            <ArrowRight size={10} className="text-muted-foreground/40" />
            <span className="flex items-center gap-1">
              <Route size={12} />
              {formatTime(route.etaMin)}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {route.etaMin} min
            </span>
            <span className="flex items-center gap-1">
              <DollarSign size={12} />
              ₱{route.farePhp}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1">
          <div onClick={(e) => e.stopPropagation()}>
            <FavoritesButton
              item={{ type: "route", id: route.id, line: route.line, savedAt: Date.now() }}
              size={14}
            />
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <VoteButtons
              routeId={route.id}
              initialUpvotes={route.upvotes}
              initialDownvotes={route.downvotes}
              initialMyVote={myVote ?? 0}
              size="sm"
            />
          </div>
          {isExpanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 py-4 space-y-3 bg-muted/30">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            How to get to {placeName}
          </h4>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0 mt-0.5">
                <Footprints size={12} className="text-green-600 dark:text-green-300" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Walk to {route.line} stop
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistance(route.boardingDistanceKm)} from your location to the nearest jeepney stop
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Route size={12} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Ride {route.line} {route.type.toLowerCase()}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {route.distanceKm.toFixed(1)} km · {route.etaMin} min · ₱{route.farePhp}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={12} className="text-orange-600 dark:text-orange-300" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Walk to {placeName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistance(route.alightingDistanceKm)} from the stop to your destination
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 h-px bg-border" />
            {onStartTrip && (
              <button
                type="button"
                onClick={onStartTrip}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors shrink-0"
              >
                <Play size={13} />
                Start Trip
              </button>
            )}
            <button
              type="button"
              onClick={onFocus}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shrink-0"
            >
              <Navigation size={13} />
              Show on map
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RouteSuggestions({
  routes,
  multiHopRoutes,
  placeName,
  onFocusRoute,
  onStartTrip,
  myVotes,
}: RouteSuggestionsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (routes.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-lg border border-border/50 p-5 text-center">
        <MapPin size={36} className="mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground">No routes nearby</p>
        <p className="text-xs text-muted-foreground mt-1">
          No jeepney routes found within 1 km of this location.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-lg border border-border/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
        <Navigation size={16} className="text-primary" />
        <p className="text-sm font-semibold text-foreground">
          Nearby Jeepney Routes
        </p>
        <span className="text-xs text-muted-foreground ml-auto">
          {routes.length} found
        </span>
      </div>

      <ul className="divide-y divide-border/50 max-h-[480px] overflow-y-auto">
        {routes.map((route, i) => (
          <li key={route.id}>
            <RouteCardCollapsed
              route={route}
              rank={i + 1}
              placeName={placeName}
              myVote={myVotes?.[route.id] ?? 0}
              isExpanded={expandedId === route.id}
              onToggle={() => setExpandedId(expandedId === route.id ? null : route.id)}
              onFocus={() => {
                setExpandedId(null);
                onFocusRoute(route);
              }}
              onStartTrip={onStartTrip ? () => onStartTrip(route) : undefined}
            />
          </li>
        ))}
      </ul>

      {multiHopRoutes && multiHopRoutes.length > 0 && (
        <>
          <div className="px-4 py-2 border-t border-border/50 flex items-center gap-2 bg-muted/20">
            <Repeat size={14} className="text-primary" />
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
              With transfers
            </p>
            <span className="text-xs text-muted-foreground ml-auto">
              {multiHopRoutes.length} found
            </span>
          </div>

          <ul className="divide-y divide-border/50">
            {multiHopRoutes.map((journey, i) => (
              <li key={`multi-${i}`}>
                <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-orange-600 dark:text-orange-300">
                      {routes.length + i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      {journey.segments.map((seg, si) => (
                        <div key={si} className="flex items-center gap-2 text-sm">
                          {si > 0 && (
                            <span className="text-xs text-muted-foreground ml-10">
                              ⏎ Transfer at {seg.line} stop
                            </span>
                          )}
                          <div className="flex items-center gap-2">
                            <Route size={14} className="text-primary shrink-0" />
                            <span className="font-medium text-foreground">{seg.line}</span>
                            <span className="text-xs text-muted-foreground">
                              {seg.rideDistanceKm.toFixed(1)} km
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Footprints size={12} />
                          {journey.totalWalkKm < 1
                            ? `${Math.round(journey.totalWalkKm * 1000)} m`
                            : `${journey.totalWalkKm.toFixed(1)} km`}{" "}
                          walk
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatTime(journey.totalEtaMin)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={12} />
                          ₱{journey.totalFarePhp}
                        </span>
                        <span className="flex items-center gap-1 text-orange-500">
                          <Repeat size={12} />
                          {journey.transfers} transfer{journey.transfers > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
