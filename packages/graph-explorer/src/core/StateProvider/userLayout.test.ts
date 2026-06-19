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
  useViewToggles,
} from "./userLayout";

describe("useViewToggles", () => {
  it("should default to both views open", async () => {
    const { result } = await renderHookWithState(() => useViewToggles());

    expect(result.current.isGraphVisible).toBe(true);
    expect(result.current.isTableVisible).toBe(true);
  });

  it("should toggle graph view", async () => {
    const { result } = await renderHookWithState(() => useViewToggles());

    await act(async () => result.current.toggleGraphVisibility());

    expect(result.current.isGraphVisible).toBe(false);
    expect(result.current.isTableVisible).toBe(true);

    await act(async () => result.current.toggleGraphVisibility());

    expect(result.current.isGraphVisible).toBe(true);
    expect(result.current.isTableVisible).toBe(true);
  });

  it("should toggle table view", async () => {
    const { result } = await renderHookWithState(() => useViewToggles());

    await act(async () => result.current.toggleTableVisibility());

    expect(result.current.isGraphVisible).toBe(true);
    expect(result.current.isTableVisible).toBe(false);

    await act(async () => result.current.toggleTableVisibility());

    expect(result.current.isGraphVisible).toBe(true);
    expect(result.current.isTableVisible).toBe(true);
  });
});

describe("useSidebar", () => {
  it("should default to sidebar open", async () => {
    const { result } = await renderHookWithJotai(() => useSidebar());

    expect(result.current.isSidebarOpen).toBe(true);
  });

  it("should change to the given sidebar item", async () => {
    const { result } = await renderHookWithJotai(() => useSidebar());

    act(() => result.current.toggleSidebar("details"));
    expect(result.current.isSidebarOpen).toBe(true);
    expect(result.current.activeSidebarItem).toBe("details");

    act(() => result.current.toggleSidebar("search"));
    expect(result.current.isSidebarOpen).toBe(true);
    expect(result.current.activeSidebarItem).toBe("search");
  });

  it("should close the sidebar if toggling to the same item", async () => {
    const { result } = await renderHookWithJotai(
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

  it("should close the sidebar", async () => {
    const { result } = await renderHookWithJotai(() => useSidebar());

    await act(async () => result.current.closeSidebar());

    expect(result.current.isSidebarOpen).toBe(false);
  });

  it("should show namespaces when the connection is a SPARQL connection", async () => {
    const dbState = new DbState();
    dbState.activeConfig.connection!.queryEngine = "sparql";

    const { result } = await renderHookWithJotai(
      () => useSidebar(),
      async store => {
        await dbState.applyTo(store);
        await store.set(userLayoutAtom, {
          activeSidebarItem: "namespaces",
          activeToggles: new Set(),
        } satisfies UserLayout);
      },
    );

    expect(result.current.isSidebarOpen).toBe(true);
    expect(result.current.activeSidebarItem).toBe("namespaces");
    expect(result.current.shouldShowNamespaces).toBe(true);
  });

  it("should be closed when active item is namespaces but connection is not RDF", async () => {
    const dbState = new DbState();
    dbState.activeConfig.connection!.queryEngine = "gremlin";

    const { result } = await renderHookWithJotai(
      () => useSidebar(),
      async store => {
        await dbState.applyTo(store);
        await store.set(userLayoutAtom, {
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
  it("should default to DEFAULT_TABLE_VIEW_HEIGHT", async () => {
    const { result } = await renderHookWithState(() => useTableViewSize());

    expect(result.current[0]).toBe(300);
  });

  it("should return 100% when graph viewer is hidden", async () => {
    const { result } = await renderHookWithState(() => ({
      tableView: useTableViewSize(),
      toggles: useViewToggles(),
    }));

    await act(async () => result.current.toggles.toggleGraphVisibility());

    expect(result.current.tableView[0]).toBe("100%");
  });

  it("should adjust height by delta", async () => {
    const { result } = await renderHookWithState(() => useTableViewSize());

    await act(async () => result.current[1](50));

    expect(result.current[0]).toBe(350);

    await act(async () => result.current[1](-100));

    expect(result.current[0]).toBe(250);
  });
});

describe("useSidebarSize", () => {
  it("should default to 400", async () => {
    const { result } = await renderHookWithState(() => useSidebarSize());

    expect(result.current[0]).toBe(400);
  });

  it("should adjust width by delta", async () => {
    const { result } = await renderHookWithState(() => useSidebarSize());

    act(() => result.current[1](100));

    expect(result.current[0]).toBe(500);

    act(() => result.current[1](-200));

    expect(result.current[0]).toBe(300);
  });
});
