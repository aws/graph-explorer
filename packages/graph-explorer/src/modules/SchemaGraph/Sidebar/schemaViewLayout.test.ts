// @vitest-environment happy-dom
import { act } from "react";

import { DEFAULT_SIDEBAR_WIDTH } from "@/core/StateProvider/graphViewLayoutDefaults";
import { schemaViewLayoutAtom } from "@/core/StateProvider/storageAtoms";
import { renderHookWithJotai } from "@/utils/testing";

import { useSchemaViewSidebar } from "./schemaViewLayout";

describe("useSchemaViewSidebar", () => {
  it("should default to sidebar open with details tab", () => {
    const { result } = renderHookWithJotai(() => useSchemaViewSidebar());

    expect(result.current.isSidebarOpen).toBe(true);
    expect(result.current.activeSidebarItem).toBe("details");
    expect(result.current.sidebarWidth).toBe(DEFAULT_SIDEBAR_WIDTH);
  });

  it("should toggle to a different tab", () => {
    const { result } = renderHookWithJotai(() => useSchemaViewSidebar());

    act(() => result.current.toggleSidebar("nodes-styling"));

    expect(result.current.activeSidebarItem).toBe("nodes-styling");
    expect(result.current.isSidebarOpen).toBe(true);
  });

  it("should close the sidebar when toggling the active tab", () => {
    const { result } = renderHookWithJotai(() => useSchemaViewSidebar());

    act(() => result.current.toggleSidebar("details"));

    expect(result.current.activeSidebarItem).toBeNull();
    expect(result.current.isSidebarOpen).toBe(false);
  });

  it("should open the sidebar when toggling from closed state", () => {
    const { result } = renderHookWithJotai(
      () => useSchemaViewSidebar(),
      store =>
        store.set(schemaViewLayoutAtom, {
          activeSidebarItem: null,
          sidebar: { width: 350 },
        }),
    );

    act(() => result.current.toggleSidebar("edges-styling"));

    expect(result.current.activeSidebarItem).toBe("edges-styling");
    expect(result.current.isSidebarOpen).toBe(true);
  });

  it("should close the sidebar with closeSidebar", () => {
    const { result } = renderHookWithJotai(() => useSchemaViewSidebar());

    act(() => result.current.closeSidebar());

    expect(result.current.isSidebarOpen).toBe(false);
    expect(result.current.activeSidebarItem).toBeNull();
  });

  it("should persist sidebar width changes", () => {
    const { result } = renderHookWithJotai(() => useSchemaViewSidebar());

    act(() => result.current.setSidebarWidth(50));
    expect(result.current.sidebarWidth).toBe(450);

    act(() => result.current.setSidebarWidth(-100));
    expect(result.current.sidebarWidth).toBe(350);
  });

  it("should auto-open details tab when enabled and selection changes", () => {
    const { result } = renderHookWithJotai(
      () => useSchemaViewSidebar(),
      store =>
        store.set(schemaViewLayoutAtom, {
          activeSidebarItem: "nodes-styling",
          sidebar: { width: 350 },
          detailsAutoOpenOnSelection: true,
        }),
    );

    act(() => result.current.autoOpenDetails());

    expect(result.current.activeSidebarItem).toBe("details");
  });

  it("should not auto-open details when disabled", () => {
    const { result } = renderHookWithJotai(
      () => useSchemaViewSidebar(),
      store =>
        store.set(schemaViewLayoutAtom, {
          activeSidebarItem: "nodes-styling",
          sidebar: { width: 350 },
          detailsAutoOpenOnSelection: false,
        }),
    );

    act(() => result.current.autoOpenDetails());

    expect(result.current.activeSidebarItem).toBe("nodes-styling");
  });

  it("should auto-open details when detailsAutoOpenOnSelection is undefined (legacy data)", () => {
    const { result } = renderHookWithJotai(
      () => useSchemaViewSidebar(),
      store =>
        store.set(schemaViewLayoutAtom, {
          activeSidebarItem: "nodes-styling",
          sidebar: { width: 350 },
        }),
    );

    act(() => result.current.autoOpenDetails());

    expect(result.current.activeSidebarItem).toBe("details");
  });

  it("should open a closed sidebar to details when auto-open is enabled", () => {
    const { result } = renderHookWithJotai(
      () => useSchemaViewSidebar(),
      store =>
        store.set(schemaViewLayoutAtom, {
          activeSidebarItem: null,
          sidebar: { width: 350 },
          detailsAutoOpenOnSelection: true,
        }),
    );

    act(() => result.current.autoOpenDetails());

    expect(result.current.activeSidebarItem).toBe("details");
    expect(result.current.isSidebarOpen).toBe(true);
  });

  it("should default detailsAutoOpenOnSelection to enabled", () => {
    const { result } = renderHookWithJotai(() => useSchemaViewSidebar());

    expect(result.current.detailsAutoOpenOnSelection).toBe(true);
  });

  it("should toggle detailsAutoOpenOnSelection from true to false", () => {
    const { result } = renderHookWithJotai(
      () => useSchemaViewSidebar(),
      store =>
        store.set(schemaViewLayoutAtom, {
          activeSidebarItem: "details",
          sidebar: { width: 350 },
          detailsAutoOpenOnSelection: true,
        }),
    );

    act(() => result.current.toggleDetailsAutoOpen());

    expect(result.current.detailsAutoOpenOnSelection).toBe(false);
  });

  it("should toggle detailsAutoOpenOnSelection from false to true", () => {
    const { result } = renderHookWithJotai(
      () => useSchemaViewSidebar(),
      store =>
        store.set(schemaViewLayoutAtom, {
          activeSidebarItem: "details",
          sidebar: { width: 350 },
          detailsAutoOpenOnSelection: false,
        }),
    );

    act(() => result.current.toggleDetailsAutoOpen());

    expect(result.current.detailsAutoOpenOnSelection).toBe(true);
  });

  it("should toggle detailsAutoOpenOnSelection from undefined (enabled) to false", () => {
    const { result } = renderHookWithJotai(
      () => useSchemaViewSidebar(),
      store =>
        store.set(schemaViewLayoutAtom, {
          activeSidebarItem: "details",
          sidebar: { width: 350 },
        }),
    );

    // The button shows enabled (undefined reads as `?? true`), so toggling
    // must turn it off, not flip `!undefined` to true.
    act(() => result.current.toggleDetailsAutoOpen());

    expect(result.current.detailsAutoOpenOnSelection).toBe(false);
  });
});
