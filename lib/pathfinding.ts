import {
  haversineDistance,
  findClosestPointOnRoute,
  SUGGESTION_WEIGHTS,
  type RouteInput,
  type TransferPoint,
} from "./route-calc";

export interface MultiHopSegment {
  routeId: string;
  line: string;
  type: "Jeep" | "Bus";
  /** Index into this route's waypoints where the user boards */
  boardIndex: number;
  /** Index into this route's waypoints where the user alights */
  alightIndex: number;
  /** Walking distance from previous stop (or origin) to this board point */
  walkToBoardKm: number;
  /** Walking distance from alight point to next stop (or destination) */
  walkToNextKm: number;
  /** Distance traveled on this route segment */
  rideDistanceKm: number;
  /** Estimated time on this route segment */
  rideEtaMin: number;
  /** Fare for this route segment */
  farePhp: number;
}

export interface MultiHopJourney {
  segments: MultiHopSegment[];
  /** Total walking distance (origin→board + transfers + alight→destination) */
  totalWalkKm: number;
  /** Total riding distance */
  totalRideKm: number;
  /** Total estimated time (walk + ride) */
  totalEtaMin: number;
  /** Total fare */
  totalFarePhp: number;
  /** Combined score (lower = better) */
  score: number;
  /** Number of route changes */
  transfers: number;
}

interface GraphNode {
  routeId: string;
  line: string;
  type: "Jeep" | "Bus";
}

interface GraphEdge {
  to: string;
  transfer: TransferPoint;
}

function buildAdjacencyList(
  routes: RouteInput[],
  transfers: TransferPoint[],
): Map<string, GraphEdge[]> {
  const adj = new Map<string, GraphEdge[]>();

  for (const t of transfers) {
    if (!adj.has(t.routeAId)) adj.set(t.routeAId, []);
    if (!adj.has(t.routeBId)) adj.set(t.routeBId, []);

    adj.get(t.routeAId)!.push({ to: t.routeBId, transfer: t });
    adj.get(t.routeBId)!.push({ to: t.routeAId, transfer: t });
  }

  return adj;
}

export function findMultiHopRoutes(
  origin: [number, number],
  destination: [number, number],
  routes: RouteInput[],
  transfers: TransferPoint[],
  maxWalkKm: number = 1,
  maxDepth: number = 3,
): MultiHopJourney[] {
  const adj = buildAdjacencyList(routes, transfers);
  const routeMap = new Map(routes.map((r) => [r.id, r]));

  const boardingRoutes: { routeId: string; boardIndex: number; walkKm: number }[] = [];
  const alightingRoutes: { routeId: string; alightIndex: number; walkKm: number }[] = [];

  for (const r of routes) {
    const board = findClosestPointOnRoute(origin, r.waypoints);
    const alight = findClosestPointOnRoute(destination, r.waypoints);

    if (board.distanceKm <= maxWalkKm) {
      boardingRoutes.push({ routeId: r.id, boardIndex: board.index, walkKm: board.distanceKm });
    }
    if (alight.distanceKm <= maxWalkKm) {
      alightingRoutes.push({ routeId: r.id, alightIndex: alight.index, walkKm: alight.distanceKm });
    }
  }

  if (boardingRoutes.length === 0 || alightingRoutes.length === 0) {
    return [];
  }

  const results: MultiHopJourney[] = [];

  for (const board of boardingRoutes) {
    for (const alight of alightingRoutes) {
      if (board.routeId === alight.routeId) continue;

      const path = bfs(adj, board.routeId, alight.routeId, maxDepth);
      if (!path) continue;

      const journey = buildJourney(
        origin,
        destination,
        routes,
        routeMap,
        path,
        transfers,
        board,
        alight,
      );
      if (journey) results.push(journey);
    }
  }

  results.sort((a, b) => a.score - b.score);
  return results.slice(0, 5);
}

function bfs(
  adj: Map<string, GraphEdge[]>,
  start: string,
  target: string,
  maxDepth: number,
): string[] | null {
  if (start === target) return null;

  const queue: { node: string; path: string[] }[] = [{ node: start, path: [start] }];
  const visited = new Set<string>();
  visited.add(start);

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;

    if (path.length > maxDepth + 1) continue;

    const edges = adj.get(node) ?? [];
    for (const edge of edges) {
      if (visited.has(edge.to)) continue;
      visited.add(edge.to);

      const newPath = [...path, edge.to];

      if (edge.to === target) {
        return newPath;
      }

      queue.push({ node: edge.to, path: newPath });
    }
  }

  return null;
}

function buildJourney(
  origin: [number, number],
  destination: [number, number],
  routes: RouteInput[],
  routeMap: Map<string, RouteInput>,
  path: string[],
  transfers: TransferPoint[],
  board: { routeId: string; boardIndex: number; walkKm: number },
  alight: { routeId: string; alightIndex: number; walkKm: number },
): MultiHopJourney | null {
  const segments: MultiHopSegment[] = [];
  let totalWalkKm = board.walkKm;
  let totalRideKm = 0;
  let totalEtaMin = 0;
  let totalFarePhp = 0;

  for (let i = 0; i < path.length; i++) {
    const routeId = path[i];
    const r = routeMap.get(routeId);
    if (!r) return null;

    const isFirst = i === 0;
    const isLast = i === path.length - 1;

    const boardIdx = isFirst ? board.boardIndex : findTransferIndex(path[i - 1], routeId, transfers);
    const alightIdx = isLast ? alight.alightIndex : findTransferIndex(routeId, path[i + 1], transfers);

    if (boardIdx === -1 || alightIdx === -1) return null;

    if (boardIdx === alightIdx) return null;

    const rideWaypoints = r.waypoints.slice(
      Math.min(boardIdx, alightIdx),
      Math.max(boardIdx, alightIdx) + 1,
    );

    let rideDist = 0;
    for (let w = 0; w < rideWaypoints.length - 1; w++) {
      rideDist += haversineDistance(rideWaypoints[w], rideWaypoints[w + 1]);
    }

    const rideEta = Math.max(1, Math.round((rideDist / 20) * 60));
    const fare = 13 + Math.ceil(Math.max(0, rideDist - 4)) * 1;

    let walkToNext = 0;
    if (isLast) {
      walkToNext = alight.walkKm;
    } else {
      const nextRouteBoardIdx = findTransferIndex(routeId, path[i + 1], transfers);
      if (nextRouteBoardIdx !== -1) {
        walkToNext = haversineDistance(
          r.waypoints[alightIdx],
          (routeMap.get(path[i + 1])?.waypoints[nextRouteBoardIdx]) ?? r.waypoints[alightIdx],
        );
      }
    }

    totalWalkKm += walkToNext;
    totalRideKm += rideDist;
    totalEtaMin += rideEta;
    totalFarePhp += fare;

    segments.push({
      routeId: r.id,
      line: r.line,
      type: r.type,
      boardIndex: boardIdx,
      alightIndex: alightIdx,
      walkToBoardKm: isFirst ? board.walkKm : walkToNext,
      walkToNextKm: walkToNext,
      rideDistanceKm: rideDist,
      rideEtaMin: rideEta,
      farePhp: fare,
    });
  }

  const transfersCount = path.length - 1;
  const timeH = totalEtaMin / 60;
  const score =
    SUGGESTION_WEIGHTS.walkToBoard * totalWalkKm +
    SUGGESTION_WEIGHTS.walkToAlight * 0 +
    SUGGESTION_WEIGHTS.tripFare * totalFarePhp +
    SUGGESTION_WEIGHTS.travelTime * timeH +
    SUGGESTION_WEIGHTS.transferPenalty * transfersCount;

  return {
    segments,
    totalWalkKm,
    totalRideKm,
    totalEtaMin,
    totalFarePhp,
    score,
    transfers: transfersCount,
  };
}

function findTransferIndex(
  routeAId: string,
  routeBId: string,
  transfers: TransferPoint[],
): number {
  for (const t of transfers) {
    if (t.routeAId === routeAId && t.routeBId === routeBId) return t.aIndex;
    if (t.routeAId === routeBId && t.routeBId === routeAId) return t.bIndex;
  }
  return -1;
}
