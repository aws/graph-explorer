import { useSetAtom } from "jotai";

import { userLayoutAtom } from "@/core";
import { fireAndForget } from "@/utils";

export function useAutoOpenDetailsSidebar() {
  const setUserLayout = useSetAtom(userLayoutAtom);
  return () => {
    fireAndForget(
      setUserLayout(prev => {
        if (prev.detailsAutoOpenOnSelection !== true) {
          return prev;
        }

        return {
          ...prev,
          activeSidebarItem: "details",
        };
      }),
    );
  };
}
