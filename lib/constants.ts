export const POBLACION: [number, number] = [124.2383, 8.2289];

export const SHUDAD = {
  center: [124.2383, 8.2289] as [number, number],
  radiusKm: 1.5,
};

export const DEFAULT_CENTER: [number, number] = [124.2383, 8.2289];
export const DEFAULT_ZOOM = 13;

export const JEEPNEY_LINES = [
  "Suarez",
  "Buru-un",
  "Tominobo",
  "Fuentes",
  "Tibanga",
  "Pala-o",
  "Hinaplanon",
  "Mahayahay",
  "Tambacan",
  "Villa Verde",
] as const;

export const PUJ_TYPES = ["Jeep", "Bus"] as const;

export const FARE = {
  first4Km: 13,
  succeedingPerKm: 1,
} as const;

export const AVG_SPEED = {
  jeep: 20,
  bus: 25,
} as const;
