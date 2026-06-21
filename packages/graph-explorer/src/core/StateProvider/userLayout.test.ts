// @vitest-environment happy-dom
import { act } from "react";

import {
  DbState,
  renderHookWithJotai,
  renderHookWithState,
} from "@/utils/testing";

import type { UserLayout } from "./userLayoutDefaults";

import { userLayoutAtom } from "./storageAtoms";
import {
  useSidebar,
  useSidebarSize,
  useTableViewSize,
  useTreeViewSize,
  useViewToggles,
} from "./userLayout";

describe("useViewToggles", () => {
  it("should default to all views open", () => {
    const { result } = renderHookWithState(() => useViewToggles());

    expect(result.current.isGraphVisible).toBe(true);
    expect(result.current.isTableVisible).toBe(true);
    expect(result.current.isTreeVisible).toBe(true);
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

  it("should toggle tree view", () => {
    const { result } = renderHookWithState(() => useViewToggles());

    act(() => result.current.toggleTreeVisibility());

    expect(result.current.isTreeVisible).toBe(false);
    expect(result.current.isGraphVisible).toBe(true);
    expect(result.current.isTableVisible).toBe(true);

    act(() => result.current.toggleTreeVisibility());

    expect(result.current.isTreeVisible).toBe(true);
  });
});

describe("useSidebar", () => {
  it("should default to sidebar open", () => {
    const { result } = renderHookWithJotai(() => useSidebar());

    expect(result.current.isSidebarOpen).toBe(true);
  });

  it("should change to the given sidebar item", () => {
    const { result } = renderHookWithJotai(() => useSidebar());

    act(() => result.current.toggleSidebar("details"));
    expect(result.current.isSidebarOpen).toBe(true);
    expect(result.current.activeSidebarItem).toBe("details");

    act(() => result.current.toggleSidebar("search"));
    expect(result.current.isSidebarOpen).toBe(true);
    expect(result.current.activeSidebarItem).toBe("search");
  });

  it("should close the sidebar if toggling to the same item", () => {
    const { result } = renderHookWithJotai(
      () => useSidebar(),
      store =>
        store.set(userLayoutAtom, {
          activeSidebarItem: "details",
          activeToggles: new Set(),
        } satisfies UserLayout),
    );

    act(() => result.current.toggleSidebar("details"));

    expect(result.current.isSidebarOpen).toBe(false);
    expect(result.current.activeSidebarItem).toBeNull();
  });

  it("should close the sidebar", () => {
    const { result } = renderHookWithJotai(() => useSidebar());

    act(() => result.current.closeSidebar());

    expect(result.current.isSidebarOpen).toBe(false);
  });

  it("should show namespaces when the connection is a SPARQL connection", () => {
    const dbState = new DbState();
    dbState.activeConfig.connection!.queryEngine = "sparql";

    const { result } = renderHookWithJotai(
      () => useSidebar(),
      store => {
        dbState.applyTo(store);
        store.set(userLayoutAtom, {
          activeSidebarItem: "namespaces",
          activeToggles: new Set(),
        } satisfies UserLayout);
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
      () => useSidebar(),
      store => {
        dbState.applyTo(store);
        store.set(userLayoutAtom, {
          activeSidebarItem: "namespaces",
          activeToggles: new Set(),
        } satisfies UserLayout);
      },
    );

    expect(result.current.isSidebarOpen).toBe(false);
    expect(result.current.activeSidebarItem).toBeNull();
    expect(result.current.shouldShowNamespaces).toBe(false);
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

describe("useTreeViewSize", () => {
  it("should default to DEFAULT_TREE_VIEW_WIDTH", () => {
    const { result } = renderHookWithState(() => useTreeViewSize());

    expect(result.current[0]).toBe(320);
  });

  it("should adjust width by delta", () => {
    const { result } = renderHookWithState(() => useTreeViewSize());

    act(() => result.current[1](100));

    expect(result.current[0]).toBe(420);

    act(() => result.current[1](-200));

    expect(result.current[0]).toBe(220);
  });
});

describe("useSidebarSize", () => {
  it("should default to 400", () => {
    const { result } = renderHookWithState(() => useSidebarSize());

    expect(result.current[0]).toBe(400);
  });

  it("should adjust width by delta", () => {
    const { result } = renderHookWithState(() => useSidebarSize());

    act(() => result.current[1](100));

    expect(result.current[0]).toBe(500);

    act(() => result.current[1](-200));

    expect(result.current[0]).toBe(300);
  });
});
