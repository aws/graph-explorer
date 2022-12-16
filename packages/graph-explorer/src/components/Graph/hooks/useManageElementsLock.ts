import { useEffect } from "react";
import type { CytoscapeType } from "../Graph.model";

interface UseManageElementsSelection {
  cy?: CytoscapeType;
  autolock?: boolean;
  lockedNodesIds: Set<string>;
  graphStructureVersion: number;
}

export default function useManageElementsLock({
  cy,
  autolock,
  lockedNodesIds,
  graphStructureVersion,
}: UseManageElementsSelection) {
  useEffect(() => {
    if (!cy || autolock) {
      return;
    }

    cy.batch(() => {
      cy.nodes().forEach(node => {
        const id = node.data("id");
        if (lockedNodesIds.has(id)) {
          node.lock();
          node.addClass("locked");
        } else {
          node.unlock();
          node.removeClass("locked");
        }
      });
    });
  }, [autolock, cy, lockedNodesIds, graphStructureVersion]);
}
