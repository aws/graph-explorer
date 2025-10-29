import {
  edgesSelectedIdsAtom,
  nodesSelectedIdsAtom,
  type EdgeId,
  type VertexId,
} from "@/core";
import { useAtom } from "jotai";
import { useAutoOpenDetailsSidebar } from "./useAutoOpenDetailsSidebar";

/**
 * Hook for managing graph entity selection state (vertices and edges).
 *
 * Provides access to the current selection and a function to update it.
 * Automatically opens the details sidebar when a single entity is selected
 * (unless side effects are disabled).
 */
export function useGraphSelection() {
  const [selectedVertices, setSelectedVertices] = useAtom(nodesSelectedIdsAtom);
  const [selectedEdges, setSelectedEdges] = useAtom(edgesSelectedIdsAtom);

  const autoOpenDetails = useAutoOpenDetailsSidebar();

  return {
    /**
     * Current graph selection state.
     *
     * Contains arrays of selected vertex and edge IDs.
     */
    graphSelection: {
      /** Array of currently selected vertex IDs */
      vertices: Array.from(selectedVertices),
      /** Array of currently selected edge IDs */
      edges: Array.from(selectedEdges),
    },

    /**
     * Replaces the graph selection state.
     *
     * Replaces the current selection with the provided vertices and edges.
     * When exactly one entity (vertex or edge) is selected, automatically
     * opens the details sidebar unless `disableSideEffects` is true.
     *
     * @param options - Selection update options
     * @param options.vertices - Iterable of vertex IDs to select (defaults to empty)
     * @param options.edges - Iterable of edge IDs to select (defaults to empty)
     * @param options.disableSideEffects - If true, prevents automatic sidebar opening (defaults to false)
     *
     * @example
     * ```tsx
     * // Select multiple vertices
     * replaceGraphSelection({
     *   vertices: ['v1', 'v2', 'v3']
     * });
     *
     * // Select a single edge (opens details sidebar)
     * replaceGraphSelection({
     *   edges: ['edge-1']
     * });
     *
     * // Select without opening sidebar
     * replaceGraphSelection({
     *   vertices: ['v1'],
     *   disableSideEffects: true
     * });
     *
     * // Clear selection
     * replaceGraphSelection({
     *   vertices: [],
     *   edges: []
     * });
     *
     * // Works with Sets
     * const vertexSet = new Set(['v1', 'v2']);
     * replaceGraphSelection({ vertices: vertexSet });
     * ```
     */
    replaceGraphSelection: ({
      vertices = [],
      edges = [],
      disableSideEffects = false,
    }: {
      vertices?: Iterable<VertexId>;
      edges?: Iterable<EdgeId>;
      disableSideEffects?: boolean;
    }) => {
      const nodeIds = new Set(vertices);
      const edgeIds = new Set(edges);

      setSelectedVertices(nodeIds);
      setSelectedEdges(edgeIds);

      const onlyOneEntitySelected = nodeIds.size + edgeIds.size === 1;

      if (!disableSideEffects && onlyOneEntitySelected) {
        autoOpenDetails();
      }
    },
  };
}
