/**
 * Philippine Standard Geographic Code (PSGC) API
 * Source: https://psgc.gitlab.io/api/
 *
 * Free, no API key required. Returns JSON with regions, provinces, cities,
 * municipalities, and barangays with their official PSGC codes.
 *
 * Iligan City:  https://psgc.gitlab.io/api/cities/103504000/
 * Barangays:     https://psgc.gitlab.io/api/cities/103504000/barangays/
 *
 * Usage example:
 *   const res = await fetch("https://psgc.gitlab.io/api/cities/103504000/barangays/");
 *   const data = await res.json();
 *   // data[0].name === "Abuno"
 */

export const POBLACION: [number, number] = [124.2383, 8.2289];

export const SHUDAD = {
  center: [124.2383, 8.2289] as [number, number],
  radiusKm: 1.5,
};

export const DEFAULT_CENTER: [number, number] = [124.2383, 8.2289];
export const DEFAULT_ZOOM = 13;

/** All 44 barangays of Iligan City per PSGC */
export const ILIGAN_BARANGAYS = [
  "Abuno",
  "Acmac",
  "Bagong Silang",
  "Bonbonon",
  "Bunawan",
  "Buru-un",
  "Dalipuga",
  "Del Carmen",
  "Digkilaan",
  "Ditucalan",
  "Dulag",
  "Hinaplanon",
  "Hindang",
  "Kabacsanan",
  "Kalilangan",
  "Kiwalan",
  "Lanipao",
  "Luinab",
  "Mahayahay",
  "Mainit",
  "Mandulog",
  "Maria Cristina",
  "Pala-o",
  "Panoroganan",
  "Poblacion",
  "Puga-an",
  "Rogongon",
  "San Miguel",
  "San Roque",
  "Santa Elena",
  "Santa Filomena",
  "Santiago",
  "Santo Rosario",
  "Saray",
  "Suarez",
  "Tambacan",
  "Tibanga",
  "Tipanoy",
  "Tomas L. Cabili",
  "Tubod",
  "Ubaldo Laya",
  "Upper Hinaplanon",
  "Upper Tominobo",
  "Villa Verde",
] as const;

/** Jeepney route lines with known active route data.
 *  This list grows as the community submits new routes.
 *  Source: community submissions + local knowledge.
 *  There is no public API for jeepney routes — data is built by contributors. */
export const JEEPNEY_LINES = [
  "Suarez",
  "Buru-un",
  "Tominobo",
  "Fuentes",
  "Tibanga",
  "Pala-o",
  "Hinaplanon",
  "Tambacan",
  "Villa Verde",
  "Steel Town",
  "Abuno",
  "Tubod",
  "Bara-as",
  "Ditucalan",
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
