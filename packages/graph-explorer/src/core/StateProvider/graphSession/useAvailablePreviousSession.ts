import { useRecoilValue } from "recoil";
import {
  activeGraphSessionAtom,
  isRestorePreviousSessionAvailableAtom,
} from "./storage";

/** Returns the available previous session if it exists and no graph manipulations have been made in the current session. */
export function useAvailablePreviousSession() {
  const prevSession = useRecoilValue(activeGraphSessionAtom);
  const isRestoreAvailable = useRecoilValue(
    isRestorePreviousSessionAvailableAtom
  );

  if (!prevSession || !isRestoreAvailable) {
    return null;
  }

  if (prevSession.vertices.size === 0 && prevSession.edges.size === 0) {
    return null;
  }

  return prevSession;
}
