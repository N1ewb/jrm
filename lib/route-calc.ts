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
