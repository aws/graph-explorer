import { uniq } from "lodash";
import isEqual from "lodash/isEqual";
import isEqualWith from "lodash/isEqualWith";
import uniqBy from "lodash/uniqBy";
import type { GetRecoilValue, RecoilState, SetRecoilState } from "recoil";
import { selector } from "recoil";
import type { Edge, EdgeId, Vertex, VertexId } from "@/types/entities";
import { edgesAtom, edgesSelectedIdsAtom, edgesSelector } from "./edges";
import {
  nodesAtom,
  nodesHiddenIdsAtom,
  nodesSelectedIdsAtom,
  nodesSelector,
} from "./nodes";
import { updateSchemaFromEntitiesAtom } from "./schema";

export type Entities = {
  /**
   * forceSet prevents merging entities with existing (previous) stored entities
   */
  forceSet?: boolean;
  preserveSelection?: boolean;
  selectNewEntities?: boolean | "nodes" | "edges";
  nodes: Vertex[];
  edges: Edge[];
};
const isEntities = (value: any): value is Entities => {
  return !!value.nodes;
};

function removeFromSetIfDeleted<T>(
  {
    get,
    set,
  }: {
    get: GetRecoilValue;
    set: SetRecoilState;
  },
  deletedIds: Set<T>,
  selector: RecoilState<Set<T>>
) {
  const selectorIds = get(selector);
  const copiedSelectorIds = new Set(selectorIds);
  deletedIds.forEach(id => {
    copiedSelectorIds.delete(id);
  });
  set(selector, copiedSelectorIds);
  return copiedSelectorIds;
}

// This selector is the safer way to add entities to the graph
// It computes stats (counts) every time that some entity is added
const entitiesSelector = selector<Entities>({
  key: "entities",
  get: ({ get }) => {
    return {
      nodes: get(nodesAtom),
      edges: get(edgesAtom),
    };
  },
  set: ({ get, set }, newEntities) => {
    if (!isEntities(newEntities)) {
      return;
    }

    const prevNodes = newEntities.forceSet ? [] : get(nodesAtom);
    const prevEdges = newEntities.forceSet ? [] : get(edgesAtom);

    // Remove duplicated nodes by id
    const nonDupNodes = uniqBy(
      [...newEntities.nodes, ...prevNodes],
      node => node.id
    );

    // Remove duplicated edges by id
    const nonDupEdges = uniqBy(
      [...newEntities.edges, ...prevEdges],
      edge => edge.id
    );

    // Get stats for each node
    const nodesWithStats = nonDupNodes.map(node => {
      // Get all OUT connected edges: current node is source and target should exist
      const outConnections = nonDupEdges.filter(
        edge =>
          edge.source === node.id &&
          nonDupNodes.some(aNode => aNode.id === edge.target)
      );

      // Get all IN connected edges: current node is target and source should exist
      const inConnections = nonDupEdges.filter(
        edge =>
          edge.target === node.id &&
          nonDupNodes.some(aNode => aNode.id === edge.source)
      );

      // Re-mapping neighborsCountByType to only un-fetched counts
      const __unfetchedNeighborCounts = Object.entries(
        node.neighborsCountByType
      ).reduce(
        (counts, [type, count]) => {
          // All edges FROM current node to TYPE that it is in the graph
          const fetchedOutEdgesByType = outConnections.filter(
            edge =>
              edge.targetType.split("::").includes(type) &&
              nonDupNodes.some(aNode => aNode.id === edge.target)
          );

          // All edges TO current node from TYPE that it is in the graph
          const fetchedInEdgesByType = inConnections.filter(
            edge =>
              edge.sourceType.split("::").includes(type) &&
              nonDupNodes.some(aNode => aNode.id === edge.source)
          );

          // Count only unique connected nodes
          const distinctConnectedNodes = uniq([
            ...fetchedOutEdgesByType.map(et => et.target),
            ...fetchedInEdgesByType.map(et => et.source),
          ]);

          counts[type] = Math.max(0, count - distinctConnectedNodes.length);

          return counts;
        },
        {} as Record<string, number>
      );

      return {
        ...node,
        __unfetchedNeighborCounts,
        __fetchedOutEdgeCount: outConnections.length,
        __fetchedInEdgeCount: inConnections.length,
        __unfetchedNeighborCount: Math.max(
          0,
          Object.values(__unfetchedNeighborCounts).reduce(
            (sum, count) => sum + count,
            0
          )
        ),
      };
    });

    // Remove all unconnected edges
    const nonUnconnectedEdges = nonDupEdges.filter(edge => {
      return (
        nodesWithStats.some(node => node.id === edge.source) &&
        nodesWithStats.some(node => node.id === edge.target)
      );
    });

    // Get deleted nodes ids
    const deletedNodesIds = new Set(
      get(nodesAtom)
        .filter(node => {
          return !nodesWithStats.find(newNode => newNode.id === node.id);
        })
        .map(node => node.id)
    );

    // When a node is removed, we should delete its id from other nodes-state sets
    if (deletedNodesIds.size > 0) {
      [nodesSelectedIdsAtom, nodesHiddenIdsAtom].forEach(selector => {
        removeFromSetIfDeleted(
          {
            get,
            set,
          },
          deletedNodesIds,
          selector
        );
      });
    }

    // Get all edges ids affected by a node deletion
    const affectedEdgesIds =
      deletedNodesIds.size > 0
        ? new Set(
            get(edgesAtom)
              .filter(edge => {
                return (
                  deletedNodesIds.has(edge.source) ||
                  deletedNodesIds.has(edge.target)
                );
              })
              .map(edge => edge.id)
          )
        : new Set<EdgeId>();

    // When a node is removed, we should remove its involved edge id from other edges-state sets
    if (affectedEdgesIds.size > 0) {
      [edgesSelectedIdsAtom].forEach(selector =>
        removeFromSetIfDeleted(
          {
            get,
            set,
          },
          affectedEdgesIds,
          selector
        )
      );
    }

    // Avoid update the state if nodes are equal
    const shouldUpdateNodes = !isEqualWith(
      nodesWithStats,
      prevNodes,
      (a, b) => {
        // Ignore these properties because they are added by a hook
        // They never exists in raw data
        if (a?.__isHiddenByCollapse !== b?.__isHiddenByCollapse) {
          return true;
        }
        if (a?.__isCollapsed !== b?.__isCollapsed) {
          return true;
        }
        return false;
      }
    );
    shouldUpdateNodes && set(nodesSelector, nodesWithStats);

    // Avoid update the state if edges are equal
    const shouldUpdateEdges = !isEqual(nonUnconnectedEdges, prevEdges);
    if (
      shouldUpdateEdges ||
      affectedEdgesIds.size > 0 ||
      prevEdges.length === 0
    ) {
      set(edgesSelector, nonUnconnectedEdges);
    }

    set(updateSchemaFromEntitiesAtom, {
      nodes: nodesWithStats,
      edges: nonUnconnectedEdges,
    });

    // Select new entities preserving selected ones by default
    const selectedNodesIds =
      newEntities.preserveSelection === false
        ? new Set<VertexId>()
        : new Set(get(nodesSelectedIdsAtom));
    const selectedEdgesIds =
      newEntities.preserveSelection === false
        ? new Set<EdgeId>()
        : new Set(get(edgesSelectedIdsAtom));

    if (
      newEntities.selectNewEntities === true ||
      newEntities.selectNewEntities === "nodes"
    ) {
      newEntities.nodes.forEach(node => {
        selectedNodesIds.add(node.id);
      });
      set(nodesSelectedIdsAtom, selectedNodesIds);
    }
    if (
      newEntities.selectNewEntities === true ||
      newEntities.selectNewEntities === "edges"
    ) {
      newEntities.edges.forEach(edge => {
        selectedEdgesIds.add(edge.id);
      });
      set(edgesSelectedIdsAtom, selectedEdgesIds);
    }
  },
});

export default entitiesSelector;
