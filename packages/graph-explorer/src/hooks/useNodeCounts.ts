import { useQueries } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";
import {
  NeighborCountsQueryResponse,
  neighborsCountQuery,
} from "../connector/queries";
import { allAddedNeighborsSelector } from "../core/StateProvider/entitiesSelector";
import { nodesAtom } from "../core/StateProvider/nodes";
import { explorerSelector } from "../core/connector";
import { calculateNodeCounts } from "../core/calculateNodeCounts";

/**
 * Gets the calculated node counts for all the nodes added to the graph
 * @returns A map of node id to node counts
 */
export default function useNodeCounts() {
  const nodes = useRecoilValue(nodesAtom);

  const explorer = useRecoilValue(explorerSelector);

  // Get all unique node ids
  const nodeIds = [...new Set(nodes.map(node => node.data.id))];
  const addedNeighbors = useRecoilValue(allAddedNeighborsSelector(nodeIds));

  const query = useQueries({
    queries: nodeIds.map(id => ({
      ...neighborsCountQuery(id, explorer),
      select: (data: NeighborCountsQueryResponse | undefined) => {
        if (!data) {
          return;
        }

        return calculateNodeCounts(data, addedNeighbors.get(id) ?? []);
      },
    })),
  });
  const resultsMap = new Map(nodeIds.map((id, index) => [id, query[index]]));
  return resultsMap;
}
