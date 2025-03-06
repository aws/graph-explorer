import {
  useRestoreGraphSession,
  activeGraphSessionAtom,
  allowRestorePreviousSessionAtom,
} from "@/core";
import { logger } from "@/utils";
import { PropsWithChildren, useEffect, useRef } from "react";
import { useRecoilValue } from "recoil";

/**
 * Restores the graph session if it has not been restored yet.
 */
export function RestoreGraphSession(props: PropsWithChildren) {
  // Only perform the restore if the feature flag is enabled
  const enabled = useRecoilValue(allowRestorePreviousSessionAtom);
  if (!enabled) {
    return props.children;
  }
  return <InternalRestoreGraphSession {...props} />;
}

function InternalRestoreGraphSession(props: PropsWithChildren) {
  const hasBeenRestored = useRef(false);
  const restoreGraph = useRestoreGraphSession();
  const graph = useRecoilValue(activeGraphSessionAtom);

  useEffect(() => {
    // Ensure the restore only runs once
    if (hasBeenRestored.current) {
      return;
    }
    hasBeenRestored.current = true;

    if (!graph) {
      logger.debug("No graph session to restore");
      return;
    }

    restoreGraph.mutate(graph);
  }, [graph, restoreGraph]);

  return props.children;
}
