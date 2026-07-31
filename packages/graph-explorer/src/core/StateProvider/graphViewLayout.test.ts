// @vitest-environment happy-dom
import { act } from "react";

import { DbState, renderHookWithState } from "@/utils/testing";

import type { GraphViewLayout } from "./graphViewLayout";

import {
  useGraphViewSidebar,
  useTableViewSize,
  useViewToggles,
} from "./graphViewLayout";
import {
  DEFAULT_SIDEBAR_WIDTH,
  DEFAULT_TABLE_VIEW_HEIGHT,
} from "./graphViewLayoutDefaults";

const baseLayout: GraphViewLayout = {
  activeSidebarItem: "search",
  activeToggles: new Set(["graph-viewer", "table-view"]),
  sidebar: { width: DEFAULT_SIDEBAR_WIDTH },
  tableView: { height: DEFAULT_TABLE_VIEW_HEIGHT },
};

/** Seeds a graph view layout, overriding only the fields a test pins. */
function stateWithLayout(overrides: Partial<GraphViewLayout> = {}) {
  return new DbState().withGraphViewLayout({ ...baseLayout, ...overrides });
}

describe("useViewToggles", () => {
  it("should reflect both views open when seeded", () => {
    const { result } = renderHookWithState(
      () => useViewToggles(),
      stateWithLayout(),
    );

    expect(result.current.isGraphVisible).toBe(true);
    expect(result.current.isTableVisible).toBe(true);
  });

  it("should toggle graph view", () => {
    const { result } = renderHookWithState(
      () => useViewToggles(),
      stateWithLayout(),
    );

    act(() => result.current.toggleGraphVisibility());

    expect(result.current.isGraphVisible).toBe(false);
    expect(result.current.isTableVisible).toBe(true);

    act(() => result.current.toggleGraphVisibility());

    expect(result.current.isGraphVisible).toBe(true);
    expect(result.current.isTableVisible).toBe(true);
  });

  it("should toggle table view", () => {
    const { result } = renderHookWithState(
      () => useViewToggles(),
      stateWithLayout(),
    );

    act(() => result.current.toggleTableVisibility());

    expect(result.current.isGraphVisible).toBe(true);
    expect(result.current.isTableVisible).toBe(false);

    act(() => result.current.toggleTableVisibility());

    expect(result.current.isGraphVisible).toBe(true);
    expect(result.current.isTableVisible).toBe(true);
  });
});

describe("useGraphViewSidebar", () => {
  it("should reflect the seeded open sidebar", () => {
    const { result } = renderHookWithState(
      () => useGraphViewSidebar(),
      stateWithLayout(),
    );

    expect(result.current.isSidebarOpen).toBe(true);
  });

  it("should change to the given sidebar item", () => {
    const { result } = renderHookWithState(
      () => useGraphViewSidebar(),
      stateWithLayout(),
    );

    act(() => result.current.toggleSidebar("details"));
    expect(result.current.isSidebarOpen).toBe(true);
    expect(result.current.activeSidebarItem).toBe("details");

    act(() => result.current.toggleSidebar("search"));
    expect(result.current.isSidebarOpen).toBe(true);
    expect(result.current.activeSidebarItem).toBe("search");
  });

  it("should close the sidebar if toggling to the same item", () => {
    const { result } = renderHookWithState(
      () => useGraphViewSidebar(),
      stateWithLayout({ activeSidebarItem: "details" }),
    );

    act(() => result.current.toggleSidebar("details"));

    expect(result.current.isSidebarOpen).toBe(false);
    expect(result.current.activeSidebarItem).toBeNull();
  });

  it("should close the sidebar", () => {
    const { result } = renderHookWithState(
      () => useGraphViewSidebar(),
      stateWithLayout(),
    );

    act(() => result.current.closeSidebar());

    expect(result.current.isSidebarOpen).toBe(false);
  });

  it("should show namespaces when the connection is a SPARQL connection", () => {
    const state = stateWithLayout({ activeSidebarItem: "namespaces" });
    state.activeConfig.connection!.queryEngine = "sparql";

    const { result } = renderHookWithState(() => useGraphViewSidebar(), state);

    expect(result.current.isSidebarOpen).toBe(true);
    expect(result.current.activeSidebarItem).toBe("namespaces");
    expect(result.current.shouldShowNamespaces).toBe(true);
  });

  it("should be closed when active item is namespaces but connection is not RDF", () => {
    const state = stateWithLayout({ activeSidebarItem: "namespaces" });
    state.activeConfig.connection!.queryEngine = "gremlin";

    const { result } = renderHookWithState(() => useGraphViewSidebar(), state);

    expect(result.current.isSidebarOpen).toBe(false);
    expect(result.current.activeSidebarItem).toBeNull();
    expect(result.current.shouldShowNamespaces).toBe(false);
  });

  it("should return persisted sidebar width", () => {
    const { result } = renderHookWithState(
      () => useGraphViewSidebar(),
      stateWithLayout({ sidebar: { width: 500 } }),
    );

    expect(result.current.sidebarWidth).toBe(500);
  });

  it("should adjust sidebar width by delta", () => {
    const { result } = renderHookWithState(
      () => useGraphViewSidebar(),
      stateWithLayout(),
    );

    act(() => result.current.setSidebarWidth(100));
    expect(result.current.sidebarWidth).toBe(DEFAULT_SIDEBAR_WIDTH + 100);

    act(() => result.current.setSidebarWidth(-200));
    expect(result.current.sidebarWidth).toBe(DEFAULT_SIDEBAR_WIDTH - 100);
  });

  it("should auto-open details when detailsAutoOpenOnSelection is true", () => {
    const { result } = renderHookWithState(
      () => useGraphViewSidebar(),
      stateWithLayout({ detailsAutoOpenOnSelection: true }),
    );

    act(() => result.current.autoOpenDetails());

    expect(result.current.activeSidebarItem).toBe("details");
  });

  it("should not auto-open details when detailsAutoOpenOnSelection is false", () => {
    const { result } = renderHookWithState(
      () => useGraphViewSidebar(),
      stateWithLayout({ detailsAutoOpenOnSelection: false }),
    );

    act(() => result.current.autoOpenDetails());

    expect(result.current.activeSidebarItem).toBe("search");
  });

  it("should auto-open details when detailsAutoOpenOnSelection is undefined (legacy data)", () => {
    const { result } = renderHookWithState(
      () => useGraphViewSidebar(),
      stateWithLayout(),
    );

    act(() => result.current.autoOpenDetails());

    expect(result.current.activeSidebarItem).toBe("details");
  });

  it("should toggle detailsAutoOpenOnSelection from true to false", () => {
    const { result } = renderHookWithState(
      () => useGraphViewSidebar(),
      stateWithLayout({ detailsAutoOpenOnSelection: true }),
    );

    expect(result.current.detailsAutoOpenOnSelection).toBe(true);

    act(() => result.current.toggleDetailsAutoOpen());

    expect(result.current.detailsAutoOpenOnSelection).toBe(false);
  });

  it("should toggle detailsAutoOpenOnSelection from false to true", () => {
    const { result } = renderHookWithState(
      () => useGraphViewSidebar(),
      stateWithLayout({ detailsAutoOpenOnSelection: false }),
    );

    act(() => result.current.toggleDetailsAutoOpen());

    expect(result.current.detailsAutoOpenOnSelection).toBe(true);
  });

  it("should toggle detailsAutoOpenOnSelection from undefined (enabled) to false", () => {
    const { result } = renderHookWithState(
      () => useGraphViewSidebar(),
      stateWithLayout(),
    );

    // The button shows enabled (undefined reads as `?? true`), so toggling
    // must turn it off, not flip `!undefined` to true.
    act(() => result.current.toggleDetailsAutoOpen());

    expect(result.current.detailsAutoOpenOnSelection).toBe(false);
  });
});

describe("useTableViewSize", () => {
  it("should return 100% when graph viewer is hidden", () => {
    const { result } = renderHookWithState(
      () => ({
        tableView: useTableViewSize(),
        toggles: useViewToggles(),
      }),
      stateWithLayout(),
    );

    act(() => result.current.toggles.toggleGraphVisibility());

    expect(result.current.tableView[0]).toBe("100%");
  });

  it("should adjust height by delta", () => {
    const { result } = renderHookWithState(
      () => useTableViewSize(),
      stateWithLayout(),
    );

    act(() => result.current[1](50));
    expect(result.current[0]).toBe(DEFAULT_TABLE_VIEW_HEIGHT + 50);

    act(() => result.current[1](-100));
    expect(result.current[0]).toBe(DEFAULT_TABLE_VIEW_HEIGHT - 50);
  });
});

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * GraphViewLayout is persisted to IndexedDB via localforage. Older versions
 * stored the layout with a flat `sidebar?: { width: number }` field (optional)
 * and used `SidebarItems` type name (now `GraphViewSidebarItem`). Previously
 * persisted data may not have the `sidebar` field at all. These tests verify
 * that the hooks still work correctly with the old shape.
 *
 * These seed the legacy shape verbatim via `withGraphViewLayout` (not the
 * `stateWithLayout` spread helper, which would re-add the absent `sidebar`
 * field and mask the fallback under test).
 *
 * DO NOT delete or weaken these tests without confirming that all persisted
 * data has been migrated or that the old shape is no longer in the wild.
 */
describe("backward compatibility: missing sidebar field", () => {
  it("should fall back to default width when sidebar field is absent", () => {
    const legacyLayout = {
      activeSidebarItem: "search",
      activeToggles: new Set(["graph-viewer", "table-view"]),
      detailsAutoOpenOnSelection: true,
    } as GraphViewLayout;

    const { result } = renderHookWithState(
      () => useGraphViewSidebar(),
      new DbState().withGraphViewLayout(legacyLayout),
    );

    expect(result.current.sidebarWidth).toBe(DEFAULT_SIDEBAR_WIDTH);
    expect(result.current.isSidebarOpen).toBe(true);
  });

  it("should adjust width by delta even when sidebar field was absent", () => {
    const legacyLayout = {
      activeSidebarItem: "search",
      activeToggles: new Set(),
    } as GraphViewLayout;

    const { result } = renderHookWithState(
      () => useGraphViewSidebar(),
      new DbState().withGraphViewLayout(legacyLayout),
    );

    act(() => result.current.setSidebarWidth(50));
    expect(result.current.sidebarWidth).toBe(DEFAULT_SIDEBAR_WIDTH + 50);
  });
});
