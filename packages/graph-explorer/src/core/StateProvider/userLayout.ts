import { useAtom } from "jotai";
import { atomWithLocalForage } from "./localForageEffect";
import { useQueryEngine } from "../connector";

type ToggleableView = "graph-viewer" | "table-view";

type UserLayout = {
  activeToggles: Set<ToggleableView>;
  activeSidebarItem:
    | "search"
    | "details"
    | "filters"
    | "expand"
    | "nodes-styling"
    | "edges-styling"
    | "namespaces"
    | null;
  tableView?: {
    height: number;
  };
  sidebar?: {
    width: number;
  };
  detailsAutoOpenOnSelection?: boolean;
};

export type SidebarItems = UserLayout["activeSidebarItem"];

export const DEFAULT_TABLE_VIEW_HEIGHT = 300;

export const userLayoutAtom = atomWithLocalForage<UserLayout>(
  {
    activeToggles: new Set(["graph-viewer", "table-view"]),
    activeSidebarItem: "search",
    detailsAutoOpenOnSelection: true,
    tableView: {
      height: DEFAULT_TABLE_VIEW_HEIGHT,
    },
  },
  "user-layout"
);

export function useViewToggles() {
  const [userLayout, setUserLayout] = useAtom(userLayoutAtom);

  const isGraphVisible = userLayout.activeToggles.has("graph-viewer");
  const isTableVisible = userLayout.activeToggles.has("table-view");

  const toggleView = (item: ToggleableView) =>
    setUserLayout(async prev => {
      const prevValue = await prev;
      const toggles = new Set(prevValue.activeToggles);
      if (toggles.has(item)) {
        toggles.delete(item);
      } else {
        toggles.add(item);
      }

      return {
        ...prevValue,
        activeToggles: toggles,
      };
    });

  const toggleGraphVisibility = () => toggleView("graph-viewer");
  const toggleTableVisibility = () => toggleView("table-view");

  return {
    isGraphVisible,
    isTableVisible,
    toggleGraphVisibility,
    toggleTableVisibility,
  };
}

export function useTableViewSize() {
  const [userLayout, setUserLayout] = useAtom(userLayoutAtom);

  const tableViewHeight = !userLayout.activeToggles.has("graph-viewer")
    ? "100%"
    : userLayout.tableView?.height || DEFAULT_TABLE_VIEW_HEIGHT;

  /** Sets the table view height to the current height + the given delta */
  const setTableViewHeight = (deltaHeight: number) =>
    setUserLayout(async prevPromise => {
      const prev = await prevPromise;
      const prevHeight = prev.tableView?.height ?? DEFAULT_TABLE_VIEW_HEIGHT;
      return {
        ...prev,
        tableView: {
          ...(prev.tableView || {}),
          height: prevHeight + deltaHeight,
        },
      };
    });

  return [tableViewHeight, setTableViewHeight] as const;
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
    setUserLayout(async prevPromise => {
      const prev = await prevPromise;
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
    setUserLayout(async prevPromise => {
      const prev = await prevPromise;

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

export const DEFAULT_SIDEBAR_WIDTH = 400;
export const CLOSED_SIDEBAR_WIDTH = 50;

export function useSidebarSize() {
  const [userLayout, setUserLayout] = useAtom(userLayoutAtom);

  const sidebarWidth = userLayout.sidebar?.width ?? DEFAULT_SIDEBAR_WIDTH;

  /** Sets the sidebar width to the current with + the given delta */
  const setSidebarWidth = (deltaWidth: number) => {
    setUserLayout(async prevPromise => {
      const prev = await prevPromise;
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
