import { useAtomValue } from "jotai";

import { nodesAtom, type VertexId } from "@/core";

/** Returns true if the given vertex has been added to the graph. */
export function useHasVertexBeenAddedToGraph(id: VertexId) {
  return useAtomValue(nodesAtom).has(id);
}
