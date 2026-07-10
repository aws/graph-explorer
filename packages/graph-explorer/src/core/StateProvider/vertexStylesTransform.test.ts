import { createVertexType, type VertexType } from "@/core/entities";

import type { ShapeStyle, VertexStyleStorage } from "./graphStyles";

import { transformVertexStyles } from "./vertexStylesTransform";

function vertexMap(
  entries: Array<[string, Omit<VertexStyleStorage, "type">]>,
): Map<VertexType, VertexStyleStorage> {
  return new Map(
    entries.map(([name, fields]) => {
      const type = createVertexType(name);
      return [type, { ...fields, type }];
    }),
  );
}

describe("transformVertexStyles", () => {
  it("returns the same reference when no shapes need coercion", () => {
    const styles = vertexMap([
      ["A", { shape: "ellipse" }],
      ["B", { color: "#fff" }],
    ]);

    expect(transformVertexStyles(styles)).toBe(styles);
  });

  it("coerces each broken round-polygon shape to round-rectangle", () => {
    const broken: ShapeStyle[] = [
      "round-triangle",
      "round-pentagon",
      "round-hexagon",
      "round-heptagon",
      "round-octagon",
      "round-tag",
    ];

    for (const shape of broken) {
      const styles = vertexMap([["X", { shape }]]);
      const result = transformVertexStyles(styles);
      expect(result.get(createVertexType("X"))!.shape).toBe("roundrectangle");
    }
  });

  it("does not coerce roundrectangle, round-rectangle, or round-diamond", () => {
    const styles = vertexMap([
      ["A", { shape: "roundrectangle" }],
      ["B", { shape: "round-rectangle" }],
      ["C", { shape: "round-diamond" }],
    ]);

    expect(transformVertexStyles(styles)).toBe(styles);
  });

  it("preserves other fields on a coerced entry", () => {
    const styles = vertexMap([
      ["A", { shape: "round-tag", color: "#ff0000", borderWidth: 2 }],
    ]);

    const result = transformVertexStyles(styles);
    const entry = result.get(createVertexType("A"))!;
    expect(entry.shape).toBe("roundrectangle");
    expect(entry.color).toBe("#ff0000");
    expect(entry.borderWidth).toBe(2);
  });

  it("handles an empty map", () => {
    const styles = vertexMap([]);
    expect(transformVertexStyles(styles)).toBe(styles);
  });

  it("passes through entries without a shape field", () => {
    const styles = vertexMap([["A", { color: "#abc" }]]);
    expect(transformVertexStyles(styles)).toBe(styles);
  });
});
