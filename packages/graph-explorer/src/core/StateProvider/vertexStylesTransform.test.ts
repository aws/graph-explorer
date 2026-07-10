import { createVertexType, type VertexType } from "@/core/entities";

import type { ShapeStyle, VertexStyleStorage } from "./graphStyles";

import {
  coerceBrokenShape,
  transformVertexStyles,
} from "./vertexStylesTransform";

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

describe("coerceBrokenShape", () => {
  it.each([
    ["round-triangle", "triangle"],
    ["round-pentagon", "pentagon"],
    ["round-hexagon", "hexagon"],
    ["round-heptagon", "heptagon"],
    ["round-octagon", "octagon"],
    ["round-tag", "tag"],
  ] as [ShapeStyle, ShapeStyle][])("coerces %s to %s", (broken, expected) => {
    expect(coerceBrokenShape(broken)).toBe(expected);
  });

  it.each([
    "ellipse",
    "rectangle",
    "roundrectangle",
    "round-rectangle",
    "round-diamond",
    "star",
    "diamond",
    "triangle",
    "tag",
  ] as ShapeStyle[])("passes %s through unchanged", shape => {
    expect(coerceBrokenShape(shape)).toBe(shape);
  });
});

describe("transformVertexStyles", () => {
  it("returns the same reference when no shapes need coercion", () => {
    const styles = vertexMap([
      ["A", { shape: "ellipse" }],
      ["B", { color: "#fff" }],
    ]);

    expect(transformVertexStyles(styles)).toBe(styles);
  });

  it.each([
    ["round-triangle", "triangle"],
    ["round-pentagon", "pentagon"],
    ["round-hexagon", "hexagon"],
    ["round-heptagon", "heptagon"],
    ["round-octagon", "octagon"],
    ["round-tag", "tag"],
  ] as [ShapeStyle, ShapeStyle][])(
    "coerces %s to %s in a stored map",
    (broken, expected) => {
      const styles = vertexMap([["X", { shape: broken }]]);
      const result = transformVertexStyles(styles);
      expect(result.get(createVertexType("X"))!.shape).toBe(expected);
    },
  );

  it("does not coerce round-rectangle or round-diamond", () => {
    const styles = vertexMap([
      ["A", { shape: "round-rectangle" }],
      ["B", { shape: "round-diamond" }],
    ]);

    expect(transformVertexStyles(styles)).toBe(styles);
  });

  it("preserves other fields on a coerced entry", () => {
    const styles = vertexMap([
      ["A", { shape: "round-tag", color: "#ff0000", borderWidth: 2 }],
    ]);

    const result = transformVertexStyles(styles);
    const entry = result.get(createVertexType("A"))!;
    expect(entry.shape).toBe("tag");
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
