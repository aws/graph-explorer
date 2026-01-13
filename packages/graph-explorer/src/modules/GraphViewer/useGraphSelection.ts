import { useAtom } from "jotai";

import {
  edgesSelectedIdsAtom,
  nodesSelectedIdsAtom,
  type EdgeId,
  type VertexId,
} from "@/core";

import { useAutoOpenDetailsSidebar } from "./useAutoOpenDetailsSidebar";

/**
 * Creates a graph selection object from sets of vertex and edge IDs.
 *
 * @param selectedVertices - Set of selected vertex IDs
 * @param selectedEdges - Set of selected edge IDs
 * @returns Graph selection object with arrays and selection check methods
 */
export function createGraphSelection(
  selectedVertices: Set<VertexId>,
  selectedEdges: Set<EdgeId>,
) {
  return {
    /** Array of currently selected vertex IDs */
    vertices: Array.from(selectedVertices),

    /** Array of currently selected edge IDs */
    edges: Array.from(selectedEdges),

    /**
     * Checks if a vertex is currently selected.
     *
     * @param vertexId - The vertex ID to check
     * @returns true if the vertex is selected, false otherwise
     */
    isVertexSelected: (vertexId: VertexId) => selectedVertices.has(vertexId),

    /**
     * Checks if an edge is currently selected.
     *
     * @param edgeId - The edge ID to check
     * @returns true if the edge is selected, false otherwise
     */
    isEdgeSelected: (edgeId: EdgeId) => selectedEdges.has(edgeId),
  };
}

/**
 * Graph selection state object.
 *
 * Contains arrays of selected vertex and edge IDs, along with methods
 * to check if specific entities are selected.
 *
 * @property vertices - Array of currently selected vertex IDs
 * @property edges - Array of currently selected edge IDs
 * @property isVertexSelected - Function to check if a vertex ID is selected
 * @property isEdgeSelected - Function to check if an edge ID is selected
 */
export type GraphSelection = ReturnType<typeof createGraphSelection>;

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
     * Contains arrays of selected vertex and edge IDs, and methods to check selection.
     */
    graphSelection: createGraphSelection(selectedVertices, selectedEdges),

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
