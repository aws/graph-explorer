import { VertexId } from "@/@types/entities";
import { nodesAtom } from "@/core";
import { useRecoilValue } from "recoil";

/** Returns true if the given vertex has been added to the graph. */
export function useHasVertexBeenAddedToGraph(id: VertexId) {
  return useRecoilValue(nodesAtom).has(id);
}
