import isEqual from "lodash/isEqual";
import isEqualWith from "lodash/isEqualWith";
import type { GetRecoilValue, RecoilState, SetRecoilState } from "recoil";
import { selector } from "recoil";
import type { Edge, EdgeId, Vertex, VertexId } from "@/core";
import {
  edgesAtom,
  edgesSelectedIdsAtom,
  edgesSelector,
  filteredEdgesSelector,
} from "./edges";
import {
  filteredNodesSelector,
  nodesAtom,
  nodesFilteredIdsAtom,
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
  nodes: Map<VertexId, Vertex>;
  edges: Map<EdgeId, Edge>;
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
      nodes: get(filteredNodesSelector),
      edges: get(filteredEdgesSelector),
    };
  },
  set: ({ get, set }, newEntities) => {
    if (!isEntities(newEntities)) {
      return;
    }

    const prevNodes = newEntities.forceSet
      ? new Map<VertexId, Vertex>()
      : get(nodesAtom);
    const prevEdges = newEntities.forceSet
      ? new Map<EdgeId, Edge>()
      : get(edgesAtom);

    // Remove duplicated nodes by id
    const nonDupNodes = new Map([...prevNodes, ...newEntities.nodes]);

    // Remove duplicated edges by id
    const nonDupEdges = new Map([...prevEdges, ...newEntities.edges]);

    // Remove all unconnected edges
    const nonUnconnectedEdges = new Map(
      nonDupEdges
        .entries()
        .filter(
          ([_id, edge]) =>
            nonDupNodes.has(edge.source) && nonDupNodes.has(edge.target)
        )
    );

    // Get deleted nodes ids
    const deletedNodesIds = new Set(
      get(nodesAtom)
        .values()
        .filter(node => !nonDupNodes.has(node.id))
        .map(node => node.id)
    );

    // When a node is removed, we should delete its id from other nodes-state sets
    if (deletedNodesIds.size > 0) {
      [nodesSelectedIdsAtom, nodesFilteredIdsAtom].forEach(selector => {
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
              .values()
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
      prevEdges.size === 0
    ) {
      set(edgesSelector, nonUnconnectedEdges);
    }

    set(updateSchemaFromEntitiesAtom, {
      nodes: nonDupNodes,
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
