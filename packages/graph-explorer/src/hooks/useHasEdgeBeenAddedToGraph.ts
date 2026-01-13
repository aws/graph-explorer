import { useAtomValue } from "jotai";

import { type EdgeId, edgesAtom } from "@/core";

/** Returns true if the given edge has been added to the graph. */
export function useHasEdgeBeenAddedToGraph(id: EdgeId) {
  return useAtomValue(edgesAtom).has(id);
}
