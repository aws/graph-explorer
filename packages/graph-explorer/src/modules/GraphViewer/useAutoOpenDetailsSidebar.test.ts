import { type ToggleableView, useSidebar, userLayoutAtom } from "@/core";
import { renderHookWithJotai } from "@/utils/testing";
import { act } from "react";
import { useAutoOpenDetailsSidebar } from "./useAutoOpenDetailsSidebar";

describe("useAutoOpenDetailsSidebar", () => {
  it("should auto-open details when detailsAutoOpenOnSelection is true", async () => {
    const { result } = renderHookWithJotai(
      () => {
        const autoOpen = useAutoOpenDetailsSidebar();
        const sidebar = useSidebar();
        return { autoOpen, sidebar };
      },
      store =>
        store.set(userLayoutAtom, {
          activeSidebarItem: "search",
          activeToggles: new Set<ToggleableView>(),
          detailsAutoOpenOnSelection: true,
        })
    );

    await act(() => result.current.autoOpen());

    expect(result.current.sidebar.activeSidebarItem).toBe("details");
  });

  it("should do nothing when detailsAutoOpenOnSelection is true and sidebar is already details", async () => {
    const { result } = renderHookWithJotai(
      () => {
        const autoOpen = useAutoOpenDetailsSidebar();
        const sidebar = useSidebar();
        return { autoOpen, sidebar };
      },
      store =>
        store.set(userLayoutAtom, {
          activeSidebarItem: "details",
          activeToggles: new Set<ToggleableView>(),
          detailsAutoOpenOnSelection: true,
        })
    );

    await act(() => result.current.autoOpen());

    expect(result.current.sidebar.activeSidebarItem).toBe("details");
    expect(result.current.sidebar.isSidebarOpen).toBe(true);
  });

  it("should not auto-open details when detailsAutoOpenOnSelection is false", async () => {
    const { result } = renderHookWithJotai(
      () => {
        const autoOpen = useAutoOpenDetailsSidebar();
        const sidebar = useSidebar();
        return { autoOpen, sidebar };
      },
      store =>
        store.set(userLayoutAtom, {
          activeSidebarItem: "search",
          activeToggles: new Set<ToggleableView>(),
          detailsAutoOpenOnSelection: false,
        })
    );

    await act(() => result.current.autoOpen());

    expect(result.current.sidebar.activeSidebarItem).toBe("search");
  });
});
