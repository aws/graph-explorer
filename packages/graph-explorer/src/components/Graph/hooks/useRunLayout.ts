import cytoscape from "cytoscape";
import isEqual from "lodash/isEqual";
import { useEffect, useRef } from "react";
import type { CytoscapeType, GraphNode } from "../Graph.model";
import { runLayout } from "../helpers/layout";

interface UseUpdateLayout {
  cy?: CytoscapeType;
  layout?: string;
  useAnimation?: boolean;
  additionalLayoutsConfig?: {
    [layoutName: string]: Partial<cytoscape.LayoutOptions>;
  };
  onLayoutUpdated?: (cy: CytoscapeType, layout: string) => void;
  graphStructureVersion: number;
  mounted: boolean;
  nodes: GraphNode[];
}

function useUpdateLayout({
  cy,
  layout,
  additionalLayoutsConfig,
  onLayoutUpdated,
  useAnimation,
  graphStructureVersion,
  mounted,
  nodes,
}: UseUpdateLayout) {
  const previousNodesRef = useRef<typeof nodes>([]);
  const previousLayoutRef = useRef(layout);

  useEffect(() => {
    if (cy && layout && mounted && cy.nodes().length) {
      const prevIds: string[] = previousNodesRef.current.map(node => {
        return node.data.id;
      });

      const shouldLock =
        previousLayoutRef.current === layout &&
        !isEqual(previousNodesRef.current, nodes);

      if (shouldLock) {
        cy.nodes()
          .filter(cyNode => prevIds.includes(cyNode.data().id))
          .forEach(node => {
            node.lock();
          });
      }

      runLayout(cy, layout, additionalLayoutsConfig, useAnimation);
      onLayoutUpdated?.(cy, layout);

      if (shouldLock) {
        cy.nodes()
          .filter(cyNode => prevIds.includes(cyNode.data().id))
          .forEach(node => {
            node.unlock();
          });
      }

      previousNodesRef.current = nodes;
      previousLayoutRef.current = layout;
    }
    // nodes variable is not a dependency because
    // it is kept in the reference and the hook will run using
    // graphStructureVersion as trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cy,
    layout,
    additionalLayoutsConfig,
    useAnimation,
    onLayoutUpdated,
    graphStructureVersion,
    mounted,
  ]);
}

export default useUpdateLayout;
