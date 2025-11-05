import debounce from "lodash/debounce";
import differenceBy from "lodash/differenceBy";
import { useEffect, useRef } from "react";

import type { CytoscapeType, Selection } from "../Graph.model";

interface UseManageElementsSelection extends Selection {
  cy?: CytoscapeType;
  graphStructureVersion: number;
}

type Handlers = Pick<
  Selection,
  | "onSelectedElementIdsChange"
  | "onSelectedNodesIdsChange"
  | "onSelectedEdgesIdsChange"
  | "onSelectedGroupsIdsChange"
>;

type Options = {
  autounselectify?: boolean;
  disableSelectionEvents?: boolean;
};

// Helper to compare two sets of IDs for equality
const areSetsEqual = (a: Set<string>, b: Set<string>): boolean => {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
};

// Helper to compare two arrays of IDs for equality
const areArraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  const setB = new Set(b);
  return areSetsEqual(setA, setB);
};

const useEntitySelection = (
  cy: CytoscapeType | undefined,
  selector: string,
  ids: Array<string> | Set<string>,
  isSelectionDisabled?: boolean
) => {
  useEffect(() => {
    if (!cy) {
      return;
    }

    const arrayOfIds = Array.isArray(ids) ? ids : Array.from(ids);
    if (isSelectionDisabled) {
      cy.autounselectify(false);
    }
    cy.batch(() => {
      const cyRefSelectedEntities = cy.$(selector);
      const cyRefSelectedEntitiesIds = cyRefSelectedEntities.map(
        p => p.data().id
      );

      const unSelectedEntities = differenceBy(
        cyRefSelectedEntitiesIds,
        arrayOfIds
      );
      // TODO: Determine what is going on with our id with Cytoscape selectors.
      // When using an id which is simply a json string, these fail to Select
      // appropriate nodes
      unSelectedEntities.forEach(id => {
        const entity = cy.getElementById(id);
        entity.unselect();
      });

      // TODO: Determine what is going on with our id with Cytoscape selectors.
      // When using an id which is simply a json string, these fail to Select
      // appropriate nodes
      arrayOfIds.forEach(id => {
        const entity = cy.getElementById(id);
        if (!entity.selected()) {
          entity.select();
        }
      });
    });
    if (isSelectionDisabled) {
      cy.autounselectify(true);
    }
  }, [cy, ids, isSelectionDisabled, selector]);
};

export default function useManageElementsSelection(
  {
    cy,
    selectedNodesIds = [],
    selectedEdgesIds = [],
    selectedGroupsIds = [],
    onSelectedElementIdsChange,
    onSelectedNodesIdsChange,
    onSelectedEdgesIdsChange,
    onSelectedGroupsIdsChange,
  }: UseManageElementsSelection,
  options?: Options
) {
  const isSelectionDisabled =
    options?.disableSelectionEvents || !!options?.autounselectify;

  // Track the current selection state from props
  const currentSelectionRef = useRef({
    nodeIds: new Set(
      Array.isArray(selectedNodesIds)
        ? selectedNodesIds
        : Array.from(selectedNodesIds)
    ),
    edgeIds: new Set(
      Array.isArray(selectedEdgesIds)
        ? selectedEdgesIds
        : Array.from(selectedEdgesIds)
    ),
    groupIds: new Set(
      Array.isArray(selectedGroupsIds)
        ? selectedGroupsIds
        : Array.from(selectedGroupsIds)
    ),
  });

  // Update the ref when props change
  useEffect(() => {
    currentSelectionRef.current = {
      nodeIds: new Set(
        Array.isArray(selectedNodesIds)
          ? selectedNodesIds
          : Array.from(selectedNodesIds)
      ),
      edgeIds: new Set(
        Array.isArray(selectedEdgesIds)
          ? selectedEdgesIds
          : Array.from(selectedEdgesIds)
      ),
      groupIds: new Set(
        Array.isArray(selectedGroupsIds)
          ? selectedGroupsIds
          : Array.from(selectedGroupsIds)
      ),
    };
  }, [selectedNodesIds, selectedEdgesIds, selectedGroupsIds]);

  // Init cytoscape Select and unselect event handlers
  const handlers = useRef<Handlers>(<Handlers>{
    onSelectedElementIdsChange,
    onSelectedEdgesIdsChange,
    onSelectedGroupsIdsChange,
    onSelectedNodesIdsChange,
  });

  useEffect(() => {
    if (!cy) {
      return;
    }

    if (
      cy.autounselectify() &&
      !options?.disableSelectionEvents &&
      !options?.autounselectify
    ) {
      cy.autounselectify(false);
    }
  }, [cy, options?.autounselectify, options?.disableSelectionEvents]);

  useEffect(() => {
    if (!cy) return;

    const debouncedElementSelection = debounce(() => {
      const selectedNodes = cy.$("node:selected[!__isGroupNode]");
      const selectedEdges = cy.$("edge:selected");
      const selectedGroups = cy.$("node:selected[?__isGroupNode]");
      const selected = {
        nodeIds: new Set(selectedNodes.map(p => p.id())),
        edgeIds: new Set(selectedEdges.map(p => p.id())),
        groupIds: new Set(selectedGroups.map(p => p.id())),
      };

      // Only fire callback if selection actually changed
      const hasChanged =
        !areSetsEqual(selected.nodeIds, currentSelectionRef.current.nodeIds) ||
        !areSetsEqual(selected.edgeIds, currentSelectionRef.current.edgeIds) ||
        !areSetsEqual(selected.groupIds, currentSelectionRef.current.groupIds);

      if (hasChanged && handlers.current.onSelectedElementIdsChange) {
        handlers.current.onSelectedElementIdsChange(selected);
      }
    }, 0);
    cy.on("select unselect", debouncedElementSelection);

    // cy.on("Select unselect", ...) is called once by element selected/unselected.
    // These debounce functions avoid repeatedly call once by element.
    const debouncedNodeSelection = debounce(() => {
      const selectedNodes = cy.$("node:selected[!__isGroupNode]");
      const selectedNodesIds = selectedNodes.map(p => p.data().id);

      // Only fire callback if node selection actually changed
      if (
        !areArraysEqual(selectedNodesIds, [
          ...currentSelectionRef.current.nodeIds,
        ]) &&
        handlers.current.onSelectedNodesIdsChange
      ) {
        handlers.current.onSelectedNodesIdsChange(selectedNodesIds);
      }
    }, 0);
    cy.on("select unselect", "node[!__isGroupNode]", debouncedNodeSelection);

    const debouncedGroupSelection = debounce(() => {
      const selectedGroups = cy.$("node:selected[?__isGroupNode]");
      const selectedGroupsIds: string[] = [];
      let selectedNodesIds: string[] = [];
      cy.batch(() => {
        selectedGroups.forEach(group => {
          selectedGroupsIds.push(group.data().id);
          const visibleChildren = group.children(":visible").nodes();
          selectedNodesIds = visibleChildren.map(node => node.data().id);
          visibleChildren.select();
        });
      });

      // Only fire callback if group selection actually changed
      if (
        !areArraysEqual(selectedGroupsIds, [
          ...currentSelectionRef.current.groupIds,
        ]) &&
        handlers.current.onSelectedGroupsIdsChange
      ) {
        handlers.current.onSelectedGroupsIdsChange(
          selectedGroupsIds,
          selectedNodesIds
        );
      }
    }, 0);
    cy.on("select unselect", "node[?__isGroupNode]", debouncedGroupSelection);

    // handle edge selection
    const debouncedEdgeSelection = debounce(() => {
      const selectedEdges = cy.$("edge:selected");
      const selectedEdgesIds = selectedEdges.map(p => p.data().id);

      // Only fire callback if edge selection actually changed
      if (
        !areArraysEqual(selectedEdgesIds, [
          ...currentSelectionRef.current.edgeIds,
        ]) &&
        handlers.current.onSelectedEdgesIdsChange
      ) {
        handlers.current.onSelectedEdgesIdsChange(selectedEdgesIds);
      }
    }, 0);
    cy.on("select unselect", "edge", debouncedEdgeSelection);

    return () => {
      cy.off("select unselect", debouncedElementSelection);
      cy.off("select unselect", "node[!__isGroupNode]", debouncedNodeSelection);
      cy.off(
        "select unselect",
        "node[?__isGroupNode]",
        debouncedGroupSelection
      );
      cy.off("select unselect", "edge", debouncedEdgeSelection);
    };
  }, [cy]);

  useEntitySelection(
    cy,
    "node:selected[!__isGroupNode]",
    selectedNodesIds,
    isSelectionDisabled
  );
  useEntitySelection(
    cy,
    "node:selected[?__isGroupNode]",
    selectedGroupsIds,
    isSelectionDisabled
  );
  useEntitySelection(
    cy,
    "edge:selected",
    selectedEdgesIds,
    isSelectionDisabled
  );
}
