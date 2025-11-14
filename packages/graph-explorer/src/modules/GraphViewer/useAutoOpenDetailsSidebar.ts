import { userLayoutAtom } from "@/core";
import { useSetAtom } from "jotai";

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
    });
  };
}
