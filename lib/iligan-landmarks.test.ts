import { describe, it, expect } from "vitest";
import { ILIGAN_LANDMARKS } from "./iligan-landmarks";

describe("ILIGAN_LANDMARKS", () => {
  it("all landmarks have unique IDs", () => {
    const ids = ILIGAN_LANDMARKS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all coordinates are within Iligan City bounds", () => {
    for (const lm of ILIGAN_LANDMARKS) {
      expect(lm.lat).toBeGreaterThan(8.0);
      expect(lm.lat).toBeLessThan(8.5);
      expect(lm.lng).toBeGreaterThan(124.0);
      expect(lm.lng).toBeLessThan(124.5);
    }
  });

  it("all categories are valid", () => {
    const valid = [
      "terminal",
      "church",
      "mall",
      "school",
      "hospital",
      "market",
      "park",
      "landmark",
    ];
    for (const lm of ILIGAN_LANDMARKS) {
      expect(valid).toContain(lm.category);
    }
  });

  it("all landmarks have names", () => {
    for (const lm of ILIGAN_LANDMARKS) {
      expect(lm.name.length).toBeGreaterThan(0);
    }
  });
});
