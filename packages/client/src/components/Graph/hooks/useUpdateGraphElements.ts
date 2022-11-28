import cytoscape from "cytoscape";
import cloneDeep from "lodash/cloneDeep";
import { useCallback, useEffect, useState } from "react";
import type { CytoscapeType, GraphEdge, GraphNode } from "../Graph.model";

export interface UseUpdateGraphElementsProps {
  cy?: CytoscapeType;
  nodes: GraphNode[];
  edges: GraphEdge[];
  lockedNodesIds: Set<string>;
  disableLockOnChange?: boolean;
}

function wereElementsAddedOrRemoved(
  cyElements: cytoscape.EdgeCollection | cytoscape.NodeCollection,
  elements: GraphNode[]
) {
  if (cyElements.length !== elements.length) {
    return true;
  }

  // see if any element ids are different
  const set = new Set(elements.map((e: GraphNode) => e.data.id));
  let result = false;
  cyElements.forEach((e: cytoscape.NodeSingular | cytoscape.EdgeSingular) => {
    const id = e.data().id;
    if (!set.has(id)) {
      result = true;
      return false;
    }
  });
  return result;
}

const useUpdateGraphElements = ({
  cy,
  nodes,
  edges,
  lockedNodesIds,
  disableLockOnChange,
}: UseUpdateGraphElementsProps): number => {
  const [graphStructureVersion, setGraphStructureVersion] = useState(0);

  const unlockNodes = useCallback(() => {
    if (!cy) {
      return;
    }

    cy.batch(() => {
      cy.nodes().forEach(node => {
        const id = node.data("id");
        if (!lockedNodesIds.has(id)) {
          node.unlock();
        }
      });
    });
  }, [cy, lockedNodesIds]);

  useEffect(() => {
    if (!cy) {
      return;
    }

    // When layout is ready, unlock all nodes locked during the addition
    cy.on("layoutready", unlockNodes);

    return () => {
      cy.off("layoutready", unlockNodes);
    };
  }, [cy, unlockNodes]);

  useEffect(() => {
    if (!cy) {
      return;
    }

    const structureChanged =
      wereElementsAddedOrRemoved(cy.nodes(), nodes) ||
      wereElementsAddedOrRemoved(cy.edges(), edges);

    if (structureChanged) {
      setGraphStructureVersion(v => v + 1);
    }

    if (structureChanged && !disableLockOnChange) {
      // If change, lock all nodes before add new nodes
      cy.nodes().lock();
    }

    // Cytoscape edits node and edge objects in-memory, which can screw up any of our earlier logic
    // that expects graph data to be unchanged by effects and stuff. Cloning deeply here ensures that
    // cytoscape operates on its own set of objects. Not the best thing in the world to do, maybe, but
    // it means fewer opportunities for mind-melting bugs/behavior...
    cy.json({ elements: cloneDeep({ nodes, edges }) });
  }, [cy, nodes, edges, lockedNodesIds, disableLockOnChange]);

  return graphStructureVersion;
};

export default useUpdateGraphElements;
