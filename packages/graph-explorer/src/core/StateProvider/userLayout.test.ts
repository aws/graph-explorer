import type { ExtractAtomValue } from "jotai";

import { act } from "react";

import {
  DbState,
  renderHookWithJotai,
  renderHookWithState,
} from "@/utils/testing";

import { userLayoutAtom } from "./storageAtoms";
import { useSidebar, useViewToggles } from "./userLayout";

type UserLayout = ExtractAtomValue<typeof userLayoutAtom>;

describe("useViewToggles", () => {
  it("should default to both views open", () => {
    const { result } = renderHookWithState(() => useViewToggles());

    expect(result.current.isGraphVisible).toBeTruthy();
    expect(result.current.isTableVisible).toBeTruthy();
  });

  it("should toggle graph view", () => {
    const { result } = renderHookWithState(() => useViewToggles());

    act(() => result.current.toggleGraphVisibility());

    expect(result.current.isGraphVisible).toBeFalsy();
    expect(result.current.isTableVisible).toBeTruthy();

    act(() => result.current.toggleGraphVisibility());

    expect(result.current.isGraphVisible).toBeTruthy();
    expect(result.current.isTableVisible).toBeTruthy();
  });

  it("should toggle table view", () => {
    const { result } = renderHookWithState(() => useViewToggles());

    act(() => result.current.toggleTableVisibility());

    expect(result.current.isGraphVisible).toBeTruthy();
    expect(result.current.isTableVisible).toBeFalsy();

    act(() => result.current.toggleTableVisibility());

    expect(result.current.isGraphVisible).toBeTruthy();
    expect(result.current.isTableVisible).toBeTruthy();
  });
});

describe("useSidebar", () => {
  it("should default to sidebar open", () => {
    const { result } = renderHookWithJotai(() => useSidebar());

    expect(result.current.isSidebarOpen).toBe(true);
  });

  it("should change to the give sidebar item", () => {
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
