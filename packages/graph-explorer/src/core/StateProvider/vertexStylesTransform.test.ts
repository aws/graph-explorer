import { createStore } from "jotai";
import localforage from "localforage";

import { createVertexType, type VertexType } from "@/core/entities";

import type { ShapeStyle, VertexStyleStorage } from "./graphStyles";

import { atomWithLocalForage, reconcileMapByKey } from "./atomWithLocalForage";
import { appDefaultVertexStyle, resolveVertexStyle } from "./graphStyles";
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
 * A vertex style's colors are validated as bare optional strings on import
 * (`stylingParser.ts`), so a styling file carrying `"color": ""` is stored
 * verbatim. An empty color is not a color: it overrides the app default through
 * the plain spread in `resolveVertexStyle`, and every consumer then renders
 * nothing for it — a node with no background, an icon that falls back to black.
 * Blank colors are therefore dropped at load time, letting the default apply.
 *
 * DO NOT delete these tests without confirming no stored or importable style
 * can carry a blank color.
 */
describe("backward compatibility: blank colors in storage", () => {
  it("drops an empty color", () => {
    const styles = vertexMap([["Person", { color: "" }]]);

    const result = transformVertexStyles(styles);

    expect(result.get(createVertexType("Person"))).toStrictEqual({
      type: createVertexType("Person"),
    });
  });

  // Dropping the field rather than substituting a value is what lets the style
  // keep following the app default, so assert the resolved outcome too.
  it("resolves a dropped color to the app default", () => {
    const type = createVertexType("Person");
    const styles = vertexMap([["Person", { color: "", borderColor: "" }]]);

    const resolved = resolveVertexStyle(
      type,
      transformVertexStyles(styles).get(type),
    );

    expect(resolved.color).toBe(appDefaultVertexStyle.color);
    expect(resolved.borderColor).toBe(appDefaultVertexStyle.borderColor);
  });

  it("drops a whitespace-only border color", () => {
    const styles = vertexMap([["Person", { borderColor: "   " }]]);

    const result = transformVertexStyles(styles);

    expect(result.get(createVertexType("Person"))).toStrictEqual({
      type: createVertexType("Person"),
    });
  });

  it("keeps the other fields of an entry with a blank color", () => {
    const styles = vertexMap([
      ["Person", { color: "", shape: "hexagon", iconUrl: "lucide:user" }],
    ]);

    const result = transformVertexStyles(styles);

    expect(result.get(createVertexType("Person"))).toStrictEqual({
      type: createVertexType("Person"),
      shape: "hexagon",
      iconUrl: "lucide:user",
    });
  });

  // An empty iconUrl means "no icon", so it must survive.
  it("leaves an empty icon url alone", () => {
    const styles = vertexMap([["Person", { iconUrl: "" }]]);

    const result = transformVertexStyles(styles);

    expect(result.get(createVertexType("Person"))).toStrictEqual({
      type: createVertexType("Person"),
      iconUrl: "",
    });
  });

  it("passes usable colors through by reference", () => {
    const styles = vertexMap([
      ["Person", { color: "#FF0000", borderColor: "#00FF00" }],
    ]);

    expect(transformVertexStyles(styles)).toBe(styles);
  });
});

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
