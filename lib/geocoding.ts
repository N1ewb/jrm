const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "JRM-JeepneyRouteMapper/1.0";

export interface PlaceResult {
  osmId: string;
  osmType: string;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
  category: string;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sin =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sin), Math.sqrt(1 - sin));
}

export function sortByDistance(
  places: PlaceResult[],
  origin: { lat: number; lng: number },
): PlaceResult[] {
  return [...places].sort(
    (a, b) => haversine(origin, a) - haversine(origin, b),
  );
}

export async function searchPlaces(
  query: string,
  origin?: { lat: number; lng: number },
): Promise<PlaceResult[]> {
  if (query.trim().length < 2) return [];

  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "7",
    addressdetails: "1",
    countrycodes: "ph",
  });

  const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) return [];

  const data = await res.json();

  const places = data.map((item: any) => ({
    osmId: item.osm_id,
    osmType: item.osm_type,
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    type: item.type ?? "",
    category: item.category ?? "",
  }));

  return origin ? sortByDistance(places, origin) : places;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<PlaceResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
  });

  const res = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) return null;

  const data = await res.json();

  if (!data || data.error) return null;

  return {
    osmId: data.osm_id,
    osmType: data.osm_type,
    displayName: data.display_name,
    lat: parseFloat(data.lat),
    lng: parseFloat(data.lon),
    type: data.type ?? "",
    category: data.category ?? "",
  };
}
