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
    if (!cy || !layout || !mounted) {
      return;
    }

    const nodesInGraph = cy.nodes();
    if (nodesInGraph.length) {
      const shouldLock =
        previousLayoutRef.current === layout &&
        previousGraphStructureVersionRef.current !== graphStructureVersion;

      if (shouldLock) {
        nodesInGraph
          .filter(cyNode => previousNodesRef.current.has(cyNode.data().id))
          .forEach(node => {
            node.lock();
          });
      }

      runLayout(cy, layout, additionalLayoutsConfig, useAnimation);
      onLayoutUpdated?.(cy, layout);

      if (shouldLock) {
        nodesInGraph
          .filter(cyNode => previousNodesRef.current.has(cyNode.data().id))
          .forEach(node => {
            node.unlock();
          });
      }

      previousNodesRef.current = new Set(nodesInGraph.map(node => node.id()));
      previousLayoutRef.current = layout;
    }
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
