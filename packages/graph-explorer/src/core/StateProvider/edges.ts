import { atom, useAtomValue, useSetAtom } from "jotai";
import { atomFamily } from "jotai-family";
import { atomWithReset } from "jotai/utils";

import type { Edge, EdgeId } from "@/core";

export function toEdgeMap(edges: Iterable<Edge>): Map<EdgeId, Edge> {
  return new Map(Iterator.from(edges).map(e => [e.id, e]));
}

export const edgesAtom = atomWithReset(new Map<EdgeId, Edge>());

export const edgeSelector = atomFamily((id: EdgeId) =>
  atom(get => get(edgesAtom).get(id) ?? null),
);

export const edgesSelectedIdsAtom = atomWithReset(new Set<EdgeId>());
export const edgesOutOfFocusIdsAtom = atomWithReset(new Set<EdgeId>());
export const edgesFilteredIdsAtom = atomWithReset(new Set<EdgeId>());
export const edgesTypesFilteredAtom = atomWithReset(new Set<string>());

const toggleFilteredEdgeAtom = atom(null, (_get, set, edgeId: EdgeId) => {
  set(edgesFilteredIdsAtom, prev => {
    const newSet = new Set(prev);
    if (prev.has(edgeId)) {
      newSet.delete(edgeId);
    } else {
      newSet.add(edgeId);
    }
    return newSet;
  });
});

export function useToggleFilteredEdge() {
  return useSetAtom(toggleFilteredEdgeAtom);
}

export const edgesTableFiltersAtom =
  atomWithReset(Array<{ id: string; value: unknown }>());
export const edgesTableSortsAtom =
  atomWithReset(Array<{ id: string; desc?: boolean }>());

/**
 * Get an edge by id from the canvas.
 *
 * This will throw an error if the edge is not found.
 * @param id The id of the edge to get
 */
export function useEdgeInCanvas(id: EdgeId) {
  const edgesInCanvas = useAtomValue(edgesAtom);

  const edge = edgesInCanvas.get(id);
  if (!edge) {
    // This should never happen
    throw new Error(`Edge ${id} not found`);
  }

  return edge;
}
