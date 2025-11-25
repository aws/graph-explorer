import type { EdgeId, VertexId } from "@/core";
import type { GraphSelection } from "@/modules/GraphViewer/useGraphSelection";

/**
 * Discriminated union representing the target of a context menu action.
 * Determines what entities the context menu should operate on based on
 * what was clicked and what is currently selected.
 */
export type ContextMenuTarget =
  | { type: "single-vertex"; vertexId: VertexId }
  | { type: "single-edge"; edgeId: EdgeId }
  | { type: "multiple-vertices"; vertexIds: VertexId[] }
  | { type: "multiple-edges"; edgeIds: EdgeId[] }
  | {
      type: "multiple-vertices-and-edges";
      vertexIds: VertexId[];
      edgeIds: EdgeId[];
    }
  | { type: "none" };

/**
 * Determines the appropriate context menu target based on affected entities and current selection.
 *
 * The hook implements the following priority logic:
 * 1. If affected entities are within the current selection, use the selection
 * 2. If no entities are affected (canvas click), return type "none"
 * 3. Otherwise, use only the affected entities
 *
 * This allows context menus to intelligently operate on either:
 * - The clicked entity (when nothing is selected)
 * - The entire selection (when clicking within a selection)
 * - All graph entities (when clicking empty canvas)
 *
 * @param params.affectedVertexIds - Vertex IDs directly affected by the context menu trigger (e.g., right-clicked)
 * @param params.affectedEdgeIds - Edge IDs directly affected by the context menu trigger
 * @param params.graphSelection - Current graph selection state with vertices, edges, and selection check methods
 * @returns A discriminated union indicating the target type and relevant entity IDs
 *
 * @example
 * // Right-click on a single unselected vertex
 * const target = useContextMenuTarget({
 *   affectedVertexIds: ['v1'],
 *   affectedEdgeIds: [],
 *   graphSelection: { vertices: [], edges: [], isVertexSelected: () => false, isEdgeSelected: () => false }
 * });
 * // Returns: { type: "single-vertex", vertexId: "v1" }
 *
 * @example
 * // Right-click on a vertex that's part of a multi-vertex selection
 * const target = useContextMenuTarget({
 *   affectedVertexIds: ['v1'],
 *   affectedEdgeIds: [],
 *   graphSelection: { vertices: ['v1', 'v2', 'v3'], edges: [], isVertexSelected: (id) => ['v1', 'v2', 'v3'].includes(id), isEdgeSelected: () => false }
 * });
 * // Returns: { type: "multiple-vertices", vertexIds: ["v1", "v2", "v3"] }
 *
 * @example
 * // Right-click on empty canvas
 * const target = useContextMenuTarget({
 *   affectedVertexIds: [],
 *   affectedEdgeIds: [],
 *   graphSelection: { vertices: [], edges: [], isVertexSelected: () => false, isEdgeSelected: () => false }
 * });
 * // Returns: { type: "none" }
 */
export function useContextMenuTarget({
  affectedVertexIds,
  affectedEdgeIds,
  graphSelection,
}: {
  affectedVertexIds: VertexId[];
  affectedEdgeIds: EdgeId[];
  graphSelection: GraphSelection;
}): ContextMenuTarget {
  // Early return for canvas click (no affected entities)
  if (affectedVertexIds.length === 0 && affectedEdgeIds.length === 0) {
    return { type: "none" };
  }

  // Check if affected is within selection (short-circuits on first match)
  const hasAffectedInSelection =
    (affectedVertexIds.length > 0 &&
      affectedVertexIds.some(id => graphSelection.isVertexSelected(id))) ||
    (affectedEdgeIds.length > 0 &&
      affectedEdgeIds.some(id => graphSelection.isEdgeSelected(id)));

  // Use selection when affected is within it
  if (hasAffectedInSelection) {
    const selectedVertexIds = graphSelection.vertices;
    const selectedEdgeIds = graphSelection.edges;

    // Single vertex selected that matches single affected
    if (
      selectedVertexIds.length === 1 &&
      selectedEdgeIds.length === 0 &&
      affectedVertexIds.length === 1 &&
      selectedVertexIds[0] === affectedVertexIds[0]
    ) {
      return { type: "single-vertex", vertexId: selectedVertexIds[0] };
    }
    // Single edge selected that matches single affected
    if (
      selectedEdgeIds.length === 1 &&
      selectedVertexIds.length === 0 &&
      affectedEdgeIds.length === 1 &&
      selectedEdgeIds[0] === affectedEdgeIds[0]
    ) {
      return { type: "single-edge", edgeId: selectedEdgeIds[0] };
    }
    if (selectedVertexIds.length > 0 && selectedEdgeIds.length === 0) {
      return { type: "multiple-vertices", vertexIds: selectedVertexIds };
    }
    if (selectedEdgeIds.length > 0 && selectedVertexIds.length === 0) {
      return { type: "multiple-edges", edgeIds: selectedEdgeIds };
    }
    return {
      type: "multiple-vertices-and-edges",
      vertexIds: selectedVertexIds,
      edgeIds: selectedEdgeIds,
    };
  }

  // Use affected entities (not in selection)
  if (affectedVertexIds.length === 1 && affectedEdgeIds.length === 0) {
    return { type: "single-vertex", vertexId: affectedVertexIds[0] };
  }
  if (affectedEdgeIds.length === 1 && affectedVertexIds.length === 0) {
    return { type: "single-edge", edgeId: affectedEdgeIds[0] };
  }
  if (affectedVertexIds.length > 0 && affectedEdgeIds.length === 0) {
    return { type: "multiple-vertices", vertexIds: affectedVertexIds };
  }
  if (affectedEdgeIds.length > 0 && affectedVertexIds.length === 0) {
    return { type: "multiple-edges", edgeIds: affectedEdgeIds };
  }
  return {
    type: "multiple-vertices-and-edges",
    vertexIds: affectedVertexIds,
    edgeIds: affectedEdgeIds,
  };
}
