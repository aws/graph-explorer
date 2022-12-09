import { useCallback } from "react";
import type { CytoscapeType } from "../Graph.model";
import useFilter from "./useFilter";

export type ConnectionsFilterConfig = {
  numConnections?: [number, number];
  isActive?: boolean;
  min?: number;
  max?: number;
};

const DEFAULT_VALUE = [3, 100] as [number, number];

const useConnectionsFilter = (
  graphStructureVersion: number,
  cy?: CytoscapeType,
  {
    numConnections = DEFAULT_VALUE,
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    isActive = false,
  }: ConnectionsFilterConfig = {}
): void => {
  const applyFilter = useCallback(
    (cy: CytoscapeType) => {
      if (numConnections[0] < min) {
        return null;
      }

      const elementsWithinCutoff = cy.collection();

      cy.$("node[!__isGroupNode]:childless")
        .nodes()
        .filter(node => {
          if (
            numConnections[0] <= node.degree(false) &&
            (numConnections[1] >= max ||
              node.degree(false) <= numConnections[1])
          ) {
            elementsWithinCutoff.merge(node);
            return true;
          }
          return false;
        });

      return elementsWithinCutoff;
    },
    [numConnections, min, max]
  );

  useFilter({
    graphStructureVersion,
    cy,
    isFilterActive: isActive,
    applyFilter,
    filterClassPrefix: "connections-filter",
  });
};

export default useConnectionsFilter;
