import { describe, expect, it, test } from "vitest";
import { z } from "zod";

import {
  DEFAULT_SIDEBAR_WIDTH,
  defaultGraphViewLayout,
  graphViewLayoutCodec,
  type GraphViewLayout,
} from "./graphViewLayoutDefaults";

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * GraphViewLayout is persisted to IndexedDB via localforage. Older versions
 * stored the styling sidebar as two separate panels, so `activeSidebarItem`
 * could be "nodes-styling" or "edges-styling". Those were merged into a single
 * "styles" panel, but previously persisted layouts may still hold the old
 * values. Older versions also left `sidebar` unset until the user first resized
 * it. `parseStored` normalizes both when it reads the shared breadcrumb, so an
 * upgrading user keeps their layout instead of having it discarded as corrupt.
 *
 * DO NOT delete or weaken these tests without confirming that all persisted
 * data has been transformed or that the old values are no longer in the wild.
 */
describe("backward compatibility: graphViewLayoutCodec.parseStored", () => {
  it.each(["nodes-styling", "edges-styling"])(
    "maps legacy %s to styles",
    activeSidebarItem => {
      const legacy = {
        activeSidebarItem,
        sidebar: { width: 400 },
        activeToggles: new Set(["graph-viewer"]),
      };

      expect(graphViewLayoutCodec.parseStored(legacy).activeSidebarItem).toBe(
        "styles",
      );
    },
  );

  it("fills a missing sidebar with the default width", () => {
    const legacy = {
      activeSidebarItem: "search",
      activeToggles: new Set(["graph-viewer"]),
    };

    expect(graphViewLayoutCodec.parseStored(legacy)).toStrictEqual({
      activeSidebarItem: "search",
      activeToggles: new Set(["graph-viewer"]),
      sidebar: { width: DEFAULT_SIDEBAR_WIDTH },
    });
  });

  it("keeps a current layout unchanged", () => {
    const layout: GraphViewLayout = {
      activeSidebarItem: null,
      sidebar: { width: 512 },
      activeToggles: new Set(["table-view"]),
      tableView: { height: 250 },
      detailsAutoOpenOnSelection: false,
    };

    expect(graphViewLayoutCodec.parseStored(layout)).toStrictEqual(layout);
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
    // Asserted by type, not by message: these errors come from JSON.parse and
    // zod, whose messages shift between engine and library versions.
    expect(() => graphViewLayoutCodec.deserialize("{ not json")).toThrow(
      SyntaxError,
    );
    expect(() => graphViewLayoutCodec.deserialize("{}")).toThrow(z.ZodError);
  });

  test("throws on a corrupt stored value so the seam can discard it", () => {
    expect(() =>
      graphViewLayoutCodec.parseStored({ activeSidebarItem: "filters" }),
    ).toThrow(z.ZodError);
  });
});
