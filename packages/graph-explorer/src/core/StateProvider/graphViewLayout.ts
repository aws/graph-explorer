import { useAtom } from "jotai";

import { useQueryEngine } from "../connector";
import {
  DEFAULT_SIDEBAR_WIDTH,
  DEFAULT_TABLE_VIEW_HEIGHT,
  type GraphViewSidebarItem,
  type ToggleableView,
} from "./graphViewLayoutDefaults";
import { graphViewLayoutAtom } from "./storageAtoms";

export type {
  GraphViewLayout,
  GraphViewSidebarItem,
  ToggleableView,
} from "./graphViewLayoutDefaults";
export {
  CLOSED_SIDEBAR_WIDTH,
  DEFAULT_SIDEBAR_WIDTH,
  DEFAULT_TABLE_VIEW_HEIGHT,
  defaultGraphViewLayout,
} from "./graphViewLayoutDefaults";

export function useViewToggles() {
  const [layout, setLayout] = useAtom(graphViewLayoutAtom);

  const isGraphVisible = layout.activeToggles.has("graph-viewer");
  const isTableVisible = layout.activeToggles.has("table-view");

  function toggleView(item: ToggleableView) {
    setLayout(prev => {
      const toggles = new Set(prev.activeToggles);
      if (toggles.has(item)) {
        toggles.delete(item);
      } else {
        toggles.add(item);
      }
      return { ...prev, activeToggles: toggles };
    });
  }

  return {
    isGraphVisible,
    isTableVisible,
    toggleGraphVisibility: () => toggleView("graph-viewer"),
    toggleTableVisibility: () => toggleView("table-view"),
  };
}

export function useTableViewSize() {
  const [layout, setLayout] = useAtom(graphViewLayoutAtom);

  const tableViewHeight = !layout.activeToggles.has("graph-viewer")
    ? "100%"
    : (layout.tableView?.height ?? DEFAULT_TABLE_VIEW_HEIGHT);

  function setTableViewHeight(deltaHeight: number) {
    setLayout(prev => {
      const prevHeight = prev.tableView?.height ?? DEFAULT_TABLE_VIEW_HEIGHT;
      return {
        ...prev,
        tableView: { ...prev.tableView, height: prevHeight + deltaHeight },
      };
    });
  }

  return [tableViewHeight, setTableViewHeight] as const;
}

export function useGraphViewSidebar() {
  const [layout, setLayout] = useAtom(graphViewLayoutAtom);
  const queryEngine = useQueryEngine();

  const shouldShowNamespaces = queryEngine === "sparql";

  const activeSidebarItem =
    layout.activeSidebarItem === "namespaces" && !shouldShowNamespaces
      ? null
      : layout.activeSidebarItem;

  const isSidebarOpen = activeSidebarItem !== null;
  const sidebarWidth = layout.sidebar?.width ?? DEFAULT_SIDEBAR_WIDTH;

  function closeSidebar() {
    setLayout(prev => ({ ...prev, activeSidebarItem: null }));
  }

  function toggleSidebar(item: GraphViewSidebarItem) {
    setLayout(prev => ({
      ...prev,
      activeSidebarItem: prev.activeSidebarItem === item ? null : item,
    }));
  }

  function setSidebarWidth(deltaWidth: number) {
    setLayout(prev => ({
      ...prev,
      sidebar: {
        ...prev.sidebar,
        width: (prev.sidebar?.width ?? DEFAULT_SIDEBAR_WIDTH) + deltaWidth,
      },
    }));
  }

  const detailsAutoOpenOnSelection = layout.detailsAutoOpenOnSelection ?? true;

  function toggleDetailsAutoOpen() {
    setLayout(prev => ({
      ...prev,
      detailsAutoOpenOnSelection: !(prev.detailsAutoOpenOnSelection ?? true),
    }));
  }

  function autoOpenDetails() {
    setLayout(prev =>
      prev.detailsAutoOpenOnSelection === false
        ? prev
        : { ...prev, activeSidebarItem: "details" },
    );
  }

  return {
    activeSidebarItem,
    isSidebarOpen,
    shouldShowNamespaces,
    sidebarWidth,
    closeSidebar,
    toggleSidebar,
    setSidebarWidth,
    detailsAutoOpenOnSelection,
    toggleDetailsAutoOpen,
    autoOpenDetails,
  };
}
