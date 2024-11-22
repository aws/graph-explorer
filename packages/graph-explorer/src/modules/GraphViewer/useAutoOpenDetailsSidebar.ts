import { userLayoutAtom } from "@/core/StateProvider/userPreferences";
import { useRecoilCallback } from "recoil";

export function useAutoOpenDetailsSidebar() {
  return useRecoilCallback(({ snapshot, set }) => async () => {
    const userLayout = await snapshot.getPromise(userLayoutAtom);

    // If feature is disabled then do nothing
    if (userLayout.detailsAutoOpenOnSelection === false) {
      return;
    }

    // If sidebar is already open then do nothing
    if (userLayout.activeSidebarItem != null) {
      return;
    }

    // Sidebar is closed, so open it to details
    set(userLayoutAtom, prevState => ({
      ...prevState,
      activeSidebarItem: "details" as const,
    }));
  });
}
