import { useSetAtom } from "jotai";

import { userLayoutAtom } from "@/core";
import { logAndNotify } from "@/utils";

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
    }).catch(logAndNotify("Failed to save your layout preferences."));
  };
}
