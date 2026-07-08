export interface Landmark {
  id: string;
  name: string;
  category: "terminal" | "church" | "mall" | "school" | "hospital" | "market" | "park" | "landmark";
  lat: number;
  lng: number;
}

export const ILIGAN_LANDMARKS: Landmark[] = [
  // Jeepney terminals
  { id: "term-supermarket", name: "Suarez Public Market", category: "terminal", lat: 8.2450, lng: 124.2600 },
  { id: "term-buruun", name: "Buru-un Terminal", category: "terminal", lat: 8.2100, lng: 124.2150 },
  { id: "term-city", name: "City Central Terminal", category: "terminal", lat: 8.2289, lng: 124.2383 },

  // Malls & shopping
  { id: "mall-robinsons", name: "Robinsons Place Iligan", category: "mall", lat: 8.2310, lng: 124.2410 },
  { id: "mall-gaisano", name: "Gaisano Iligan", category: "mall", lat: 8.2260, lng: 124.2360 },

  // Churches
  { id: "church-cathedral", name: "St. Michael's Cathedral", category: "church", lat: 8.2270, lng: 124.2390 },
  { id: "church-st-anne", name: "St. Anne's Church", category: "church", lat: 8.2380, lng: 124.2500 },

  // Schools
  { id: "school-msu", name: "MSU-Iligan Institute of Technology", category: "school", lat: 8.2350, lng: 124.2450 },
  { id: "school-icn", name: "Iligan City National High School", category: "school", lat: 8.2240, lng: 124.2340 },

  // Hospitals
  { id: "hospital-gregorio", name: "Gregorio T. Lluch Memorial Hospital", category: "hospital", lat: 8.2290, lng: 124.2420 },
  { id: "hospital-msu", name: "MSU-IIT Hospital", category: "hospital", lat: 8.2360, lng: 124.2460 },

  // Markets
  { id: "market-public", name: "Iligan Public Market", category: "market", lat: 8.2250, lng: 124.2370 },

  // Parks & landmarks
  { id: "park-city", name: "City Park", category: "park", lat: 8.2280, lng: 124.2380 },
  { id: "park-macaraeg", name: "Macaraeg Macapagal Park", category: "park", lat: 8.2275, lng: 124.2385 },
  { id: "landmark-waterfall", name: "Maria Cristina Falls", category: "landmark", lat: 8.1800, lng: 124.2000 },
  { id: "landmark-tinago", name: "Tinago Falls", category: "landmark", lat: 8.1700, lng: 124.1800 },
];
