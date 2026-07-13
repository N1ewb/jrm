export interface JeepneyStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  routes: string[];
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

export const JEEPNEY_STOPS: JeepneyStop[] = [
  // City terminals
  { id: "stop-city-terminal", name: "City Central Terminal", lat: 8.2289, lng: 124.2383, routes: ["Suarez", "Buru-un", "Tibanga", "Tambacan"] },
  { id: "stop-supermarket-terminal", name: "Suarez Public Market Terminal", lat: 8.2450, lng: 124.2600, routes: ["Suarez"] },
  { id: "stop-buruun-terminal", name: "Buru-un Terminal", lat: 8.2100, lng: 124.2150, routes: ["Buru-un"] },

  // Major road intersections
  { id: "stop-roxas-avenue", name: "Roxas Avenue", lat: 8.2275, lng: 124.2375, routes: ["Suarez", "Buru-un", "Tibanga", "Tambacan"] },
  { id: "stop-quezon-avenue", name: "Quezon Avenue", lat: 8.2285, lng: 124.2395, routes: ["Suarez", "Buru-un"] },
  { id: "stop-andres-bonifacio", name: "Andres Bonifacio Ave.", lat: 8.2295, lng: 124.2405, routes: ["Tibanga", "Tambacan"] },

  // Malls & commercial
  { id: "stop-robinsons", name: "Robinsons Place Iligan", lat: 8.2310, lng: 124.2410, routes: ["Suarez", "Tibanga"] },
  { id: "stop-gaisano", name: "Gaisano Iligan", lat: 8.2260, lng: 124.2360, routes: ["Suarez", "Buru-un"] },

  // Schools
  { id: "stop-msu-iit", name: "MSU-IIT Main Gate", lat: 8.2350, lng: 124.2450, routes: ["Tibanga", "Tambacan"] },
  { id: "stop-icn", name: "Iligan City National High School", lat: 8.2240, lng: 124.2340, routes: ["Buru-un"] },

  // Hospitals
  { id: "stop-gregorio-hospital", name: "Gregorio Lluch Memorial Hospital", lat: 8.2290, lng: 124.2420, routes: ["Suarez", "Tibanga"] },
  { id: "stop-msu-iit-hospital", name: "MSU-IIT Hospital", lat: 8.2360, lng: 124.2460, routes: ["Tibanga"] },

  // Churches
  { id: "stop-cathedral", name: "St. Michael's Cathedral", lat: 8.2270, lng: 124.2390, routes: ["Suarez", "Buru-un", "Tibanga"] },
  { id: "stop-st-anne", name: "St. Anne's Church", lat: 8.2380, lng: 124.2500, routes: ["Tambacan"] },

  // Markets
  { id: "stop-public-market", name: "Iligan Public Market", lat: 8.2250, lng: 124.2370, routes: ["Suarez", "Buru-un"] },

  // Parks
  { id: "stop-city-park", name: "City Park", lat: 8.2280, lng: 124.2380, routes: ["Suarez", "Buru-un", "Tibanga"] },
  { id: "stop-macaraeg-park", name: "Macaraeg Macapagal Park", lat: 8.2275, lng: 124.2385, routes: ["Suarez", "Buru-un"] },

  // Route-specific stops
  { id: "stop-tibanga", name: "Tibanga Barangay Hall", lat: 8.2400, lng: 124.2550, routes: ["Tibanga"] },
  { id: "stop-tambacan", name: "Tambacan", lat: 8.2420, lng: 124.2600, routes: ["Tambacan"] },
  { id: "stop-palao", name: "Pala-o", lat: 8.2200, lng: 124.2250, routes: ["Pala-o"] },
  { id: "stop-hinaplanon", name: "Hinaplanon", lat: 8.2320, lng: 124.2480, routes: ["Hinaplanon"] },
  { id: "stop-villa-verde", name: "Villa Verde", lat: 8.2340, lng: 124.2520, routes: ["Villa Verde"] },
  { id: "stop-abuno", name: "Abuno", lat: 8.2500, lng: 124.2700, routes: ["Abuno"] },
  { id: "stop-tubod", name: "Tubod", lat: 8.2150, lng: 124.2100, routes: ["Tubod"] },
  { id: "stop-ditucalan", name: "Ditucalan", lat: 8.2220, lng: 124.2280, routes: ["Ditucalan"] },
  { id: "stop-steel-town", name: "Steel Town", lat: 8.2380, lng: 124.2560, routes: ["Steel Town"] },
  { id: "stop-fuentes", name: "Fuentes", lat: 8.2240, lng: 124.2320, routes: ["Fuentes"] },
  { id: "stop-tominobo", name: "Upper Tominobo", lat: 8.2000, lng: 124.1950, routes: ["Tominobo"] },
  { id: "stop-dalipuga", name: "Dalipuga", lat: 8.2550, lng: 124.2750, routes: ["Abuno"] },
  { id: "stop-bunawan", name: "Bunawan", lat: 8.2600, lng: 124.2850, routes: ["Abuno"] },
  { id: "stop-mainit", name: "Mainit", lat: 8.2480, lng: 124.2650, routes: ["Suarez"] },
  { id: "stop-san-miguel", name: "San Miguel", lat: 8.2420, lng: 124.2580, routes: ["Tibanga"] },
];

export function findNearestStops(
  lat: number,
  lng: number,
  limit = 5,
): (JeepneyStop & { distanceKm: number })[] {
  const origin = { lat, lng };
  const withDist = JEEPNEY_STOPS.map((stop) => ({
    ...stop,
    distanceKm: haversine(origin, stop),
  }));
  withDist.sort((a, b) => a.distanceKm - b.distanceKm);
  return withDist.slice(0, limit);
}

export function findStopsForRoute(
  routeName: string,
): JeepneyStop[] {
  return JEEPNEY_STOPS.filter((stop) =>
    stop.routes.some(
      (r) => r.toLowerCase() === routeName.toLowerCase(),
    ),
  );
}
