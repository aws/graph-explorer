import { atom, selector, selectorFamily } from "recoil";
import type { Edge, EdgeId } from "@/types/entities";
import isDefaultValue from "./isDefaultValue";

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

export const edgesHiddenIdsAtom = atom<Set<EdgeId>>({
  key: "edges-hidden-ids",
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
