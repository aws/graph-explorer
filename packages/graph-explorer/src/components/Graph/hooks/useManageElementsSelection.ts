import debounce from "lodash/debounce";
import differenceBy from "lodash/differenceBy";
import { useEffect, useMemo, useRef } from "react";

import { CytoscapeType, Selection } from "../Graph.model";

interface UseManageElementsSelection extends Selection {
  cy?: CytoscapeType;
  graphStructureVersion: number;
}

type Handlers = Pick<
  Selection,
  | "onSelectedNodesIdsChange"
  | "onSelectedEdgesIdsChange"
  | "onSelectedGroupsIdsChange"
>;

type Options = {
  autounselectify?: boolean;
  disableSelectionEvents?: boolean;
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
    onSelectedNodesIdsChange,
    onSelectedEdgesIdsChange,
    onSelectedGroupsIdsChange,
  }: UseManageElementsSelection,
  options?: Options
) {
  const isSelectionDisabled = useMemo(() => {
    return options?.disableSelectionEvents || !!options?.autounselectify;
  }, [options?.autounselectify, options?.disableSelectionEvents]);

  // Init cytoscape Select and unselect event handlers
  const handlers = useRef<Handlers>({
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

    // cy.on("Select unselect", ...) is called once by element selected/unselected.
    // These debounce functions avoid repeatedly call once by element.
    const debouncedNodeSelection = debounce(() => {
      const selectedNodes = cy.$("node:selected[!__isGroupNode]");
      const selectedNodesIds = selectedNodes.map(p => p.data().id);
      if (handlers.current.onSelectedNodesIdsChange) {
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
      if (handlers.current.onSelectedGroupsIdsChange) {
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
      if (handlers.current.onSelectedEdgesIdsChange)
        handlers.current.onSelectedEdgesIdsChange(selectedEdgesIds);
    }, 0);
    cy.on("select unselect", "edge", debouncedEdgeSelection);

    return () => {
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
