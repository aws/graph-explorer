import { useAtom } from "jotai";
import { atomWithLocalForage } from "./localForageEffect";
import { useQueryEngine } from "../connector";

type UserLayout = {
  activeToggles: Set<string>;
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

export const userLayoutAtom = atomWithLocalForage<UserLayout>(
  {
    activeToggles: new Set(["graph-viewer", "table-view"]),
    activeSidebarItem: "search",
    detailsAutoOpenOnSelection: true,
    tableView: {
      height: 300,
    },
  },
  "user-layout"
);

export function useSidebar() {
  const [userLayout, setUserLayout] = useAtom(userLayoutAtom);
  const queryEngine = useQueryEngine();

  // If the sidebar item is namespaces, but we are not in a RDF connection, the sidebar should be closed
  const activeSidebarItem =
    userLayout.activeSidebarItem === "namespaces" && queryEngine !== "sparql"
      ? null
      : userLayout.activeSidebarItem;

  const isSidebarOpen = activeSidebarItem !== null;

  const shouldShowNamespaces = queryEngine === "sparql";

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
