import type { CollectionReturnValue } from "cytoscape";
import { useEffect, useRef } from "react";
import type { CytoscapeType } from "../Graph.model";

interface UseManageElementsSelection {
  cy?: CytoscapeType;
  hiddenEdgesIds: Set<string | number>;
  hiddenNodesIds: Set<string | number>;
  outOfFocusNodesIds: Set<string | number>;
  outOfFocusEdgesIds: Set<string | number>;
  graphStructureVersion: number;
  hideEdges?: boolean;
}

export default function useManageElementsVisibility({
  cy,
  hiddenNodesIds,
  hiddenEdgesIds,
  outOfFocusNodesIds,
  outOfFocusEdgesIds,
  graphStructureVersion,
  hideEdges,
}: UseManageElementsSelection) {
  const removedEntities = useRef<CollectionReturnValue | undefined>();
  // manage hidden nodes and edges
  useEffect(() => {
    if (!cy) {
      return;
    }

    cy.batch(() => {
      cy.nodes().forEach(node => {
        const id = node.data("id");
        if (!hiddenNodesIds.has(id)) {
          node.removeClass("hidden");
        } else {
          node.addClass("hidden");
        }

        if (!outOfFocusNodesIds.has(id)) {
          node.removeClass("out-of-focus");
        } else {
          node.addClass("out-of-focus");
        }
      });
    });
  }, [cy, hiddenNodesIds, graphStructureVersion, outOfFocusNodesIds]);

  useEffect(() => {
    if (!cy) {
      return;
    }

    cy.batch(() => {
      cy.edges().forEach(edge => {
        const id = edge.data("id");
        if (!hiddenEdgesIds.has(id)) {
          edge.removeClass("hidden");
        } else {
          edge.addClass("hidden");
        }

        const sourceId = edge.source().data("id");
        const targetId = edge.target().data("id");
        if (
          outOfFocusEdgesIds.has(id) ||
          outOfFocusNodesIds.has(sourceId) ||
          outOfFocusNodesIds.has(targetId)
        ) {
          edge.addClass("out-of-focus");
        } else {
          edge.removeClass("out-of-focus");
        }
      });
    });
  }, [
    cy,
    hiddenEdgesIds,
    graphStructureVersion,
    outOfFocusNodesIds,
    outOfFocusEdgesIds,
  ]);

  useEffect(() => {
    if (!cy) {
      return;
    }

    if (!hideEdges) {
      removedEntities.current?.restore();
    } else {
      removedEntities.current = cy.edges().remove();
    }
  }, [cy, hideEdges]);
}
