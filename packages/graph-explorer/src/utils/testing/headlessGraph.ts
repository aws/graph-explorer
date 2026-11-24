import cytoscape from "cytoscape";
import { onTestFinished } from "vite-plus/test";

import type { GraphProps } from "@/components/Graph";

import { getStyles } from "@/components/Graph/hooks/useManageStyles";

/** Applies the app's full stylesheet to headless Cytoscape elements so a test reads the style a user sees. */
export function createHeadlessGraph(
  styles: GraphProps["styles"],
  elements: cytoscape.ElementDefinition[],
): cytoscape.Core {
  const cy = cytoscape({
    headless: true,
    styleEnabled: true,
    style: getStyles({ styles, layout: "F_COSE" }),
    elements,
  });
  onTestFinished(() => cy.destroy());
  return cy;
}

/** Cytoscape's resolved string value for each property. */
export function resolvedStyle(
  element: cytoscape.SingularElementReturnValue,
  properties: string[],
): Record<string, string> {
  return Object.fromEntries(
    properties.map(property => [property, element.style(property)]),
  );
}
