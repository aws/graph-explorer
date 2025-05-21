import { useSetAtom } from "jotai";
import { atomWithLocalForage } from "./localForageEffect";

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

export function useCloseSidebar() {
  const setUserLayout = useSetAtom(userLayoutAtom);
  return () => {
    setUserLayout(prev => ({
      ...prev,
      activeSidebarItem: null,
    }));
  };
}
