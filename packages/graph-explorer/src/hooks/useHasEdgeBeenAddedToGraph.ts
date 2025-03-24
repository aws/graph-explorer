import { EdgeId, edgesAtom } from "@/core";
import { useRecoilValue } from "recoil";

/** Returns true if the given edge has been added to the graph. */
export function useHasEdgeBeenAddedToGraph(id: EdgeId) {
  return useRecoilValue(edgesAtom).has(id);
}
