import { DbState, renderHookWithJotai } from "@/utils/testing";
import { userLayoutAtom, useSidebar } from "./userLayout";
import { act } from "react";

describe("useSidebar", () => {
  it("should default to sidebar open", () => {
    const { result } = renderHookWithJotai(() => useSidebar());

    expect(result.current.isSidebarOpen).toBe(true);
  });

  it("should change to the give sidebar item", async () => {
    const { result } = renderHookWithJotai(() => useSidebar());

    await act(() => result.current.toggleSidebar("details"));
    expect(result.current.isSidebarOpen).toBe(true);
    expect(result.current.activeSidebarItem).toBe("details");

    await act(() => result.current.toggleSidebar("search"));
    expect(result.current.isSidebarOpen).toBe(true);
    expect(result.current.activeSidebarItem).toBe("search");
  });

  it("should close the sidebar if toggling to the same item", async () => {
    const { result } = renderHookWithJotai(
      () => useSidebar(),
      snapshot =>
        snapshot.set(userLayoutAtom, {
          activeSidebarItem: "details",
          activeToggles: new Set<string>(),
        })
    );

    await act(() => result.current.toggleSidebar("details"));

    expect(result.current.isSidebarOpen).toBe(false);
    expect(result.current.activeSidebarItem).toBeNull();
  });

  it("should close the sidebar", async () => {
    const { result } = renderHookWithJotai(() => useSidebar());

    await act(() => result.current.closeSidebar());

    expect(result.current.isSidebarOpen).toBe(false);
  });

  it("should show namespaces when the connection is a SPARQL connection", () => {
    const dbState = new DbState();
    dbState.activeConfig.connection!.queryEngine = "sparql";

    const { result } = renderHookWithJotai(
      () => useSidebar(),
      snapshot => {
        dbState.applyTo(snapshot);
        snapshot.set(userLayoutAtom, {
          activeSidebarItem: "namespaces",
          activeToggles: new Set<string>(),
        });
      }
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
      snapshot => {
        dbState.applyTo(snapshot);
        snapshot.set(userLayoutAtom, {
          activeSidebarItem: "namespaces",
          activeToggles: new Set<string>(),
        });
      }
    );

    expect(result.current.isSidebarOpen).toBe(false);
    expect(result.current.activeSidebarItem).toBeNull();
    expect(result.current.shouldShowNamespaces).toBe(false);
  });
});
