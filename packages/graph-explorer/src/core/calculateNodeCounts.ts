import { Vertex } from "../@types/entities";
import { VertexId } from "../connector/useGEFetchTypes";
import { NodeNeighborCounts } from "./StateProvider/entitiesSelector";

export type NodeCounts = {
  nodeId: VertexId;
  addedNeighbors: Vertex[];
  countsByType: Map<
    string,
    { totalCount: number; addedCount: number; collapsedCount: number }
  >;
  totalCount: number;
  addedCount: number;
  collapsedCount: number;
};

export function calculateAllNodeCounts(
  counts: NodeNeighborCounts[],
  allAddedNeighbors: Map<VertexId, Vertex[]>
): Map<VertexId, NodeCounts> {
  return counts.reduce((result, count) => {
    const nodeId = count.nodeId;
    const addedNeighbors = allAddedNeighbors.get(nodeId) ?? [];

    const nodeCounts = calculateNodeCounts(count, addedNeighbors);

    result.set(nodeId, nodeCounts);
    return result;
  }, new Map<VertexId, NodeCounts>());
}

export function calculateNodeCounts(
  count: NodeNeighborCounts,
  addedNeighbors: Vertex[]
): NodeCounts {
  const nodeId = count.nodeId;

  // Calculate added counts by type
  const addedCountsByType = addedNeighbors
    .map(n => n.data.type)
    .reduce(
      (map, type) => map.set(type, (map.get(type) || 0) + 1),
      new Map<string, number>()
    );

  // Combine all counts by type
  const countsByType: NodeCounts["countsByType"] = new Map();
  Array.from(count.counts).map(([type, totalCount]) => {
    const addedCount = addedCountsByType.get(type) || 0;
    countsByType.set(type, {
      addedCount,
      totalCount,
      collapsedCount: totalCount - addedCount,
    });
  });

  return {
    nodeId,
    addedNeighbors,
    countsByType,
    totalCount: count.totalCount,
    addedCount: addedNeighbors.length,
    collapsedCount: count.totalCount - addedNeighbors.length,
  };
}
