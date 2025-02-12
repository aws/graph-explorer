import cytoscape from "cytoscape";
import { useEffect, useRef } from "react";
import type { CytoscapeType } from "../Graph.model";
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
}

/**
 * Performs a layout on the graph when new nodes or edges are added or removed.
 *
 * Existing nodes are locked when the layout is run, and unlocked when the layout is complete.
 */
function useUpdateLayout({
  cy,
  layout,
  additionalLayoutsConfig,
  onLayoutUpdated,
  useAnimation,
  graphStructureVersion,
  mounted,
}: UseUpdateLayout) {
  const previousNodesRef = useRef(new Set<string>());
  const previousLayoutRef = useRef(layout);
  const previousGraphStructureVersionRef = useRef(graphStructureVersion);

  useEffect(() => {
    // Ensure Cytoscape is mounted and skip the first graph structure version
    if (!cy || !layout || !mounted || graphStructureVersion === 0) {
      return;
    }

    // Only lock the previous nodes if the layout is the same, the graph has been updated, and there is at least one node.
    const shouldLock =
      previousLayoutRef.current === layout &&
      previousGraphStructureVersionRef.current !== graphStructureVersion &&
      previousNodesRef.current.size > 0;

    // Reduce the number of iterations over the node collection
    const nodesInGraph = cy.nodes();
    const nodesToLock = shouldLock
      ? nodesInGraph.filter(cyNode =>
          previousNodesRef.current.has(cyNode.data().id)
        )
      : [];

    if (shouldLock) {
      // Lock all the previous nodes
      cy.batch(() => {
        nodesToLock.forEach(node => {
          node.lock();
        });
      });
    }

    // Perform the layout for any new nodes
    runLayout(cy, layout, additionalLayoutsConfig, useAnimation);
    onLayoutUpdated?.(cy, layout);

    if (shouldLock) {
      // Unlock all the previous nodes
      cy.batch(() => {
        nodesToLock.forEach(node => {
          node.unlock();
        });
      });
    }

    // Update the refs for previous state so we can compare the next time the graph is updated
    previousLayoutRef.current = layout;
    previousNodesRef.current = new Set(nodesInGraph.map(node => node.id()));
    previousGraphStructureVersionRef.current = graphStructureVersion;
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
