import type { GraphProps } from "@/components/Graph";

import useGraphStyles from "@/modules/GraphViewer/useGraphStyles";

/**
 * Returns Cytoscape styles for the schema graph with node and edge labels displayed.
 * Extends base graph styles with label configurations.
 */
export function useSchemaGraphStyles(): GraphProps["styles"] {
  const baseStyles = useGraphStyles();

  // Merge the schema label into the base node/edge rules rather than replacing
  // them — the base rules carry the per-type `data(ge_*)` style mappers, so a
  // wholesale override would leave the schema graph unstyled.
  return {
    ...baseStyles,
    node: {
      ...baseStyles.node,
      label: "data(displayLabel)",
    },
    edge: {
      ...baseStyles.edge,
      label: "data(displayLabel)",
    },
  };
}
