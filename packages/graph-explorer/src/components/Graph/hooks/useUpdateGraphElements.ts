import type cytoscape from "cytoscape";
import cloneDeep from "lodash/cloneDeep";
import { useEffect, useState } from "react";
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
  const cyElementsIds = new Set(cyElements.map(e => e.data("id")));
  const elementsIds = new Set(elements.map(e => e.data.id));

  return (
    cyElementsIds.size !== elementsIds.size ||
    !cyElementsIds.isSubsetOf(elementsIds)
  );
}

const useUpdateGraphElements = ({
  cy,
  nodes,
  edges,
  lockedNodesIds,
  disableLockOnChange,
}: UseUpdateGraphElementsProps) => {
  const [graphStructureVersion, setGraphStructureVersion] = useState(0);

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

    // Cytoscape edits node and edge objects in-memory, which can screw up any of our earlier logic
    // that expects graph data to be unchanged by effects and stuff. Cloning deeply here ensures that
    // cytoscape operates on its own set of objects. Not the best thing in the world to do, maybe, but
    // it means fewer opportunities for mind-melting bugs/behavior...
    cy.json({ elements: cloneDeep({ nodes, edges }) });
  }, [cy, nodes, edges, lockedNodesIds, disableLockOnChange]);

  return graphStructureVersion;
};

export default useUpdateGraphElements;
