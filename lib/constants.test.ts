import { describe, it, expect } from "vitest";
import {
  POBLACION,
  DEFAULT_CENTER,
  JEEPNEY_LINES,
  PUJ_TYPES,
  FARE,
  AVG_SPEED,
  ILIGAN_BARANGAYS,
} from "./constants";

describe("POBLACION and DEFAULT_CENTER", () => {
  it("are the same coordinate", () => {
    expect(POBLACION).toEqual(DEFAULT_CENTER);
  });

  it("have valid values", () => {
    expect(POBLACION[0]).toBeGreaterThan(124);
    expect(POBLACION[1]).toBeGreaterThan(8);
  });
});

describe("JEEPNEY_LINES", () => {
  it("contains no duplicates", () => {
    expect(new Set(JEEPNEY_LINES).size).toBe(JEEPNEY_LINES.length);
  });

  it("overlap with barangays (some lines use colloquial names)", () => {
    const matches = JEEPNEY_LINES.filter((l) =>
      (ILIGAN_BARANGAYS as readonly string[]).includes(l),
    );
    expect(matches.length).toBeGreaterThanOrEqual(8);
  });
});

describe("ILIGAN_BARANGAYS", () => {
  it("contains no duplicates", () => {
    expect(new Set(ILIGAN_BARANGAYS).size).toBe(ILIGAN_BARANGAYS.length);
  });

  it("has 44 barangays", () => {
    expect(ILIGAN_BARANGAYS.length).toBe(44);
  });
});

describe("PUJ_TYPES", () => {
  it("contains Jeep and Bus", () => {
    expect(PUJ_TYPES).toContain("Jeep");
    expect(PUJ_TYPES).toContain("Bus");
  });
});

describe("FARE", () => {
  it("has positive values", () => {
    expect(FARE.first4Km).toBeGreaterThan(0);
    expect(FARE.succeedingPerKm).toBeGreaterThan(0);
  });
});

describe("AVG_SPEED", () => {
  it("jeep is slower than bus", () => {
    expect(AVG_SPEED.jeep).toBeLessThan(AVG_SPEED.bus);
  });

  it("has positive values", () => {
    expect(AVG_SPEED.jeep).toBeGreaterThan(0);
    expect(AVG_SPEED.bus).toBeGreaterThan(0);
  });
});
