import { atom, selector, selectorFamily, useRecoilValue } from "recoil";
import {
  createRenderedVertexId,
  getVertexIdFromRenderedVertexId,
  type Vertex,
  type VertexId,
} from "@/core";
import isDefaultValue from "./isDefaultValue";

export function toNodeMap(nodes: Vertex[]): Map<VertexId, Vertex> {
  return new Map(nodes.map(n => [n.id, n]));
}

export const nodesAtom = atom<Map<VertexId, Vertex>>({
  key: "nodes",
  default: new Map(),
});

export const nodeSelector = selectorFamily({
  key: "node-selector",
  get:
    (id: VertexId) =>
    ({ get }) => {
      return get(nodesAtom).get(id) ?? null;
    },
});

export const nodesSelectedIdsAtom = atom<Set<VertexId>>({
  key: "nodes-selected-ids",
  default: new Set(),
});

export const nodesSelectedRenderedIdsAtom = selector({
  key: "nodes-selected-rendered-ids",
  get: ({ get }) =>
    new Set(get(nodesSelectedIdsAtom).values().map(createRenderedVertexId)),
  set: ({ set }, newValue) => {
    if (isDefaultValue(newValue)) {
      set(nodesSelectedIdsAtom, newValue);
      return;
    }

    set(
      nodesSelectedIdsAtom,
      new Set(newValue.values().map(getVertexIdFromRenderedVertexId))
    );
  },
});

export const nodesOutOfFocusIdsAtom = atom<Set<VertexId>>({
  key: "nodes-out-of-focus-ids",
  default: new Set(),
});

export const nodesOutOfFocusRenderedIdsAtom = selector({
  key: "nodes-out-of-focus-rendered-ids",
  get: ({ get }) =>
    new Set(get(nodesOutOfFocusIdsAtom).values().map(createRenderedVertexId)),
  set: ({ set }, newValue) => {
    if (isDefaultValue(newValue)) {
      set(nodesOutOfFocusIdsAtom, newValue);
      return;
    }

    set(
      nodesOutOfFocusIdsAtom,
      new Set(newValue.values().map(getVertexIdFromRenderedVertexId))
    );
  },
});

export const nodesFilteredIdsAtom = atom<Set<VertexId>>({
  key: "nodes-filtered-ids",
  default: new Set(),
});

export const nodesTypesFilteredAtom = atom<Set<string>>({
  key: "nodes-types-filtered",
  default: new Set(),
});

/**
 * Filters the nodes added to the graph by:
 *
 * - Vertex types unselected in the filter sidebar
 * - Individual nodes hidden using the table view
 */
export const filteredNodesSelector = selector<Map<VertexId, Vertex>>({
  key: "filtered-nodes-selector",
  get: ({ get }) => {
    const filteredIds = get(nodesFilteredIdsAtom);
    const filteredTypes = get(nodesTypesFilteredAtom);

    return new Map(
      get(nodesAtom)
        .entries()
        .filter(([_id, node]) => !filteredTypes.has(node.type))
        .filter(([_id, node]) => !filteredIds.has(node.id))
    );
  },
});

export function useNode(id: VertexId) {
  const node = useRecoilValue(nodesAtom).get(id);

  if (!node) {
    throw new Error(`Node with id ${id} not found in displayNodes`);
  }

  return node;
}
