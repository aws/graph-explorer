import { useCallback } from "react";
import type { CytoscapeType } from "../Graph.model";
import useFilter from "./useFilter";

export type BlastRadiusConfig = {
  isActive?: boolean;
  numHops?: number;
  referenceNodeIds?: string[];
  referenceEdgeIds?: string[];
};

const useBlastRadius = (
  graphStructureVersion: number,
  cy?: CytoscapeType,
  {
    numHops = 3,
    isActive = true,
    referenceNodeIds,
    referenceEdgeIds,
  }: BlastRadiusConfig = {}
): void => {
  const applyFilter = useCallback(
    (cy: CytoscapeType) => {
      const elementsInRadius = cy.collection();

      if (!referenceNodeIds?.length && referenceEdgeIds?.length) {
        referenceEdgeIds.forEach(edgeId => {
          const edge = cy.getElementById(edgeId);
          const sourceNode = edge.source();
          const targetNode = edge.target();
          elementsInRadius.merge(sourceNode).merge(targetNode).merge(edge);
        });

        return elementsInRadius;
      }

      if (numHops <= 0 || !referenceNodeIds?.length) {
        return null;
      }

      referenceNodeIds.forEach(nodeId => {
        cy.elements().breadthFirstSearch({
          root: cy.getElementById(nodeId),
          visit: (node, edge, _pn, _i, depth) => {
            if (depth > numHops) {
              return false; // stop searching when we go out of depth
            }

            // Add node and edge to list
            elementsInRadius.merge(node);
            if (edge) {
              elementsInRadius.merge(edge);
            }
          },
        });
      });

      return elementsInRadius;
    },
    [referenceNodeIds, referenceEdgeIds, numHops]
  );

  useFilter({
    cy,
    graphStructureVersion,
    isFilterActive: isActive,
    applyFilter,
    filterClassPrefix: "blast-radius-filter",
  });
};

export default useBlastRadius;
