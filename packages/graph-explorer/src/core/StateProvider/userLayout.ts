import { useAtom } from "jotai";

import { useQueryEngine } from "../connector";
import { userLayoutAtom } from "./storageAtoms";
import {
  DEFAULT_SIDEBAR_WIDTH,
  DEFAULT_TABLE_VIEW_HEIGHT,
  DEFAULT_TREE_VIEW_WIDTH,
  type SidebarItems,
  type ToggleableView,
} from "./userLayoutDefaults";

export function useViewToggles() {
  const [userLayout, setUserLayout] = useAtom(userLayoutAtom);

  const isGraphVisible = userLayout.activeToggles.has("graph-viewer");
  const isTableVisible = userLayout.activeToggles.has("table-view");
  const isTreeVisible = userLayout.activeToggles.has("tree-view");

  const toggleView = (item: ToggleableView) =>
    setUserLayout(prev => {
      const toggles = new Set(prev.activeToggles);
      if (toggles.has(item)) {
        toggles.delete(item);
      } else {
        toggles.add(item);
      }

      return {
        ...prev,
        activeToggles: toggles,
      };
    });

  const toggleGraphVisibility = () => toggleView("graph-viewer");
  const toggleTableVisibility = () => toggleView("table-view");
  const toggleTreeVisibility = () => toggleView("tree-view");

  return {
    isGraphVisible,
    isTableVisible,
    isTreeVisible,
    toggleGraphVisibility,
    toggleTableVisibility,
    toggleTreeVisibility,
  };
}

export function useTableViewSize() {
  const [userLayout, setUserLayout] = useAtom(userLayoutAtom);

  const tableViewHeight = !userLayout.activeToggles.has("graph-viewer")
    ? "100%"
    : (userLayout.tableView?.height ?? DEFAULT_TABLE_VIEW_HEIGHT);

  /** Sets the table view height to the current height + the given delta */
  const setTableViewHeight = (deltaHeight: number) =>
    setUserLayout(prev => {
      const prevHeight = prev.tableView?.height ?? DEFAULT_TABLE_VIEW_HEIGHT;
      return {
        ...prev,
        tableView: {
          ...prev.tableView,
          height: prevHeight + deltaHeight,
        },
      };
    });

  return [tableViewHeight, setTableViewHeight] as const;
}

export function useTreeViewSize() {
  const [userLayout, setUserLayout] = useAtom(userLayoutAtom);

  const treeViewWidth = userLayout.treeView?.width ?? DEFAULT_TREE_VIEW_WIDTH;

  /** Sets the tree view width to the current width + the given delta */
  const setTreeViewWidth = (deltaWidth: number) =>
    setUserLayout(prev => {
      const prevWidth = prev.treeView?.width ?? DEFAULT_TREE_VIEW_WIDTH;
      return {
        ...prev,
        treeView: {
          ...prev.treeView,
          width: prevWidth + deltaWidth,
        },
      };
    });

  return [treeViewWidth, setTreeViewWidth] as const;
}

export function useSidebar() {
  const [userLayout, setUserLayout] = useAtom(userLayoutAtom);
  const queryEngine = useQueryEngine();

  // The namespace sidebar panel is hidden for property graph connections
  const shouldShowNamespaces = queryEngine === "sparql";

  // If the namespace panel is hidden and the active item is namespaces, the sidebar should be closed
  const activeSidebarItem =
    userLayout.activeSidebarItem === "namespaces" && !shouldShowNamespaces
      ? null
      : userLayout.activeSidebarItem;

  const isSidebarOpen = activeSidebarItem !== null;

  /** Closes the sidebar */
  const closeSidebar = () =>
    setUserLayout(prev => {
      return {
        ...prev,
        activeSidebarItem: null,
      };
    });

  /**
   * Sets the active sidebar item to the given item, or closes the sidebar if the
   * item is the same as the current active item.
   */
  const toggleSidebar = (item: SidebarItems) =>
    setUserLayout(prev => {
      return {
        ...prev,
        activeSidebarItem: prev.activeSidebarItem === item ? null : item,
      };
    });

  return {
    activeSidebarItem,
    isSidebarOpen,
    closeSidebar,
    toggleSidebar,
    shouldShowNamespaces,
  };
}

export function useSidebarSize() {
  const [userLayout, setUserLayout] = useAtom(userLayoutAtom);

  const sidebarWidth = userLayout.sidebar?.width ?? DEFAULT_SIDEBAR_WIDTH;

  /** Sets the sidebar width to the current width + the given delta */
  const setSidebarWidth = (deltaWidth: number) => {
    setUserLayout(prev => {
      const prevWidth = prev.sidebar?.width ?? DEFAULT_SIDEBAR_WIDTH;
      return {
        ...prev,
        sidebar: {
          ...prev.sidebar,
          width: prevWidth + deltaWidth,
        },
      };
    });
  };

  return [sidebarWidth, setSidebarWidth] as const;
}
