import { atom } from "jotai";
import { atomFamily, atomWithReset, RESET } from "jotai/utils";
import {
  createRenderedEdgeId,
  getEdgeIdFromRenderedEdgeId,
  RenderedEdgeId,
  type Edge,
  type EdgeId,
} from "@/core";
import { filteredNodesSelector } from "./nodes";

export function toEdgeMap(edges: Edge[]): Map<EdgeId, Edge> {
  return new Map(edges.map(e => [e.id, e]));
}

export const edgesAtom = atomWithReset(new Map<EdgeId, Edge>());

export const edgeSelector = atomFamily((id: EdgeId) =>
  atom(get => get(edgesAtom).get(id) ?? null)
);

export const edgesSelectedIdsAtom = atomWithReset(new Set<EdgeId>());

export const edgesSelectedIdsRenderedAtom = atom(
  get => new Set(get(edgesSelectedIdsAtom).values().map(createRenderedEdgeId)),
  (_get, set, newValue: Set<RenderedEdgeId> | typeof RESET) => {
    if (newValue === RESET) {
      set(edgesSelectedIdsAtom, newValue);
      return;
    }

    set(
      edgesSelectedIdsAtom,
      new Set(newValue.values().map(getEdgeIdFromRenderedEdgeId))
    );
  }
);

export const edgesOutOfFocusIdsAtom = atomWithReset(new Set<EdgeId>());

export const edgesOutOfFocusRenderedIdsAtom = atom(
  get =>
    new Set(get(edgesOutOfFocusIdsAtom).values().map(createRenderedEdgeId)),
  (_get, set, newValue: Set<RenderedEdgeId> | typeof RESET) => {
    if (newValue === RESET) {
      set(edgesOutOfFocusIdsAtom, newValue);
      return;
    }

    set(
      edgesOutOfFocusIdsAtom,
      new Set(newValue.values().map(getEdgeIdFromRenderedEdgeId))
    );
  }
);

export const edgesFilteredIdsAtom = atomWithReset(new Set<EdgeId>());
export const edgesTypesFilteredAtom = atomWithReset(new Set<string>());

/**
 * Filters the edges added to the graph by:
 *
 * - Edge types unselected in the filter sidebar
 * - Vertex types unselected in the filter sidebar
 * - Individual edges hidden using the table view
 * - Individual vertices hidden using the table view
 *
 * If either the source or target vertex is hidden, the edge is also hidden.
 */
export const filteredEdgesSelector = atom(get => {
  const edges = get(edgesAtom);
  const filteredEdgeIds = get(edgesFilteredIdsAtom);
  const filteredEdgeTypes = get(edgesTypesFilteredAtom);

  // Get the IDs of the existing vertices
  const existingVertexIds = new Set(get(filteredNodesSelector).keys());

  return new Map(
    edges
      .entries()
      .filter(([_id, edge]) => !filteredEdgeTypes.has(edge.type))
      .filter(([_id, edge]) => !filteredEdgeIds.has(edge.id))
      .filter(([_id, edge]) => existingVertexIds.has(edge.source))
      .filter(([_id, edge]) => existingVertexIds.has(edge.target))
  );
});
