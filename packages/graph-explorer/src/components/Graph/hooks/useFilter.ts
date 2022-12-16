import cytoscape from "cytoscape";
import { useEffect } from "react";
import type { CytoscapeType } from "../Graph.model";

export type UseFilterOptions = {
  /**
   * The Cytoscape instance
   */
  cy: CytoscapeType | undefined;
  /**
   * A version number changed every time the set of graph elements changes.
   */
  graphStructureVersion: number;
  /**
   * Enabled or disable the filter.
   */
  isFilterActive: boolean;
  /**
   * The prefix that will be used for setting classes on elements included and
   * excluded via the filter.
   * Classes will be `${filterClassPrefix}-in` for
   * included elements and `${filterClassPrefix}-out` for excluded elements.
   */
  filterClassPrefix: string;
  /**
   * Returns the list of entities to apply the filter
   */
  applyFilter(cy: CytoscapeType): cytoscape.CollectionReturnValue | null;
};

export default function useFilter({
  cy,
  isFilterActive,
  filterClassPrefix,
  graphStructureVersion,
  applyFilter,
}: UseFilterOptions) {
  useEffect(() => {
    const inClass = `${filterClassPrefix}-in`;
    const outClass = `${filterClassPrefix}-out`;

    cy?.batch(() => {
      // Reset this filter's styling on all affected elements upfront,
      // so that new styles can be applied appropriately
      cy.elements(`.${inClass}`).removeClass(inClass);
      cy.elements(`.${outClass}`).removeClass(outClass);

      // If this filter isn't selected, then we can stop work here. Thus any
      // applied styles will have been removed
      if (!isFilterActive) {
        return;
      }

      // Run the configured filter function and get the included elements. If
      // this function returns false, then we encountered a condition within that
      // has caused filtering to be skipped, so work stops there
      const includedElements = applyFilter(cy);
      if (!includedElements) {
        return;
      }

      // Get the edges connected to the initial set of included nodes, then
      // merge them into the set of included elements as appropriate
      const includedElementsEdges = includedElements.connectedEdges();

      includedElementsEdges.forEach((edgeElement: cytoscape.EdgeSingular) => {
        const connectedNodes = edgeElement.connectedNodes();

        if (includedElements.contains(connectedNodes)) {
          includedElements.merge(edgeElement);
        }
      });

      // Get all excluded nodes as the absolute complement of the included nodes PLUS
      // any group nodes which should be considered completely unrelated to any filter operations
      const excludedElements = includedElements
        .union(cy.nodes("[?__isGroupNode]"))
        .absoluteComplement();

      // Apply all styling, including the defined filter effect
      includedElements.addClass(inClass);
      excludedElements.addClass(outClass);
    });
  }, [
    cy,
    graphStructureVersion,
    filterClassPrefix,
    applyFilter,
    isFilterActive,
  ]);
}
