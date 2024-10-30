import { atom, selector } from "recoil";
import type { Edge } from "@/types/entities";
import isDefaultValue from "./isDefaultValue";

export type Edges = Array<Edge>;

export const edgesAtom = atom<Edges>({
  key: "edges",
  default: [],
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

    const cleanFn = (curr: Set<string>) => {
      const existingEdgesIds = new Set<string>();
      curr.forEach(eId => {
        const exist = newValue.find(n => n.id === eId);
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

export const edgesSelectedIdsAtom = atom<Set<string>>({
  key: "edges-selected-ids",
  default: new Set(),
});

export const edgesHiddenIdsAtom = atom<Set<string>>({
  key: "edges-hidden-ids",
  default: new Set(),
});

export const edgesOutOfFocusIdsAtom = atom<Set<string>>({
  key: "edges-out-of-focus-ids",
  default: new Set(),
});

export const edgesFilteredIdsAtom = atom<Set<string>>({
  key: "edges-filtered-ids",
  default: new Set(),
});

export const edgesTypesFilteredAtom = atom<Set<string>>({
  key: "edges-types-filtered",
  default: new Set(),
});
