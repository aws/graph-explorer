import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { createEdgeType, type EdgeType } from "@/core/entities";
import { logger } from "@/utils";

import type { EdgeStyleStorage } from "./graphStyles";

import { transformEdgeStyles } from "./edgeStylesTransform";

function edgeMap(
  entries: Array<[string, Omit<EdgeStyleStorage, "type">]>,
): Map<EdgeType, EdgeStyleStorage> {
  return new Map(
    entries.map(([name, fields]) => {
      const type = createEdgeType(name);
      return [type, { ...fields, type }];
    }),
  );
}

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * A hand-edited or restored file could have stored a value that is not a
 * color; it is dropped at load and the app default applies.
 *
 * DO NOT delete or weaken these tests without confirming that no stored edge
 * style can hold a value that is not a color.
 */
describe("backward compatibility: edge colors in storage", () => {
  beforeEach(() => {
    vi.spyOn(logger, "warn").mockImplementation(() => {});
  });

  it.each([
    ["labelColor", "url(http://other.example/x.svg#p)"],
    ["labelBorderColor", "var(--x)"],
    ["lineColor", "not a color"],
    ["lineColor", "#fff\uD800"],
  ] as const)("drops an unusable %s of %j", (field, value) => {
    const styles = edgeMap([["knows", { [field]: value, lineThickness: 3 }]]);

    const stored = transformEdgeStyles(styles).get(createEdgeType("knows"));

    expect(stored).toStrictEqual({
      type: createEdgeType("knows"),
      lineThickness: 3,
    });
  });

  it("drops a blank color", () => {
    const styles = edgeMap([["knows", { lineColor: "" }]]);

    expect(
      transformEdgeStyles(styles).get(createEdgeType("knows")),
    ).toStrictEqual({ type: createEdgeType("knows") });
  });

  it("passes usable colors through by reference", () => {
    const styles = edgeMap([
      ["knows", { lineColor: "#b3b3b3", labelColor: "rgb(1, 2, 3)" }],
    ]);

    expect(transformEdgeStyles(styles)).toBe(styles);
  });

  it("leaves other edge types alone", () => {
    const styles = edgeMap([
      ["knows", { lineColor: "var(--x)" }],
      ["likes", { lineColor: "#FF0000" }],
    ]);

    const result = transformEdgeStyles(styles);

    expect(result.get(createEdgeType("likes"))).toBe(
      styles.get(createEdgeType("likes")),
    );
  });
});
