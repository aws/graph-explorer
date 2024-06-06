import isEqual from "lodash/isEqual";
import isEqualWith from "lodash/isEqualWith";
import uniqBy from "lodash/uniqBy";
import type { GetRecoilValue, RecoilState, SetRecoilState } from "recoil";
import { selector, selectorFamily } from "recoil";
import type { Edge, Vertex } from "../../@types/entities";
import { edgesAtom, edgesSelectedIdsAtom, edgesSelector } from "./edges";
import {
  nodesAtom,
  nodesHiddenIdsAtom,
  nodesSelectedIdsAtom,
  nodesSelector,
} from "./nodes";
import { VertexId } from "../../connector/useGEFetchTypes";
import { calculateAllNodeCounts } from "../calculateNodeCounts";

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

const removeFromSetIfDeleted = (
  {
    get,
    set,
  }: {
    get: GetRecoilValue;
    set: SetRecoilState;
  },
  deletedIds: Set<string>,
  selector: RecoilState<Set<string>>
) => {
  const selectorIds = get(selector);
  const copiedSelectorIds = new Set(selectorIds);
  deletedIds.forEach(id => {
    copiedSelectorIds.delete(id);
  });
  set(selector, copiedSelectorIds);
  return copiedSelectorIds;
};

export type NodeNeighborCounts = {
  nodeId: VertexId;
  totalCount: number;
  counts: Map<string, number>;
};

export const addedNeighborsSelector = selectorFamily({
  key: "added-neighbors",
  get:
    (id: VertexId) =>
    ({ get }) => {
      const nodes = get(nodesAtom);
      const edges = get(edgesAtom);

      // Get all added neighbors of the node
      const result = nodes.filter(
        n =>
          // Not this node
          n.data.id !== id &&
          // Either source or target node of an edge
          edges.some(
            e =>
              (e.data.source === id && e.data.target === n.data.id) ||
              (e.data.source === n.data.id && e.data.target === id)
          )
      );
      return result;
    },
});

export const allAddedNeighborsSelector = selectorFamily({
  key: "all-added-neighbors",
  get:
    (ids: VertexId[]) =>
    ({ get }) => {
      return new Map(ids.map(id => [id, get(addedNeighborsSelector(id))]));
    },
});

export const neighborsCountsSelector = selectorFamily({
  key: "neighbors-counts",
  get:
    (counts: NodeNeighborCounts[]) =>
    ({ get }) => {
      const allAddedNeighbors = get(
        allAddedNeighborsSelector(counts.map(c => c.nodeId))
      );
      return calculateAllNodeCounts(counts, allAddedNeighbors);
    },
});

export const neighborsCountSelector = selectorFamily({
  key: "neighbors-count",
  get:
    (counts: NodeNeighborCounts | undefined) =>
    ({ get }) => {
      if (!counts) {
        return;
      }

      const nodes = get(neighborsCountsSelector([counts]));

      return nodes.get(counts.nodeId);
    },
});

// This selector is the safer way to add entities to the graph
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
      node => node.data.id
    );

    // Remove duplicated edges by id
    const nonDupEdges = uniqBy(
      [...newEntities.edges, ...prevEdges],
      edge => edge.data.id
    );

    // Get stats for each node

    // Remove all unconnected edges
    const nonUnconnectedEdges = nonDupEdges.filter(edge => {
      return (
        nonDupNodes.some(node => node.data.id === edge.data.source) &&
        nonDupNodes.some(node => node.data.id === edge.data.target)
      );
    });

    // Get deleted nodes ids
    const deletedNodesIds = new Set(
      get(nodesAtom)
        .filter(node => {
          return !nonDupNodes.find(newNode => newNode.data.id === node.data.id);
        })
        .map(node => node.data.id)
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
                  deletedNodesIds.has(edge.data.source) ||
                  deletedNodesIds.has(edge.data.target)
                );
              })
              .map(edge => edge.data.id)
          )
        : new Set<string>();

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
    const shouldUpdateNodes = !isEqualWith(nonDupNodes, prevNodes, (a, b) => {
      // Ignore these properties because they are added by a hook
      // They never exists in raw data
      if (a?.__isHiddenByCollapse !== b?.__isHiddenByCollapse) {
        return true;
      }
      if (a?.__isCollapsed !== b?.__isCollapsed) {
        return true;
      }
      return false;
    });
    shouldUpdateNodes && set(nodesSelector, nonDupNodes);

    // Avoid update the state if edges are equal
    const shouldUpdateEdges = !isEqual(nonUnconnectedEdges, prevEdges);
    if (
      shouldUpdateEdges ||
      affectedEdgesIds.size > 0 ||
      prevEdges.length === 0
    ) {
      set(edgesSelector, nonUnconnectedEdges);
    }

    // Select new entities preserving selected ones by default
    const selectedNodesIds =
      newEntities.preserveSelection === false
        ? new Set<string>()
        : new Set(get(nodesSelectedIdsAtom));
    const selectedEdgesIds =
      newEntities.preserveSelection === false
        ? new Set<string>()
        : new Set(get(edgesSelectedIdsAtom));

    if (
      newEntities.selectNewEntities === true ||
      newEntities.selectNewEntities === "nodes"
    ) {
      newEntities.nodes.forEach(node => {
        selectedNodesIds.add(node.data.id);
      });
      set(nodesSelectedIdsAtom, selectedNodesIds);
    }
    if (
      newEntities.selectNewEntities === true ||
      newEntities.selectNewEntities === "edges"
    ) {
      newEntities.edges.forEach(edge => {
        selectedEdgesIds.add(edge.data.id);
      });
      set(edgesSelectedIdsAtom, selectedEdgesIds);
    }
  },
});

export default entitiesSelector;
