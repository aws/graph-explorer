import { nodesAtom, VertexId } from "@/core";
import { useAtomValue } from "jotai";

/** Returns true if the given vertex has been added to the graph. */
export function useHasVertexBeenAddedToGraph(id: VertexId) {
  return useAtomValue(nodesAtom).has(id);
}
