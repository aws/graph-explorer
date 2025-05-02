import { userLayoutAtom } from "@/core/StateProvider/userPreferences";
import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

export function useAutoOpenDetailsSidebar() {
  return useAtomCallback(
    useCallback(async (get, set) => {
      const userLayout = get(userLayoutAtom);

      // If feature is disabled then do nothing
      if (userLayout.detailsAutoOpenOnSelection === false) {
        return;
      }

      // If sidebar is already open then do nothing
      if (userLayout.activeSidebarItem != null) {
        return;
      }

      // Sidebar is closed, so open it to details
      await set(userLayoutAtom, async prevState => {
        return {
          ...(await prevState),
          activeSidebarItem: "details" as const,
        };
      });
    }, [])
  );
}
