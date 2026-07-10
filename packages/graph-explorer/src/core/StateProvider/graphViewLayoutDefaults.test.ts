import { describe, expect, test } from "vitest";

import {
  defaultGraphViewLayout,
  graphViewLayoutCodec,
  type GraphViewLayout,
} from "./graphViewLayoutDefaults";

describe("graphViewLayoutCodec", () => {
  test("round-trips a layout through serialize/deserialize, preserving the toggles Set", () => {
    const layout: GraphViewLayout = {
      activeSidebarItem: "filters",
      activeToggles: new Set(["graph-viewer"]),
      sidebar: { width: 321 },
      tableView: { height: 250 },
      detailsAutoOpenOnSelection: false,
    };

    const restored = graphViewLayoutCodec.deserialize(
      graphViewLayoutCodec.serialize(layout),
    );

    expect(restored).toStrictEqual(layout);
    expect(restored?.activeToggles).toBeInstanceOf(Set);
  });

  test("round-trips the default layout", () => {
    expect(
      graphViewLayoutCodec.deserialize(
        graphViewLayoutCodec.serialize(defaultGraphViewLayout),
      ),
    ).toStrictEqual(defaultGraphViewLayout);
  });

  test("treats an absent value as a miss", () => {
    expect(graphViewLayoutCodec.deserialize(null)).toBeNull();
    expect(graphViewLayoutCodec.deserialize("")).toBeNull();
  });

  test("throws on a corrupt value so the seam can discard it", () => {
    expect(() => graphViewLayoutCodec.deserialize("{ not json")).toThrow();
    expect(() => graphViewLayoutCodec.deserialize("{}")).toThrow();
  });
});
