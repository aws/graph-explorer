import { atom, selector, useRecoilValue } from "recoil";
import type { Vertex, VertexId } from "@/types/entities";
import isDefaultValue from "./isDefaultValue";

export function toNodeMap(nodes: Vertex[]): Map<VertexId, Vertex> {
  return new Map(nodes.map(n => [n.id, n]));
}

export const nodesAtom = atom<Map<VertexId, Vertex>>({
  key: "nodes",
  default: new Map(),
});

export const nodesSelector = selector<Map<VertexId, Vertex>>({
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
    const cleanFn = (curr: Set<VertexId>) => {
      const existingNodesIds = new Set<VertexId>();
      curr.forEach(nId => {
        const exist = newValue.get(nId);
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

export const nodesSelectedIdsAtom = atom<Set<VertexId>>({
  key: "nodes-selected-ids",
  default: new Set(),
});

export const nodesHiddenIdsAtom = atom<Set<VertexId>>({
  key: "nodes-hidden-ids",
  default: new Set(),
});

export const nodesOutOfFocusIdsAtom = atom<Set<VertexId>>({
  key: "nodes-out-of-focus-ids",
  default: new Set(),
});

export const nodesFilteredIdsAtom = atom<Set<VertexId>>({
  key: "nodes-filtered-ids",
  default: new Set(),
});

export const nodesTypesFilteredAtom = atom<Set<string>>({
  key: "nodes-types-filtered",
  default: new Set(),
});

export function useNode(id: VertexId) {
  const node = useRecoilValue(nodesAtom).get(id);

  if (!node) {
    throw new Error(`Node with id ${id} not found in displayNodes`);
  }

  return node;
}
