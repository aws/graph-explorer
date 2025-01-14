import { atom, selector, selectorFamily } from "recoil";
import type { Edge, EdgeId } from "@/types/entities";
import isDefaultValue from "./isDefaultValue";
import { nodesFilteredIdsAtom, nodesTypesFilteredAtom } from "./nodes";

export type Edges = Map<EdgeId, Edge>;

export function toEdgeMap(edges: Edge[]): Edges {
  return new Map(edges.map(e => [e.id, e]));
}

export const edgesAtom = atom<Edges>({
  key: "edges",
  default: new Map(),
});

export const edgesSelector = selector<Edges>({
  key: "edges-selector",
  get: ({ get }) => {
    return get(edgesAtom);
  },
  set: ({ get, set }, newValue) => {
    if (isDefaultValue(newValue)) {
      set(edgesAtom, newValue);
      return;
    }

    set(edgesAtom, newValue);

    const cleanFn = (curr: Set<EdgeId>) => {
      const existingEdgesIds = new Set<EdgeId>();
      curr.forEach(eId => {
        const exist = newValue.has(eId);
        if (exist) {
          existingEdgesIds.add(eId);
        }
      });
      return existingEdgesIds;
    };
    // Clean all dependent states
    get(edgesSelectedIdsAtom).size > 0 && set(edgesSelectedIdsAtom, cleanFn);
    get(edgesOutOfFocusIdsAtom).size > 0 &&
      set(edgesOutOfFocusIdsAtom, cleanFn);
    get(edgesFilteredIdsAtom).size > 0 && set(edgesFilteredIdsAtom, cleanFn);
  },
});

export const edgeSelector = selectorFamily({
  key: "edge-selector",
  get:
    (id: EdgeId) =>
    ({ get }) => {
      return get(edgesAtom).get(id) ?? null;
    },
});

export const edgesSelectedIdsAtom = atom<Set<EdgeId>>({
  key: "edges-selected-ids",
  default: new Set(),
});

export const edgesOutOfFocusIdsAtom = atom<Set<EdgeId>>({
  key: "edges-out-of-focus-ids",
  default: new Set(),
});

export const edgesFilteredIdsAtom = atom<Set<EdgeId>>({
  key: "edges-filtered-ids",
  default: new Set(),
});

export const edgesTypesFilteredAtom = atom<Set<string>>({
  key: "edges-types-filtered",
  default: new Set(),
});

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
export const filteredEdgesSelector = selector<Map<EdgeId, Edge>>({
  key: "filtered-edges",
  get: ({ get }) => {
    const edges = get(edgesAtom);
    const filteredEdgeIds = get(edgesFilteredIdsAtom);
    const filteredEdgeTypes = get(edgesTypesFilteredAtom);
    const filteredVertexIds = get(nodesFilteredIdsAtom);
    const filteredVertexTypes = get(nodesTypesFilteredAtom);

    return new Map(
      edges
        .entries()
        .filter(([_id, edge]) => !filteredEdgeTypes.has(edge.type))
        .filter(([_id, edge]) => !filteredVertexTypes.has(edge.sourceType))
        .filter(([_id, edge]) => !filteredVertexTypes.has(edge.targetType))
        .filter(([_id, edge]) => !filteredEdgeIds.has(edge.id))
        .filter(([_id, edge]) => !filteredVertexIds.has(edge.source))
        .filter(([_id, edge]) => !filteredVertexIds.has(edge.target))
    );
  },
});
