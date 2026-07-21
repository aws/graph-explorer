import { describe, expect, it } from "vitest";

import { ARROW_STYLES, type ArrowStyle } from "@/core";

import { getArrowWidth, resolveArrowGeometry } from "./arrowShapes";

/** Every arrow style except "none", which resolves to null. */
const DRAWN_STYLES = ARROW_STYLES.filter(
  (style): style is ArrowStyle => style !== "none",
);

describe("getArrowWidth", () => {
  it("floors at 29 for thin edges", () => {
    expect(getArrowWidth(0)).toBe(29);
    expect(getArrowWidth(1)).toBe(29);
  });

  it("grows above the floor for thick edges", () => {
    const thin = getArrowWidth(2);
    const thick = getArrowWidth(20);
    expect(thick).toBeGreaterThan(thin);
    expect(thin).toBeGreaterThanOrEqual(29);
  });
});

describe("resolveArrowGeometry", () => {
  const UNIT = 58; // getArrowWidth(2) * DEFAULT_ZOOM ≈ real usage
  const LINE_WIDTH = 4;

  it("returns null for none", () => {
    expect(resolveArrowGeometry("none", UNIT, LINE_WIDTH)).toBeNull();
  });

  it.each(DRAWN_STYLES)(
    "%s resolves to primitives with a finite bbox",
    style => {
      const result = resolveArrowGeometry(style, UNIT, LINE_WIDTH);
      expect(result).not.toBeNull();
      const geometry = result!;
      expect(geometry.primitives.length).toBeGreaterThan(0);

      const { minX, minY, maxX, maxY } = geometry.bbox;
      for (const value of [minX, minY, maxX, maxY]) {
        expect(Number.isFinite(value)).toBe(true);
      }
      expect(maxX).toBeGreaterThanOrEqual(minX);
      expect(maxY).toBeGreaterThanOrEqual(minY);
      expect(Number.isFinite(geometry.spacing)).toBe(true);
      expect(Number.isFinite(geometry.gap)).toBe(true);
    },
  );

  it.each(DRAWN_STYLES)("%s anchors its tip at the frame origin", style => {
    // The tip sits at cytoscape-frame origin, so the bbox must contain (0,0):
    // the body extends into negative X and the tip is the rightmost point (or
    // the shape straddles the origin, as with circle/tee).
    const { bbox } = resolveArrowGeometry(style, UNIT, LINE_WIDTH)!;
    expect(bbox.minX).toBeLessThanOrEqual(0);
    expect(bbox.maxX).toBeGreaterThanOrEqual(0);
    expect(bbox.minY).toBeLessThanOrEqual(0);
    expect(bbox.maxY).toBeGreaterThanOrEqual(0);
  });

  describe("per-shape spacing and gap (verbatim from cytoscape)", () => {
    const standardGap = LINE_WIDTH * 2;

    it("triangle uses zero spacing and standard gap", () => {
      const { spacing, gap } = resolveArrowGeometry(
        "triangle",
        UNIT,
        LINE_WIDTH,
      )!;
      expect(spacing).toBe(0);
      expect(gap).toBe(standardGap);
    });

    it("vee gap is standardGap * 0.525", () => {
      const { gap } = resolveArrowGeometry("vee", UNIT, LINE_WIDTH)!;
      expect(gap).toBeCloseTo(standardGap * 0.525);
    });

    it("triangle-backcurve gap is standardGap * 0.8", () => {
      const { gap } = resolveArrowGeometry(
        "triangle-backcurve",
        UNIT,
        LINE_WIDTH,
      )!;
      expect(gap).toBeCloseTo(standardGap * 0.8);
    });

    it("diamond gap is the line width", () => {
      const { gap } = resolveArrowGeometry("diamond", UNIT, LINE_WIDTH)!;
      expect(gap).toBe(LINE_WIDTH);
    });

    it("tee uses a literal 1px spacing and gap", () => {
      const { spacing, gap } = resolveArrowGeometry("tee", UNIT, LINE_WIDTH)!;
      expect(spacing).toBe(1);
      expect(gap).toBe(1);
    });

    it("circle spacing is unit * radius (0.15)", () => {
      const { spacing } = resolveArrowGeometry("circle", UNIT, LINE_WIDTH)!;
      expect(spacing).toBeCloseTo(UNIT * 0.15);
    });

    it("circle-triangle spacing is unit * radius (0.15)", () => {
      const { spacing } = resolveArrowGeometry(
        "circle-triangle",
        UNIT,
        LINE_WIDTH,
      )!;
      expect(spacing).toBeCloseTo(UNIT * 0.15);
    });
  });

  describe("compound shapes emit multiple primitives", () => {
    it.each(["triangle-tee", "triangle-cross", "circle-triangle"] as const)(
      "%s emits two primitives",
      style => {
        const { primitives } = resolveArrowGeometry(style, UNIT, LINE_WIDTH)!;
        expect(primitives.length).toBe(2);
      },
    );
  });

  it("triangle-backcurve emits a path primitive", () => {
    const { primitives } = resolveArrowGeometry(
      "triangle-backcurve",
      UNIT,
      LINE_WIDTH,
    )!;
    expect(primitives[0].kind).toBe("path");
  });

  it("circle emits a circle primitive centered at the origin", () => {
    const { primitives } = resolveArrowGeometry("circle", UNIT, LINE_WIDTH)!;
    const [primitive] = primitives;
    expect.assert(primitive.kind === "circle");
    expect(primitive.cx).toBe(0);
    expect(primitive.cy).toBe(0);
    expect(primitive.r).toBeCloseTo(UNIT * 0.15);
  });

  it("scales geometry with the unit", () => {
    const small = resolveArrowGeometry("triangle", 10, LINE_WIDTH)!;
    const large = resolveArrowGeometry("triangle", 100, LINE_WIDTH)!;
    const smallWidth = small.bbox.maxX - small.bbox.minX;
    const largeWidth = large.bbox.maxX - large.bbox.minX;
    expect(largeWidth).toBeCloseTo(smallWidth * 10);
  });
});
