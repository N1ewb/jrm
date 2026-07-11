export interface ModerationResult {
  pass: boolean;
  reason?: string;
  severity: "flag" | "block";
  matches?: string[];
}

export interface DetectionResult {
  isObscene: boolean;
  reasons: string[];
  confidence: number;
}

export const BLOCKED_WORDS: string[] = [
  "fuck", "fucking", "fucked", "fucker", "shit", "shitting", "shitted",
  "asshole", "bitch", "bastard", "dick", "cock", "pussy", "cunt",
  "whore", "slut", "motherfucker", "motherfucking", "nigga", "nigger",
  "faggot", "fag", "retard", "retarded", "kike", "spic", "chink",
  "gook", "wetback", "beaner", "raghead", "cameljockey", "sandnigger",
  "paki", "pajeet", "tranny", "shemale", "hentai", "porn", "porno",
  "xxx", "sex", "sexual", "nude", "naked", "nsfw", "r18", "r-18",
  "+18", "18+", "adult content", "explicit", "obscene",
];

export const SUSPICIOUS_PATTERNS: RegExp[] = [
  /(?:^|\s)buy\s+(?:now|here|cheap|discount)/i,
  /(?:^|\s)click\s+here/i,
  /(?:^|\s)free\s+(?:money|cash|prize|gift|iphone|ipad)/i,
  /(?:^|\s)limited\s+time/i,
  /(?:^|\s)act\s+now/i,
  /(?:^|\s)don't\s+miss\s+out/i,
  /(?:^|\s)subscribe\s+to\s+(?:my|our)\s+channel/i,
  /(?:https?:\/\/[^\s]+){3,}/i,
  /(?:@[\w]+\s*){5,}/,
  /(?:^|\s)[A-Z]{6,}(?:\s|$)/,
  /(?:^|\s)(?:earn|make)\s+\$?\d{3,}/i,
  /(?:^|\s)investment\s+(?:opportunity|tip|advice)/i,
  /(?:^|\s)work\s+from\s+home/i,
  /(?:^|\s)bitcoin|crypto/i,
];

export function moderateContent(body: string): ModerationResult {
  const lower = body.toLowerCase();

  for (const word of BLOCKED_WORDS) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|\\s|[^a-z])${escaped}(?:$|\\s|[^a-z])`, "i");
    if (regex.test(lower)) {
      return {
        pass: false,
        reason: "Content violates community guidelines",
        severity: "block",
        matches: [word],
      };
    }
  }

  const suspiciousMatches: string[] = [];
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(body)) {
      suspiciousMatches.push(pattern.source);
    }
  }

  if (suspiciousMatches.length >= 2) {
    return {
      pass: false,
      reason: "Content appears to be spam",
      severity: "block",
      matches: suspiciousMatches,
    };
  }

  if (suspiciousMatches.length === 1) {
    return {
      pass: true,
      reason: "Suspicious content flagged for review",
      severity: "flag",
      matches: suspiciousMatches,
    };
  }

  return { pass: true, severity: "flag" };
}

export function moderateRouteName(name: string): ModerationResult {
  return moderateContent(name);
}

export function moderateRouteDescription(description: string): ModerationResult {
  return moderateContent(description);
}

export function detectObscenePattern(waypoints: [number, number][]): DetectionResult {
  if (waypoints.length < 5) {
    return { isObscene: false, reasons: [], confidence: 0 };
  }

  const reasons: string[] = [];
  let confidence = 0;

  const simplified = simplifyWaypoints(waypoints, 0.001);

  const phallicResult = checkPhallicShape(simplified);
  if (phallicResult.flagged) {
    reasons.push(...phallicResult.reasons);
    confidence = Math.max(confidence, phallicResult.confidence);
  }

  const hateSymbolResult = checkHateSymbol(simplified);
  if (hateSymbolResult.flagged) {
    reasons.push(...hateSymbolResult.reasons);
    confidence = Math.max(confidence, hateSymbolResult.confidence);
  }

  const textResult = checkOffensiveText(simplified);
  if (textResult.flagged) {
    reasons.push(...textResult.reasons);
    confidence = Math.max(confidence, textResult.confidence);
  }

  return {
    isObscene: confidence > 0.5,
    reasons,
    confidence,
  };
}

function simplifyWaypoints(
  waypoints: [number, number][],
  tolerance: number,
): [number, number][] {
  if (waypoints.length <= 2) return waypoints;

  let maxDistance = 0;
  let maxIndex = 0;

  const [firstLng, firstLat] = waypoints[0];
  const [lastLng, lastLat] = waypoints[waypoints.length - 1];

  for (let i = 1; i < waypoints.length - 1; i++) {
    const [lng, lat] = waypoints[i];
    const d = perpendicularDistance(lng, lat, firstLng, firstLat, lastLng, lastLat);
    if (d > maxDistance) {
      maxDistance = d;
      maxIndex = i;
    }
  }

  if (maxDistance > tolerance) {
    const left = simplifyWaypoints(waypoints.slice(0, maxIndex + 1), tolerance);
    const right = simplifyWaypoints(waypoints.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [waypoints[0], waypoints[waypoints.length - 1]];
}

function perpendicularDistance(
  lng: number, lat: number,
  lng1: number, lat1: number,
  lng2: number, lat2: number,
): number {
  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return Math.sqrt((lng - lng1) ** 2 + (lat - lat1) ** 2);
  return Math.abs(dy * (lng - lng1) - dx * (lat - lat1)) / length;
}

function checkPhallicShape(
  simplified: [number, number][],
): { flagged: boolean; reasons: string[]; confidence: number } {
  if (simplified.length < 3) return { flagged: false, reasons: [], confidence: 0 };

  const lngs = simplified.map((p) => p[0]);
  const lats = simplified.map((p) => p[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const width = maxLng - minLng;
  const height = maxLat - minLat;

  if (width === 0 || height === 0) return { flagged: false, reasons: [], confidence: 0 };

  const aspectRatio = height / width;
  if (aspectRatio > 4 && height > 0.01) {
    return {
      flagged: true,
      reasons: ["Route shape has extreme aspect ratio suggestive of inappropriate content"],
      confidence: 0.6,
    };
  }

  const angles: number[] = [];
  for (let i = 1; i < simplified.length - 1; i++) {
    const [x1, y1] = simplified[i - 1];
    const [x2, y2] = simplified[i];
    const [x3, y3] = simplified[i + 1];
    const angle = computeAngle(x1, y1, x2, y2, x3, y3);
    angles.push(angle);
  }

  const sharpAngles = angles.filter((a) => a < 30);
  if (sharpAngles.length >= 3) {
    return {
      flagged: true,
      reasons: ["Route contains multiple sharp angles suggestive of inappropriate patterns"],
      confidence: 0.55,
    };
  }

  return { flagged: false, reasons: [], confidence: 0 };
}

function checkHateSymbol(
  simplified: [number, number][],
): { flagged: boolean; reasons: string[]; confidence: number } {
  if (simplified.length < 6) return { flagged: false, reasons: [], confidence: 0 };

  const lngs = simplified.map((p) => p[0]);
  const lats = simplified.map((p) => p[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const width = maxLng - minLng;
  const height = maxLat - minLat;

  if (width === 0 || height === 0) return { flagged: false, reasons: [], confidence: 0 };

  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;

  const grid = createDensityGrid(simplified, 8, minLng, maxLng, minLat, maxLat);

  const symmetricScore = measureSymmetry(grid);
  if (symmetricScore > 0.7 && simplified.length > 10) {
    return {
      flagged: true,
      reasons: ["Route pattern has high symmetry suggestive of hate symbols"],
      confidence: symmetricScore * 0.8,
    };
  }

  const concentricScore = detectConcentricLoops(simplified, centerLng, centerLat);
  if (concentricScore > 0.6) {
    return {
      flagged: true,
      reasons: ["Route contains concentric loop pattern suggestive of inappropriate symbols"],
      confidence: concentricScore * 0.85,
    };
  }

  return { flagged: false, reasons: [], confidence: 0 };
}

function createDensityGrid(
  points: [number, number][],
  gridSize: number,
  minLng: number, maxLng: number,
  minLat: number, maxLat: number,
): number[][] {
  const grid: number[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(0),
  );

  const lngRange = maxLng - minLng || 0.0001;
  const latRange = maxLat - minLat || 0.0001;

  for (const [lng, lat] of points) {
    const col = Math.min(gridSize - 1, Math.floor(((lng - minLng) / lngRange) * gridSize));
    const row = Math.min(gridSize - 1, Math.floor(((lat - minLat) / latRange) * gridSize));
    grid[row][col]++;
  }

  const maxVal = Math.max(...grid.flat());
  if (maxVal > 0) {
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        grid[r][c] /= maxVal;
      }
    }
  }

  return grid;
}

function measureSymmetry(grid: number[][]): number {
  const size = grid.length;
  let symmetricCells = 0;
  let totalCells = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < Math.floor(size / 2); c++) {
      const mirror = size - 1 - c;
      const diff = Math.abs(grid[r][c] - grid[r][mirror]);
      if (diff < 0.3) symmetricCells++;
      totalCells++;
    }
  }

  if (totalCells === 0) return 0;
  const horizontalSymmetry = symmetricCells / totalCells;

  symmetricCells = 0;
  totalCells = 0;
  for (let r = 0; r < Math.floor(size / 2); r++) {
    for (let c = 0; c < size; c++) {
      const mirror = size - 1 - r;
      const diff = Math.abs(grid[r][c] - grid[mirror][c]);
      if (diff < 0.3) symmetricCells++;
      totalCells++;
    }
  }

  if (totalCells === 0) return 0;
  const verticalSymmetry = symmetricCells / totalCells;

  return Math.max(horizontalSymmetry, verticalSymmetry);
}

function detectConcentricLoops(
  points: [number, number][],
  centerLng: number,
  centerLat: number,
): number {
  if (points.length < 8) return 0;

  const distances = points.map(([lng, lat]) =>
    Math.sqrt((lng - centerLng) ** 2 + (lat - centerLat) ** 2),
  );

  const uniqueRanges = new Set<number>();
  for (const d of distances) {
    uniqueRanges.add(Math.round(d * 10000));
  }

  const ratio = uniqueRanges.size / points.length;
  if (ratio < 0.3 && points.length > 10) {
    return 0.7;
  }

  return 0;
}

function checkOffensiveText(
  simplified: [number, number][],
): { flagged: boolean; reasons: string[]; confidence: number } {
  if (simplified.length < 8) return { flagged: false, reasons: [], confidence: 0 };

  const segments = detectStraightSegments(simplified, 0.002);

  if (segments.length >= 4) {
    const angles: number[] = [];
    for (let i = 1; i < segments.length; i++) {
      const angle = angleBetweenSegments(segments[i - 1], segments[i]);
      angles.push(angle);
    }

    const rightAngles = angles.filter(
      (a) => a > 70 && a < 110,
    ).length;

    if (rightAngles >= 3 && segments.length >= 5) {
      return {
        flagged: true,
        reasons: ["Route pattern resembles letter shapes"],
        confidence: 0.6,
      };
    }
  }

  return { flagged: false, reasons: [], confidence: 0 };
}

function detectStraightSegments(
  points: [number, number][],
  tolerance: number,
): { start: [number, number]; end: [number, number] }[] {
  const segments: { start: [number, number]; end: [number, number] }[] = [];
  let startIdx = 0;

  for (let i = 2; i < points.length; i++) {
    const [x1, y1] = points[startIdx];
    const [xi, yi] = points[i];
    const maxDeviation = Math.max(
      ...points.slice(startIdx, i + 1).map(([x, y]) =>
        perpendicularDistance(x, y, x1, y1, xi, yi),
      ),
    );

    if (maxDeviation > tolerance) {
      if (i - startIdx >= 3) {
        segments.push({
          start: points[startIdx],
          end: points[i - 1],
        });
      }
      startIdx = i - 1;
    }
  }

  if (points.length - startIdx >= 3) {
    segments.push({
      start: points[startIdx],
      end: points[points.length - 1],
    });
  }

  return segments;
}

function computeAngle(
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
): number {
  const dx1 = x1 - x2;
  const dy1 = y1 - y2;
  const dx2 = x3 - x2;
  const dy2 = y3 - y2;
  const dot = dx1 * dx2 + dy1 * dy2;
  const mag1 = Math.sqrt(dx1 ** 2 + dy1 ** 2);
  const mag2 = Math.sqrt(dx2 ** 2 + dy2 ** 2);
  if (mag1 === 0 || mag2 === 0) return 180;
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function angleBetweenSegments(
  seg1: { start: [number, number]; end: [number, number] },
  seg2: { start: [number, number]; end: [number, number] },
): number {
  const [x1, y1] = seg1.end;
  const [x2, y2] = seg1.start;
  const [x3, y3] = seg2.end;
  return computeAngle(x2, y2, x1, y1, x3, y3);
}
