import { FARE, AVG_SPEED, SHUDAD } from "./constants";

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(
  coord1: [number, number],
  coord2: [number, number],
): number {
  const R = 6371;
  const dLat = toRad(coord2[1] - coord1[1]);
  const dLon = toRad(coord2[0] - coord1[0]);
  const lat1 = toRad(coord1[1]);
  const lat2 = toRad(coord2[1]);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function calculateRouteDistance(
  coords: [number, number][],
): number {
  if (coords.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    total += haversineDistance(coords[i], coords[i + 1]);
  }
  return total;
}

export function calculateETA(
  distanceKm: number,
  type: "Jeep" | "Bus",
): { minutes: number; display: string } {
  const speed = type === "Bus" ? AVG_SPEED.bus : AVG_SPEED.jeep;
  const hours = distanceKm / speed;
  const minutes = Math.round(hours * 60);

  if (minutes < 1) return { minutes: 1, display: "1 min" };
  if (minutes < 60) return { minutes, display: `${minutes} min` };

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return { minutes, display: `${h}h ${m}m` };
}

export function calculateFare(distanceKm: number): number {
  const remaining = Math.max(0, distanceKm - 4);
  const fare = FARE.first4Km + Math.ceil(remaining) * FARE.succeedingPerKm;
  return fare;
}

export function isInsideShudad(
  point: [number, number],
  center: [number, number] = SHUDAD.center,
  radiusKm: number = SHUDAD.radiusKm,
): boolean {
  return haversineDistance(point, center) <= radiusKm;
}

export function calculateDistanceOutsideShudad(
  coords: [number, number][],
  center: [number, number] = SHUDAD.center,
  radiusKm: number = SHUDAD.radiusKm,
): number {
  if (coords.length < 2) return 0;

  let outsideDist = 0;
  let enteredShudad = false;

  for (let i = 0; i < coords.length - 1; i++) {
    const inside = isInsideShudad(coords[i], center, radiusKm);

    if (!inside && !enteredShudad) {
      const nextInside = isInsideShudad(coords[i + 1], center, radiusKm);
      if (nextInside) {
        enteredShudad = true;
      }
      outsideDist += haversineDistance(coords[i], coords[i + 1]);
    }
  }

  return outsideDist;
}

export function distanceToPoblacion(
  point: [number, number],
  poblacion: [number, number] = [124.2383, 8.2289],
): number {
  return haversineDistance(point, poblacion);
}

export interface RouteInput {
  id: string;
  line: string;
  type: "Jeep" | "Bus";
  start_point: string;
  distance_km: number;
  eta_min: number;
  fare_php: number;
  waypoints: [number, number][];
  upvotes?: number;
  downvotes?: number;
}

export interface TransferPoint {
  routeAId: string;
  routeBId: string;
  /** Index into routeA's waypoints */
  aIndex: number;
  /** Index into routeB's waypoints */
  bIndex: number;
  /** Midpoint coordinate between the two waypoints */
  coordinate: [number, number];
  /** Walking distance between the two stops */
  walkDistanceKm: number;
}

const TRANSFER_THRESHOLD_KM = 0.1;

/**
 * Find all transfer points between routes — pairs of waypoints (one from each
 * route) within `TRANSFER_THRESHOLD_KM` of each other.
 */
export function findRouteTransfers(
  routes: RouteInput[],
  thresholdKm: number = TRANSFER_THRESHOLD_KM,
): TransferPoint[] {
  const results: TransferPoint[] = [];
  const seen = new Set<string>();

  for (let a = 0; a < routes.length; a++) {
    for (let b = a + 1; b < routes.length; b++) {
      const routeA = routes[a];
      const routeB = routes[b];

      for (let ai = 0; ai < routeA.waypoints.length; ai++) {
        for (let bi = 0; bi < routeB.waypoints.length; bi++) {
          const dist = haversineDistance(routeA.waypoints[ai], routeB.waypoints[bi]);
          if (dist > thresholdKm) continue;

          const key = [routeA.id, ai, routeB.id, bi].sort().join(":");
          if (seen.has(key)) continue;
          seen.add(key);

          results.push({
            routeAId: routeA.id,
            routeBId: routeB.id,
            aIndex: ai,
            bIndex: bi,
            coordinate: [
              (routeA.waypoints[ai][0] + routeB.waypoints[bi][0]) / 2,
              (routeA.waypoints[ai][1] + routeB.waypoints[bi][1]) / 2,
            ] as [number, number],
            walkDistanceKm: dist,
          });
        }
      }
    }
  }

  return results;
}

export function findClosestPointOnRoute(
  place: [number, number],
  waypoints: [number, number][],
): { distanceKm: number; index: number } {
  let minDist = Infinity;
  let minIndex = 0;

  for (let i = 0; i < waypoints.length; i++) {
    const dist = haversineDistance(place, waypoints[i]);
    if (dist < minDist) {
      minDist = dist;
      minIndex = i;
    }
  }

  return { distanceKm: minDist, index: minIndex };
}

export interface NearbyRoute {
  id: string;
  line: string;
  type: "Jeep" | "Bus";
  startPoint: string;
  distanceKm: number;
  etaMin: number;
  farePhp: number;
  waypoints: [number, number][];
  upvotes: number;
  downvotes: number;

  /** Alighting: closest waypoint to the destination */
  alightingDistanceKm: number;
  alightingIndex: number;

  /** Boarding: closest waypoint to the user's origin */
  boardingDistanceKm: number;
  boardingIndex: number;

  /** Combined score (lower = better) */
  score: number;
}

export const SUGGESTION_WEIGHTS = {
  walkToBoard: 2.0,
  walkToAlight: 2.0,
  tripFare: 0.5,
  travelTime: 5.0,
  transferPenalty: 1.0,
};

function computeScore(
  boardingDistanceKm: number,
  alightingDistanceKm: number,
  farePhp: number,
  etaMin: number,
): number {
  const timeH = etaMin / 60;
  return (
    SUGGESTION_WEIGHTS.walkToBoard * boardingDistanceKm +
    SUGGESTION_WEIGHTS.walkToAlight * alightingDistanceKm +
    SUGGESTION_WEIGHTS.tripFare * farePhp +
    SUGGESTION_WEIGHTS.travelTime * timeH
  );
}

export function findNearbyRoutes(
  place: [number, number],
  routes: RouteInput[],
  maxDistanceKm: number = 1,
  origin?: [number, number],
): NearbyRoute[] {
  const results: NearbyRoute[] = [];

  for (const route of routes) {
    const alight = findClosestPointOnRoute(place, route.waypoints);
    if (alight.distanceKm > maxDistanceKm) continue;

    const board = origin
      ? findClosestPointOnRoute(origin, route.waypoints)
      : { distanceKm: 0, index: 0 };

    results.push({
      id: route.id,
      line: route.line,
      type: route.type,
      startPoint: route.start_point,
      distanceKm: route.distance_km,
      etaMin: route.eta_min,
      farePhp: route.fare_php,
      waypoints: route.waypoints,
      upvotes: route.upvotes ?? 0,
      downvotes: route.downvotes ?? 0,
      alightingDistanceKm: alight.distanceKm,
      alightingIndex: alight.index,
      boardingDistanceKm: board.distanceKm,
      boardingIndex: board.index,
      score: computeScore(board.distanceKm, alight.distanceKm, route.fare_php, route.eta_min),
    });
  }

  results.sort((a, b) => a.score - b.score);
  return results;
}
