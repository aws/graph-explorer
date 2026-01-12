import { atom, useAtomValue, useSetAtom } from "jotai";
import { atomWithReset } from "jotai/utils";
import { atomFamily } from "jotai-family";
import { type Vertex, type VertexId, createVertex } from "@/core";
import { vertexDetailsQuery } from "@/connector";
import { useQuery } from "@tanstack/react-query";

export function toNodeMap(nodes: Iterable<Vertex>): Map<VertexId, Vertex> {
  return new Map(Iterator.from(nodes).map(n => [n.id, n]));
}

export const nodesAtom = atomWithReset(new Map<VertexId, Vertex>());

export const nodeSelector = atomFamily((id: VertexId) =>
  atom(get => get(nodesAtom).get(id) ?? null),
);

export const nodesSelectedIdsAtom = atomWithReset(new Set<VertexId>());
export const nodesOutOfFocusIdsAtom = atomWithReset(new Set<VertexId>());
export const nodesFilteredIdsAtom = atomWithReset(new Set<VertexId>());
export const nodesTypesFilteredAtom = atomWithReset(new Set<string>());

const toggleFilteredNodeAtom = atom(null, (_get, set, vertexId: VertexId) => {
  set(nodesFilteredIdsAtom, prev => {
    const newSet = new Set(prev);
    if (prev.has(vertexId)) {
      newSet.delete(vertexId);
    } else {
      newSet.add(vertexId);
    }
    return newSet;
  });
});

export function useToggleFilteredNode() {
  return useSetAtom(toggleFilteredNodeAtom);
}

/**
 * Returns a Vertex object for the given id, using the following fallback strategy:
 *
 * 1. Prefer vertex from vertexDetailsQuery
 * 2. Fallback to vertex in nodesAtom map
 * 3. Fallback to creating a new Vertex object using createVertex
 */
export function useVertex(id: VertexId) {
  const vertexDetailsQueryResult = useQuery(vertexDetailsQuery(id));
  const nodesMap = useAtomValue(nodesAtom);

  // Fallback strategy:
  // 1. Prefer vertex from vertexDetailsQuery
  // 2. Fallback to vertex in nodesAtom map
  // 3. Fallback to creating a new Vertex object using createVertex
  if (vertexDetailsQueryResult.data?.vertex) {
    return vertexDetailsQueryResult.data.vertex;
  }

  const nodeFromMap = nodesMap.get(id);
  if (nodeFromMap) {
    return nodeFromMap;
  }

  // Create a minimal vertex as last fallback
  return createVertex({ id });
}

export const nodesTableFiltersAtom =
  atomWithReset(Array<{ id: string; value: unknown }>());
export const nodesTableSortsAtom =
  atomWithReset(Array<{ id: string; desc?: boolean }>());
