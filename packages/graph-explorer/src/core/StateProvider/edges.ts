import { atom, selector, selectorFamily } from "recoil";
import type { Edge, EdgeId } from "@/types/entities";
import isDefaultValue from "./isDefaultValue";
import { filteredNodesSelector, nodesTypesFilteredAtom } from "./nodes";

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
    get(edgesHiddenIdsAtom).size > 0 && set(edgesHiddenIdsAtom, cleanFn);
    get(edgesOutOfFocusIdsAtom).size > 0 &&
      set(edgesOutOfFocusIdsAtom, cleanFn);
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

export const edgesHiddenIdsAtom = atom<Set<EdgeId>>({
  key: "edges-hidden-ids",
  default: new Set(),
});

export const edgesOutOfFocusIdsAtom = atom<Set<EdgeId>>({
  key: "edges-out-of-focus-ids",
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
 * - Edges where the source or target vertex is filtered out
 *
 * If either the source or target vertex is hidden, the edge is also hidden.
 */
export const filteredEdgesSelector = selector<Map<EdgeId, Edge>>({
  key: "filtered-edges",
  get: ({ get }) => {
    const edges = get(edgesAtom);
    const filteredEdgeTypes = get(edgesTypesFilteredAtom);
    const filteredVertexTypes = get(nodesTypesFilteredAtom);
    const filteredNodes = get(filteredNodesSelector);

    return new Map(
      edges
        .entries()
        .filter(([_id, edge]) => !filteredEdgeTypes.has(edge.type))
        .filter(([_id, edge]) => !filteredVertexTypes.has(edge.sourceType))
        .filter(([_id, edge]) => !filteredVertexTypes.has(edge.targetType))
        .filter(([_id, edge]) => filteredNodes.has(edge.source))
        .filter(([_id, edge]) => filteredNodes.has(edge.target))
    );
  },
});
