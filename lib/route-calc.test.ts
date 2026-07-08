import { describe, it, expect } from "vitest";
import {
  haversineDistance,
  findClosestPointOnRoute,
  calculateRouteDistance,
  calculateFare,
  calculateETA,
  isInsideShudad,
} from "./route-calc";

describe("haversineDistance", () => {
  it("returns 0 for the same point", () => {
    expect(haversineDistance([124.2383, 8.2289], [124.2383, 8.2289])).toBe(0);
  });

  it("calculates distance between Iligan and Suarez market", () => {
    const dist = haversineDistance([124.2383, 8.2289], [124.2600, 8.2450]);
    expect(dist).toBeGreaterThan(2);
    expect(dist).toBeLessThan(4);
  });

  it("is commutative", () => {
    const a: [number, number] = [124.2383, 8.2289];
    const b: [number, number] = [124.2600, 8.2450];
    expect(haversineDistance(a, b)).toBe(haversineDistance(b, a));
  });

  it("handles large distances", () => {
    const iligan: [number, number] = [124.2383, 8.2289];
    const manila: [number, number] = [120.9842, 14.5995];
    const dist = haversineDistance(iligan, manila);
    expect(dist).toBeGreaterThan(700);
    expect(dist).toBeLessThan(900);
  });
});

describe("findClosestPointOnRoute", () => {
  const waypoints: [number, number][] = [
    [124.0, 8.0],
    [124.1, 8.1],
    [124.2, 8.2],
  ];

  it("returns exact match when place is on a waypoint", () => {
    const result = findClosestPointOnRoute([124.1, 8.1], waypoints);
    expect(result.index).toBe(1);
    expect(result.distanceKm).toBe(0);
  });

  it("returns the nearest waypoint for an off-center point", () => {
    const result = findClosestPointOnRoute([124.01, 8.01], waypoints);
    expect(result.index).toBe(0);
    expect(result.distanceKm).toBeGreaterThan(0);
  });

  it("handles single waypoint", () => {
    const result = findClosestPointOnRoute([124.5, 8.5], [[124.0, 8.0]]);
    expect(result.index).toBe(0);
    expect(result.distanceKm).toBeGreaterThan(50);
  });
});

describe("calculateRouteDistance", () => {
  it("returns 0 for empty array", () => {
    expect(calculateRouteDistance([])).toBe(0);
  });

  it("returns 0 for single point", () => {
    expect(calculateRouteDistance([[124.0, 8.0]])).toBe(0);
  });

  it("calculates distance between two points", () => {
    const dist = calculateRouteDistance([
      [124.0, 8.0],
      [124.1, 8.1],
    ]);
    const expected = haversineDistance([124.0, 8.0], [124.1, 8.1]);
    expect(dist).toBe(expected);
  });
});

describe("calculateFare", () => {
  it("charges minimum fare for distances under 4 km", () => {
    expect(calculateFare(3)).toBe(13);
    expect(calculateFare(4)).toBe(13);
  });

  it("charges additional per km beyond 4 km", () => {
    expect(calculateFare(5)).toBe(14);
    expect(calculateFare(10)).toBe(19);
  });

  it("rounds up remaining distance", () => {
    expect(calculateFare(4.2)).toBe(14);
  });
});

describe("calculateETA", () => {
  it("returns at least 1 minute", () => {
    const result = calculateETA(0.1, "Jeep");
    expect(result.minutes).toBeGreaterThanOrEqual(1);
  });

  it("calculates ETA for jeep at 20 km/h", () => {
    const result = calculateETA(10, "Jeep");
    expect(result.minutes).toBe(30);
  });

  it("calculates ETA for bus at 25 km/h", () => {
    const result = calculateETA(10, "Bus");
    expect(result.minutes).toBe(24);
  });
});

describe("isInsideShudad", () => {
  it("returns true for poblacion center", () => {
    expect(isInsideShudad([124.2383, 8.2289])).toBe(true);
  });

  it("returns false for distant point", () => {
    expect(isInsideShudad([124.5, 8.5], [124.2383, 8.2289], 1.5)).toBe(false);
  });
});
