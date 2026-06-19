import { useSetAtom } from "jotai";

import { userLayoutAtom } from "@/core";
import { logAndIgnore } from "@/utils";

export function useAutoOpenDetailsSidebar() {
  const setUserLayout = useSetAtom(userLayoutAtom);
  return () => {
    setUserLayout(prev => {
      if (prev.detailsAutoOpenOnSelection !== true) {
        return prev;
      }

      return {
        ...prev,
        activeSidebarItem: "details",
      };
    }).catch(logAndIgnore);
  };
}
