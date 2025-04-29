import { atom, useAtomValue } from "jotai";
import { atomFamily, atomWithReset, RESET } from "jotai/utils";
import {
  createRenderedVertexId,
  getVertexIdFromRenderedVertexId,
  RenderedVertexId,
  type Vertex,
  type VertexId,
} from "@/core";

export function toNodeMap(nodes: Vertex[]): Map<VertexId, Vertex> {
  return new Map(nodes.map(n => [n.id, n]));
}

export const nodesAtom = atomWithReset(new Map<VertexId, Vertex>());

export const nodeSelector = atomFamily((id: VertexId) =>
  atom(get => get(nodesAtom).get(id) ?? null)
);

export const nodesSelectedIdsAtom = atomWithReset(new Set<VertexId>());

export const nodesSelectedRenderedIdsAtom = atom(
  get =>
    new Set(get(nodesSelectedIdsAtom).values().map(createRenderedVertexId)),
  (_get, set, newValue: Set<RenderedVertexId> | typeof RESET) => {
    if (newValue === RESET) {
      set(nodesSelectedIdsAtom, newValue);
      return;
    }

    set(
      nodesSelectedIdsAtom,
      new Set(newValue.values().map(getVertexIdFromRenderedVertexId))
    );
  }
);

export const nodesOutOfFocusIdsAtom = atomWithReset(new Set<VertexId>());

export const nodesOutOfFocusRenderedIdsAtom = atom(
  get =>
    new Set(get(nodesOutOfFocusIdsAtom).values().map(createRenderedVertexId)),
  (_get, set, newValue: Set<RenderedVertexId> | typeof RESET) => {
    if (newValue === RESET) {
      set(nodesOutOfFocusIdsAtom, newValue);
      return;
    }

    set(
      nodesOutOfFocusIdsAtom,
      new Set(newValue.values().map(getVertexIdFromRenderedVertexId))
    );
  }
);

export const nodesFilteredIdsAtom = atomWithReset(new Set<VertexId>());
export const nodesTypesFilteredAtom = atomWithReset(new Set<string>());

/**
 * Filters the nodes added to the graph by:
 *
 * - Vertex types unselected in the filter sidebar
 * - Individual nodes hidden using the table view
 */
export const filteredNodesSelector = atom(get => {
  const filteredIds = get(nodesFilteredIdsAtom);
  const filteredTypes = get(nodesTypesFilteredAtom);

  return new Map(
    get(nodesAtom)
      .entries()
      .filter(([_id, node]) => !filteredTypes.has(node.type))
      .filter(([_id, node]) => !filteredIds.has(node.id))
  );
});

export function useNode(id: VertexId) {
  const node = useAtomValue(nodesAtom).get(id);

  if (!node) {
    throw new Error(`Node with id ${id} not found in displayNodes`);
  }

  return node;
}
