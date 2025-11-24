import type { EdgeId, VertexId } from "@/core";
import { nodesAtom } from "@/core/StateProvider/nodes";
import { edgesAtom } from "@/core/StateProvider/edges";
import { useAtomValue } from "jotai";

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
  | { type: "none"; vertexIds: VertexId[]; edgeIds: EdgeId[] };

export function useContextMenuTarget(params: {
  affectedVertexIds: VertexId[];
  affectedEdgeIds: EdgeId[];
  selectedVertexIds: VertexId[];
  selectedEdgeIds: EdgeId[];
}): ContextMenuTarget {
  const {
    affectedVertexIds,
    affectedEdgeIds,
    selectedVertexIds,
    selectedEdgeIds,
  } = params;

  // All the entities in the graph canvas
  const nodes = useAtomValue(nodesAtom);
  const edges = useAtomValue(edgesAtom);

  // Check if affected is within selection
  const affectedVertexInSelection =
    affectedVertexIds.length > 0 &&
    affectedVertexIds.some(id => selectedVertexIds.includes(id));
  const affectedEdgeInSelection =
    affectedEdgeIds.length > 0 &&
    affectedEdgeIds.some(id => selectedEdgeIds.includes(id));
  const affectedWithinSelection =
    affectedVertexInSelection || affectedEdgeInSelection;

  // Use selection when affected is within it
  if (affectedWithinSelection) {
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

  // None case - no affected entities, return all from graph
  if (affectedVertexIds.length === 0 && affectedEdgeIds.length === 0) {
    return {
      type: "none",
      vertexIds: Array.from(nodes.keys()),
      edgeIds: Array.from(edges.keys()),
    };
  }

  // Use affected entities
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
