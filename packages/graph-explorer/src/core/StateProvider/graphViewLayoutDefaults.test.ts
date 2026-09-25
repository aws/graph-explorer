import { z } from "zod";

import {
  defaultGraphViewLayout,
  graphViewLayoutCodec,
  transformGraphViewLayout,
  type GraphViewLayout,
} from "./graphViewLayoutDefaults";

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * GraphViewLayout is persisted to IndexedDB via localforage. Older versions
 * stored the styling sidebar as two separate panels, so `activeSidebarItem`
 * could be "nodes-styling" or "edges-styling". Those were merged into a single
 * "styles" panel, but previously persisted layouts may still hold the old
 * values. transformGraphViewLayout normalizes them on read so the sidebar isn't
 * stuck pointing at a panel that no longer exists.
 *
 * DO NOT delete or weaken these tests without confirming that all persisted
 * data has been transformed or that the old values are no longer in the wild.
 */
describe("transformGraphViewLayout backward compatibility", () => {
  it("maps legacy nodes-styling to styles", () => {
    const legacy = {
      activeSidebarItem: "nodes-styling",
      sidebar: { width: 400 },
      activeToggles: new Set(["graph-viewer"]),
    } as unknown as GraphViewLayout;

    expect(transformGraphViewLayout(legacy).activeSidebarItem).toBe("styles");
  });

  it("maps legacy edges-styling to styles", () => {
    const legacy = {
      activeSidebarItem: "edges-styling",
      sidebar: { width: 400 },
      activeToggles: new Set(["graph-viewer"]),
    } as unknown as GraphViewLayout;

    expect(transformGraphViewLayout(legacy).activeSidebarItem).toBe("styles");
  });

  it("leaves a current sidebar item untouched", () => {
    const layout: GraphViewLayout = {
      activeSidebarItem: "search",
      sidebar: { width: 400 },
      activeToggles: new Set(["graph-viewer"]),
    };

    expect(transformGraphViewLayout(layout)).toBe(layout);
  });

  it("leaves a null sidebar item untouched", () => {
    const layout: GraphViewLayout = {
      activeSidebarItem: null,
      sidebar: { width: 400 },
      activeToggles: new Set(["graph-viewer"]),
    };

    expect(transformGraphViewLayout(layout)).toBe(layout);
  });
});

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
    // Asserted by type, not instance: these errors come from JSON.parse and
    // zod, whose messages shift between engine and library versions.
    expect(() => graphViewLayoutCodec.deserialize("{ not json")).toThrow(
      SyntaxError,
    );
    expect(() => graphViewLayoutCodec.deserialize("{}")).toThrow(z.ZodError);
  });
});
