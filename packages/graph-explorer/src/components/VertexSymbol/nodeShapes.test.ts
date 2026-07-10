import { describe, expect, it } from "vitest";

import { resolveShapeGeometry } from "./nodeShapes";

describe("resolveShapeGeometry", () => {
  const SIZE = 96;

  describe("sharp polygons", () => {
    it.each([
      "triangle",
      "rectangle",
      "square",
      "pentagon",
      "hexagon",
      "heptagon",
      "octagon",
      "diamond",
      "star",
      "vee",
      "rhomboid",
      "tag",
      "concave-hexagon",
    ])("%s resolves to a polygon with valid points", shape => {
      const result = resolveShapeGeometry(shape, SIZE);
      expect(result.type).toBe("polygon");
      expect("points" in result && result.points.length).toBeGreaterThan(0);
      const points = (result as { points: string }).points;
      const coords = points.split(" ").map(p => p.split(",").map(Number));
      for (const [x, y] of coords) {
        expect(x).toBeGreaterThanOrEqual(-0.01);
        expect(x).toBeLessThanOrEqual(SIZE + 0.01);
        expect(y).toBeGreaterThanOrEqual(-0.01);
        expect(y).toBeLessThanOrEqual(SIZE + 0.01);
      }
    });
  });

  describe("round polygons", () => {
    it.each([
      "round-triangle",
      "round-pentagon",
      "round-hexagon",
      "round-heptagon",
      "round-octagon",
      "round-diamond",
      "round-tag",
    ])("%s resolves to a round-polygon with arcs", shape => {
      const result = resolveShapeGeometry(shape, SIZE);
      expect(result.type).toBe("round-polygon");
      const path = (result as { path: string }).path;
      expect(path).toMatch(/^M /);
      expect(path).toMatch(/ Z$/);
      expect(path).toMatch(/ A /);
    });
  });

  describe("round-rectangle", () => {
    it.each(["round-rectangle", "roundrectangle"])(
      "%s resolves to round-rectangle",
      shape => {
        const result = resolveShapeGeometry(shape, SIZE);
        expect(result.type).toBe("round-rectangle");
        const path = (result as { path: string }).path;
        expect(path).toMatch(/^M /);
        expect(path).toMatch(/ A /);
      },
    );
  });

  describe("cut-rectangle", () => {
    it("resolves with chamfered corners", () => {
      const result = resolveShapeGeometry("cut-rectangle", SIZE);
      expect(result.type).toBe("cut-rectangle");
      const path = (result as { path: string }).path;
      expect(path).toMatch(/^M /);
      expect(path).toMatch(/ Z$/);
      expect(path).not.toMatch(/ A /);
    });
  });

  describe("barrel", () => {
    it("resolves with quadratic curves", () => {
      const result = resolveShapeGeometry("barrel", SIZE);
      expect(result.type).toBe("barrel");
      const path = (result as { path: string }).path;
      expect(path).toMatch(/^M /);
      expect(path).toMatch(/ Q /);
    });
  });

  describe("ellipse", () => {
    it("resolves for ellipse and unknown shapes", () => {
      expect(resolveShapeGeometry("ellipse", SIZE).type).toBe("ellipse");
      expect(resolveShapeGeometry("unknown-shape", SIZE).type).toBe("ellipse");
    });
  });

  describe("all SHAPE_STYLES values produce geometry", () => {
    const ALL_SHAPES = [
      "rectangle",
      "roundrectangle",
      "ellipse",
      "triangle",
      "pentagon",
      "hexagon",
      "heptagon",
      "octagon",
      "star",
      "barrel",
      "diamond",
      "vee",
      "rhomboid",
      "tag",
      "round-rectangle",
      "round-triangle",
      "round-diamond",
      "round-pentagon",
      "round-hexagon",
      "round-heptagon",
      "round-octagon",
      "round-tag",
      "cut-rectangle",
      "concave-hexagon",
    ];

    it.each(ALL_SHAPES)("%s resolves without error", shape => {
      const result = resolveShapeGeometry(shape, SIZE);
      expect(result).toBeDefined();
      expect(result.type).toBeTruthy();
    });
  });
});
