import type { GraphProps } from "@/components/Graph";

import useGraphStyles from "@/modules/GraphViewer/useGraphStyles";

/**
 * Returns Cytoscape styles for the schema graph with node and edge labels displayed.
 * Extends base graph styles with label configurations.
 */
export function useSchemaGraphStyles(): GraphProps["styles"] {
  const baseStyles = useGraphStyles();

  return {
    ...baseStyles,
    node: {
      label: "data(displayLabel)",
    },
    edge: {
      label: "data(displayLabel)",
    },
  };
}
