import { userLayoutAtom } from "@/core";
import { useSetAtom } from "jotai";

export function useAutoOpenDetailsSidebar() {
  const setUserLayout = useSetAtom(userLayoutAtom);
  return async () => {
    await setUserLayout(async prevPromise => {
      const prev = await prevPromise;

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
