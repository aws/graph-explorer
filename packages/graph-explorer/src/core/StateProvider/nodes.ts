import { atom, selector } from "recoil";
import type { Vertex } from "@/types/entities";
import isDefaultValue from "./isDefaultValue";

export const nodesAtom = atom<Array<Vertex>>({
  key: "nodes",
  default: [],
});

export const nodesSelector = selector<Array<Vertex>>({
  key: "nodes-selector",
  get: ({ get }) => {
    return get(nodesAtom);
  },
  set: ({ get, set }, newValue) => {
    if (isDefaultValue(newValue)) {
      set(nodesAtom, newValue);
      return;
    }

    set(nodesAtom, newValue);
    const cleanFn = (curr: Set<string>) => {
      const existingNodesIds = new Set<string>();
      curr.forEach(nId => {
        const exist = newValue.find(n => n.id === nId);
        if (exist) {
          existingNodesIds.add(nId);
        }
      });
      return existingNodesIds;
    };
    // Clean all dependent states
    get(nodesSelectedIdsAtom).size > 0 && set(nodesSelectedIdsAtom, cleanFn);
    get(nodesHiddenIdsAtom).size > 0 && set(nodesHiddenIdsAtom, cleanFn);
    get(nodesOutOfFocusIdsAtom).size > 0 &&
      set(nodesOutOfFocusIdsAtom, cleanFn);
    get(nodesFilteredIdsAtom).size > 0 && set(nodesFilteredIdsAtom, cleanFn);
  },
});

export const nodesSelectedIdsAtom = atom<Set<string>>({
  key: "nodes-selected-ids",
  default: new Set(),
});

export const nodesHiddenIdsAtom = atom<Set<string>>({
  key: "nodes-hidden-ids",
  default: new Set(),
});

export const nodesOutOfFocusIdsAtom = atom<Set<string>>({
  key: "nodes-out-of-focus-ids",
  default: new Set(),
});

export const nodesFilteredIdsAtom = atom<Set<string>>({
  key: "nodes-filtered-ids",
  default: new Set(),
});

export const nodesTypesFilteredAtom = atom<Set<string>>({
  key: "nodes-types-filtered",
  default: new Set(),
});
