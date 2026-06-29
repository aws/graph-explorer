// @vitest-environment happy-dom
import { act } from "react";

import {
  DbState,
  renderHookWithJotai,
  renderHookWithState,
} from "@/utils/testing";

import type { GraphViewLayout } from "./graphViewLayout";

import {
  useGraphViewSidebar,
  useTableViewSize,
  useViewToggles,
} from "./graphViewLayout";
import { graphViewLayoutAtom } from "./storageAtoms";

describe("useViewToggles", () => {
  it("should default to both views open", () => {
    const { result } = renderHookWithState(() => useViewToggles());

    expect(result.current.isGraphVisible).toBe(true);
    expect(result.current.isTableVisible).toBe(true);
  });

  it("should toggle graph view", () => {
    const { result } = renderHookWithState(() => useViewToggles());

    act(() => result.current.toggleGraphVisibility());

    expect(result.current.isGraphVisible).toBe(false);
    expect(result.current.isTableVisible).toBe(true);

    act(() => result.current.toggleGraphVisibility());

    expect(result.current.isGraphVisible).toBe(true);
    expect(result.current.isTableVisible).toBe(true);
  });

  it("should toggle table view", () => {
    const { result } = renderHookWithState(() => useViewToggles());

    act(() => result.current.toggleTableVisibility());

    expect(result.current.isGraphVisible).toBe(true);
    expect(result.current.isTableVisible).toBe(false);

    act(() => result.current.toggleTableVisibility());

    expect(result.current.isGraphVisible).toBe(true);
    expect(result.current.isTableVisible).toBe(true);
  });
});

describe("useGraphViewSidebar", () => {
  it("should default to sidebar open", () => {
    const { result } = renderHookWithJotai(() => useGraphViewSidebar());

    expect(result.current.isSidebarOpen).toBe(true);
  });

  it("should change to the given sidebar item", () => {
    const { result } = renderHookWithJotai(() => useGraphViewSidebar());

    act(() => result.current.toggleSidebar("details"));
    expect(result.current.isSidebarOpen).toBe(true);
    expect(result.current.activeSidebarItem).toBe("details");

    act(() => result.current.toggleSidebar("search"));
    expect(result.current.isSidebarOpen).toBe(true);
    expect(result.current.activeSidebarItem).toBe("search");
  });

  it("should close the sidebar if toggling to the same item", () => {
    const { result } = renderHookWithJotai(
      () => useGraphViewSidebar(),
      store =>
        store.set(graphViewLayoutAtom, {
          activeSidebarItem: "details",
          activeToggles: new Set(),
          sidebar: { width: 400 },
        } satisfies GraphViewLayout),
    );

    act(() => result.current.toggleSidebar("details"));

    expect(result.current.isSidebarOpen).toBe(false);
    expect(result.current.activeSidebarItem).toBeNull();
  });

  it("should close the sidebar", () => {
    const { result } = renderHookWithJotai(() => useGraphViewSidebar());

    act(() => result.current.closeSidebar());

    expect(result.current.isSidebarOpen).toBe(false);
  });

  it("should show namespaces when the connection is a SPARQL connection", () => {
    const dbState = new DbState();
    dbState.activeConfig.connection!.queryEngine = "sparql";

    const { result } = renderHookWithJotai(
      () => useGraphViewSidebar(),
      store => {
        dbState.applyTo(store);
        store.set(graphViewLayoutAtom, {
          activeSidebarItem: "namespaces",
          activeToggles: new Set(),
          sidebar: { width: 400 },
        } satisfies GraphViewLayout);
      },
    );

    expect(result.current.isSidebarOpen).toBe(true);
    expect(result.current.activeSidebarItem).toBe("namespaces");
    expect(result.current.shouldShowNamespaces).toBe(true);
  });

  it("should be closed when active item is namespaces but connection is not RDF", () => {
    const dbState = new DbState();
    dbState.activeConfig.connection!.queryEngine = "gremlin";

    const { result } = renderHookWithJotai(
      () => useGraphViewSidebar(),
      store => {
        dbState.applyTo(store);
        store.set(graphViewLayoutAtom, {
          activeSidebarItem: "namespaces",
          activeToggles: new Set(),
          sidebar: { width: 400 },
        } satisfies GraphViewLayout);
      },
    );

    expect(result.current.isSidebarOpen).toBe(false);
    expect(result.current.activeSidebarItem).toBeNull();
    expect(result.current.shouldShowNamespaces).toBe(false);
  });

  it("should return persisted sidebar width", () => {
    const { result } = renderHookWithJotai(
      () => useGraphViewSidebar(),
      store =>
        store.set(graphViewLayoutAtom, {
          activeSidebarItem: "search",
          activeToggles: new Set(),
          sidebar: { width: 500 },
        } satisfies GraphViewLayout),
    );

    expect(result.current.sidebarWidth).toBe(500);
  });

  it("should adjust sidebar width by delta", () => {
    const { result } = renderHookWithJotai(() => useGraphViewSidebar());

    act(() => result.current.setSidebarWidth(100));
    expect(result.current.sidebarWidth).toBe(500);

    act(() => result.current.setSidebarWidth(-200));
    expect(result.current.sidebarWidth).toBe(300);
  });

  it("should auto-open details when detailsAutoOpenOnSelection is true", () => {
    const { result } = renderHookWithJotai(
      () => useGraphViewSidebar(),
      store =>
        store.set(graphViewLayoutAtom, {
          activeSidebarItem: "search",
          activeToggles: new Set(),
          sidebar: { width: 400 },
          detailsAutoOpenOnSelection: true,
        } satisfies GraphViewLayout),
    );

    act(() => result.current.autoOpenDetails());

    expect(result.current.activeSidebarItem).toBe("details");
  });

  it("should not auto-open details when detailsAutoOpenOnSelection is false", () => {
    const { result } = renderHookWithJotai(
      () => useGraphViewSidebar(),
      store =>
        store.set(graphViewLayoutAtom, {
          activeSidebarItem: "search",
          activeToggles: new Set(),
          sidebar: { width: 400 },
          detailsAutoOpenOnSelection: false,
        } satisfies GraphViewLayout),
    );

    act(() => result.current.autoOpenDetails());

    expect(result.current.activeSidebarItem).toBe("search");
  });

  it("should auto-open details when detailsAutoOpenOnSelection is undefined (legacy data)", () => {
    const { result } = renderHookWithJotai(
      () => useGraphViewSidebar(),
      store =>
        store.set(graphViewLayoutAtom, {
          activeSidebarItem: "search",
          activeToggles: new Set(),
          sidebar: { width: 400 },
        } satisfies GraphViewLayout),
    );

    act(() => result.current.autoOpenDetails());

    expect(result.current.activeSidebarItem).toBe("details");
  });

  it("should report detailsAutoOpenOnSelection as enabled by default", () => {
    const { result } = renderHookWithJotai(() => useGraphViewSidebar());

    expect(result.current.detailsAutoOpenOnSelection).toBe(true);
  });

  it("should toggle detailsAutoOpenOnSelection from true to false", () => {
    const { result } = renderHookWithJotai(
      () => useGraphViewSidebar(),
      store =>
        store.set(graphViewLayoutAtom, {
          activeSidebarItem: "search",
          activeToggles: new Set(),
          sidebar: { width: 400 },
          detailsAutoOpenOnSelection: true,
        } satisfies GraphViewLayout),
    );

    act(() => result.current.toggleDetailsAutoOpen());

    expect(result.current.detailsAutoOpenOnSelection).toBe(false);
  });

  it("should toggle detailsAutoOpenOnSelection from false to true", () => {
    const { result } = renderHookWithJotai(
      () => useGraphViewSidebar(),
      store =>
        store.set(graphViewLayoutAtom, {
          activeSidebarItem: "search",
          activeToggles: new Set(),
          sidebar: { width: 400 },
          detailsAutoOpenOnSelection: false,
        } satisfies GraphViewLayout),
    );

    act(() => result.current.toggleDetailsAutoOpen());

    expect(result.current.detailsAutoOpenOnSelection).toBe(true);
  });

  it("should toggle detailsAutoOpenOnSelection from undefined (enabled) to false", () => {
    const { result } = renderHookWithJotai(
      () => useGraphViewSidebar(),
      store =>
        store.set(graphViewLayoutAtom, {
          activeSidebarItem: "search",
          activeToggles: new Set(),
          sidebar: { width: 400 },
        } satisfies GraphViewLayout),
    );

    // The button shows enabled (undefined reads as `?? true`), so toggling
    // must turn it off, not flip `!undefined` to true.
    act(() => result.current.toggleDetailsAutoOpen());

    expect(result.current.detailsAutoOpenOnSelection).toBe(false);
  });
});

describe("useTableViewSize", () => {
  it("should default to DEFAULT_TABLE_VIEW_HEIGHT", () => {
    const { result } = renderHookWithState(() => useTableViewSize());

    expect(result.current[0]).toBe(300);
  });

  it("should return 100% when graph viewer is hidden", () => {
    const { result } = renderHookWithState(() => ({
      tableView: useTableViewSize(),
      toggles: useViewToggles(),
    }));

    act(() => result.current.toggles.toggleGraphVisibility());

    expect(result.current.tableView[0]).toBe("100%");
  });

  it("should adjust height by delta", () => {
    const { result } = renderHookWithState(() => useTableViewSize());

    act(() => result.current[1](50));
    expect(result.current[0]).toBe(350);

    act(() => result.current[1](-100));
    expect(result.current[0]).toBe(250);
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

    const { result } = renderHookWithJotai(
      () => useGraphViewSidebar(),
      store => store.set(graphViewLayoutAtom, legacyLayout),
    );

    expect(result.current.sidebarWidth).toBe(400);
    expect(result.current.isSidebarOpen).toBe(true);
  });

  it("should adjust width by delta even when sidebar field was absent", () => {
    const legacyLayout = {
      activeSidebarItem: "search",
      activeToggles: new Set(),
    } as GraphViewLayout;

    const { result } = renderHookWithJotai(
      () => useGraphViewSidebar(),
      store => store.set(graphViewLayoutAtom, legacyLayout),
    );

    act(() => result.current.setSidebarWidth(50));
    expect(result.current.sidebarWidth).toBe(450);
  });
});
