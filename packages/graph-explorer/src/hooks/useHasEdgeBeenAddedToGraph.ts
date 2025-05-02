import { EdgeId, edgesAtom } from "@/core";
import { useAtomValue } from "jotai";

/** Returns true if the given edge has been added to the graph. */
export function useHasEdgeBeenAddedToGraph(id: EdgeId) {
  return useAtomValue(edgesAtom).has(id);
}
