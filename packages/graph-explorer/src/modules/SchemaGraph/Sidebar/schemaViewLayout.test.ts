// @vitest-environment happy-dom
import { act } from "react";

import type { SchemaViewLayout } from "@/core/StateProvider/schemaViewLayoutDefaults";

import { DEFAULT_SIDEBAR_WIDTH } from "@/core/StateProvider/graphViewLayoutDefaults";
import { DbState, renderHookWithState } from "@/utils/testing";

import { useSchemaViewSidebar } from "./schemaViewLayout";

const baseLayout: SchemaViewLayout = {
  activeSidebarItem: "details",
  sidebar: { width: DEFAULT_SIDEBAR_WIDTH },
};

/** Seeds a schema view layout, overriding only the fields a test pins. */
function stateWithLayout(overrides: Partial<SchemaViewLayout> = {}) {
  return new DbState().withSchemaViewLayout({ ...baseLayout, ...overrides });
}

describe("useSchemaViewSidebar", () => {
  it("should reflect the seeded active tab and width", () => {
    const { result } = renderHookWithState(
      () => useSchemaViewSidebar(),
      stateWithLayout(),
    );

    expect(result.current.isSidebarOpen).toBe(true);
    expect(result.current.activeSidebarItem).toBe("details");
    expect(result.current.sidebarWidth).toBe(DEFAULT_SIDEBAR_WIDTH);
  });

  it("should toggle to a different tab", () => {
    const { result } = renderHookWithState(
      () => useSchemaViewSidebar(),
      stateWithLayout(),
    );

    act(() => result.current.toggleSidebar("nodes-styling"));

    expect(result.current.activeSidebarItem).toBe("nodes-styling");
    expect(result.current.isSidebarOpen).toBe(true);
  });

  it("should close the sidebar when toggling the active tab", () => {
    const { result } = renderHookWithState(
      () => useSchemaViewSidebar(),
      stateWithLayout(),
    );

    act(() => result.current.toggleSidebar("details"));

    expect(result.current.activeSidebarItem).toBeNull();
    expect(result.current.isSidebarOpen).toBe(false);
  });

  it("should open the sidebar when toggling from closed state", () => {
    const { result } = renderHookWithState(
      () => useSchemaViewSidebar(),
      stateWithLayout({ activeSidebarItem: null }),
    );

    act(() => result.current.toggleSidebar("edges-styling"));

    expect(result.current.activeSidebarItem).toBe("edges-styling");
    expect(result.current.isSidebarOpen).toBe(true);
  });

  it("should close the sidebar with closeSidebar", () => {
    const { result } = renderHookWithState(
      () => useSchemaViewSidebar(),
      stateWithLayout(),
    );

    act(() => result.current.closeSidebar());

    expect(result.current.isSidebarOpen).toBe(false);
    expect(result.current.activeSidebarItem).toBeNull();
  });

  it("should persist sidebar width changes", () => {
    const { result } = renderHookWithState(
      () => useSchemaViewSidebar(),
      stateWithLayout(),
    );

    act(() => result.current.setSidebarWidth(50));
    expect(result.current.sidebarWidth).toBe(DEFAULT_SIDEBAR_WIDTH + 50);

    act(() => result.current.setSidebarWidth(-100));
    expect(result.current.sidebarWidth).toBe(DEFAULT_SIDEBAR_WIDTH - 50);
  });

  it("should auto-open details tab when enabled and selection changes", () => {
    const { result } = renderHookWithState(
      () => useSchemaViewSidebar(),
      stateWithLayout({
        activeSidebarItem: "nodes-styling",
        detailsAutoOpenOnSelection: true,
      }),
    );

    act(() => result.current.autoOpenDetails());

    expect(result.current.activeSidebarItem).toBe("details");
  });

  it("should not auto-open details when disabled", () => {
    const { result } = renderHookWithState(
      () => useSchemaViewSidebar(),
      stateWithLayout({
        activeSidebarItem: "nodes-styling",
        detailsAutoOpenOnSelection: false,
      }),
    );

    act(() => result.current.autoOpenDetails());

    expect(result.current.activeSidebarItem).toBe("nodes-styling");
  });

  it("should auto-open details when detailsAutoOpenOnSelection is undefined (legacy data)", () => {
    const { result } = renderHookWithState(
      () => useSchemaViewSidebar(),
      stateWithLayout({ activeSidebarItem: "nodes-styling" }),
    );

    act(() => result.current.autoOpenDetails());

    expect(result.current.activeSidebarItem).toBe("details");
  });

  it("should open a closed sidebar to details when auto-open is enabled", () => {
    const { result } = renderHookWithState(
      () => useSchemaViewSidebar(),
      stateWithLayout({
        activeSidebarItem: null,
        detailsAutoOpenOnSelection: true,
      }),
    );

    act(() => result.current.autoOpenDetails());

    expect(result.current.activeSidebarItem).toBe("details");
    expect(result.current.isSidebarOpen).toBe(true);
  });

  it("should toggle detailsAutoOpenOnSelection from true to false", () => {
    const { result } = renderHookWithState(
      () => useSchemaViewSidebar(),
      stateWithLayout({ detailsAutoOpenOnSelection: true }),
    );

    expect(result.current.detailsAutoOpenOnSelection).toBe(true);

    act(() => result.current.toggleDetailsAutoOpen());

    expect(result.current.detailsAutoOpenOnSelection).toBe(false);
  });

  it("should toggle detailsAutoOpenOnSelection from false to true", () => {
    const { result } = renderHookWithState(
      () => useSchemaViewSidebar(),
      stateWithLayout({ detailsAutoOpenOnSelection: false }),
    );

    act(() => result.current.toggleDetailsAutoOpen());

    expect(result.current.detailsAutoOpenOnSelection).toBe(true);
  });

  it("should toggle detailsAutoOpenOnSelection from undefined (enabled) to false", () => {
    const { result } = renderHookWithState(
      () => useSchemaViewSidebar(),
      stateWithLayout(),
    );

    // The button shows enabled (undefined reads as `?? true`), so toggling
    // must turn it off, not flip `!undefined` to true.
    act(() => result.current.toggleDetailsAutoOpen());

    expect(result.current.detailsAutoOpenOnSelection).toBe(false);
  });
});
