import { createStore } from "jotai";
import localforage from "localforage";

import { createVertexType, type VertexType } from "@/core/entities";

import type { ShapeStyle, VertexStyleStorage } from "./graphStyles";

import { atomWithLocalForage, reconcileMapByKey } from "./atomWithLocalForage";
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

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * Vertex styles are persisted to IndexedDB via localForage. Prior to this
 * change, the six round-polygon shapes (round-triangle, round-pentagon,
 * round-hexagon, round-heptagon, round-octagon, round-tag) could be stored
 * via the shape picker (exposed in #1886). These shapes render incorrectly in
 * cytoscape at 24px and are now coerced to their non-round counterpart at
 * load time via a ReadTransform.
 *
 * DO NOT delete or weaken these tests without confirming that the shapes are
 * no longer in the wild or that cytoscape has fixed the rendering defect.
 */
describe("backward compatibility: retired round-polygon shapes in storage", () => {
  beforeEach(async () => {
    await localforage.clear();
  });

  it("coerces a stored broken shape through the full atomWithLocalForage pipeline", async () => {
    const store = createStore();
    const key = "test-vertex-styles-compat";

    const legacyData = new Map<VertexType, VertexStyleStorage>([
      [
        createVertexType("Airport"),
        {
          type: createVertexType("Airport"),
          shape: "round-hexagon" as ShapeStyle,
          color: "#ff0000",
        },
      ],
      [
        createVertexType("City"),
        {
          type: createVertexType("City"),
          shape: "ellipse" as ShapeStyle,
          color: "#00ff00",
        },
      ],
    ]);

    await localforage.setItem(key, legacyData);

    const atom = await atomWithLocalForage(
      key,
      new Map<VertexType, VertexStyleStorage>(),
      { reconcile: reconcileMapByKey, transform: transformVertexStyles },
    );

    const value = store.get(atom);

    expect(value.get(createVertexType("Airport"))).toStrictEqual({
      type: createVertexType("Airport"),
      shape: "hexagon",
      color: "#ff0000",
    });
    expect(value.get(createVertexType("City"))).toStrictEqual({
      type: createVertexType("City"),
      shape: "ellipse",
      color: "#00ff00",
    });
  });

  it("does not write back the coerced value to storage", async () => {
    const key = "test-vertex-styles-no-writeback";

    const legacyData = new Map<VertexType, VertexStyleStorage>([
      [
        createVertexType("Airport"),
        {
          type: createVertexType("Airport"),
          shape: "round-tag" as ShapeStyle,
        },
      ],
    ]);

    await localforage.setItem(key, legacyData);

    await atomWithLocalForage(key, new Map<VertexType, VertexStyleStorage>(), {
      reconcile: reconcileMapByKey,
      transform: transformVertexStyles,
    });

    const storedAfterLoad =
      await localforage.getItem<Map<VertexType, VertexStyleStorage>>(key);
    expect(storedAfterLoad!.get(createVertexType("Airport"))!.shape).toBe(
      "round-tag",
    );
  });
});

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
