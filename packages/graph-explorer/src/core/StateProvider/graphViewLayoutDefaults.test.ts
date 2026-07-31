import {
  type GraphViewLayout,
  transformGraphViewLayout,
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
