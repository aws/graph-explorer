import cytoscape from "cytoscape";
import { useEffect } from "react";
import type { CytoscapeType } from "../Graph.model";
import defaultEdgeStyle from "../styles/defaultEdgeStyle";
import defaultNodeStyle from "../styles/defaultNodeStyle";
import defaultSubwayEdgeStyles from "../styles/defaultSubwayEdgeStyles";
import hiddenEdgeStyle from "../styles/hiddenEdgeStyle";
import hiddenNodeStyle from "../styles/hiddenNodeStyle";
import outOfFocusEdgeStyle from "../styles/outOfFocusEdgeStyle";
import outOfFocusNodeStyle from "../styles/outOfFocusNodeStyle";
import selectedEdgeStyle from "../styles/selectedEdgeStyle";
import selectedNodeStyle from "../styles/selectedNodeStyle";
import selectedSubwayEdgeStyles from "../styles/selectedSubwayEdgeStyles";
import toCyEdgeStyle from "../styles/toCyEdgeStyle";
import toCyNodeStyle from "../styles/toCyNodeStyle";

export const getStyles = ({
  styles,
  layout,
  badgesEnabled,
  defaultNodeLabelAttribute,
  hideDefaultNodeLabels,
  defaultEdgeLabelAttribute,
  hideDefaultEdgeLabels,
}: Omit<UseManageStylesProps, "cy">) => {
  const rootStyles: cytoscape.StylesheetStyle[] = [];

  if (!hideDefaultNodeLabels) {
    rootStyles.push({
      selector: "node[id]",
      style: { label: "data(id)" },
    });
    rootStyles.push({
      selector: "node[label]",
      style: { label: "data(label)" },
    });
    if (defaultNodeLabelAttribute) {
      rootStyles.push({
        selector: `node[${defaultNodeLabelAttribute}]`,
        style: { label: `data(${defaultNodeLabelAttribute})` },
      });
    }
  }

  if (!hideDefaultEdgeLabels) {
    rootStyles.push({
      selector: "edge[id]",
      style: { label: "data(id)" },
    });
    rootStyles.push({
      selector: "edge[label]",
      style: { label: "data(label)" },
    });
    rootStyles.push({
      selector: "edge[type]",
      style: { label: "data(type)" },
    });

    if (defaultEdgeLabelAttribute) {
      rootStyles.push({
        selector: `edge[${defaultEdgeLabelAttribute}]`,
        style: { label: `data(${defaultEdgeLabelAttribute})` },
      });
    }
  }

  function addDefault(selector: string, style: { [key: string]: unknown }) {
    const stylesWithDefault = styles?.[selector]
      ? { ...style, ...styles?.[selector] }
      : style;
    rootStyles.push({ selector, style: stylesWithDefault });
  }

  // Base styles
  addDefault("node", toCyNodeStyle(defaultNodeStyle));
  if (layout.match("SUBWAY_")) {
    addDefault("edge", toCyEdgeStyle(defaultSubwayEdgeStyles));
  } else {
    addDefault("edge", toCyEdgeStyle(defaultEdgeStyle));
  }

  if (badgesEnabled === false) {
    rootStyles.push({
      selector: "node",
      style: {
        label: "",
      },
    });
  }

  // External styles
  Object.keys(styles || {}).forEach(rootSelector => {
    rootStyles.push({
      selector: rootSelector,
      style: styles?.[rootSelector] as cytoscape.StylesheetStyle["style"],
    });
  });

  // Selected overrides
  addDefault("node:selected", toCyNodeStyle(selectedNodeStyle));
  addDefault("node.hidden", toCyNodeStyle(hiddenNodeStyle));
  addDefault(
    "node.blast-radius-filter-out",
    toCyNodeStyle(outOfFocusNodeStyle)
  );
  addDefault("node.connections-filter-out", toCyNodeStyle(outOfFocusNodeStyle));
  addDefault("node.out-of-focus", toCyNodeStyle(outOfFocusNodeStyle));

  addDefault("edge.hidden", toCyEdgeStyle(hiddenEdgeStyle));
  if (layout.match("SUBWAY_")) {
    addDefault("edge:selected", toCyEdgeStyle(selectedSubwayEdgeStyles));
  } else {
    addDefault("edge:selected", toCyEdgeStyle(selectedEdgeStyle));
  }
  addDefault(
    "edge.blast-radius-filter-out",
    toCyEdgeStyle(outOfFocusEdgeStyle)
  );
  addDefault("edge.connections-filter-out", toCyEdgeStyle(outOfFocusEdgeStyle));
  addDefault("edge.out-of-focus", toCyEdgeStyle(outOfFocusEdgeStyle));

  rootStyles.push({
    selector: "node[__iconUrl]",
    style: {
      "background-image": "data(__iconUrl)",
    },
  });

  return rootStyles;
};

export type StyleSelector =
  | cytoscape.StylesheetStyle["style"]
  | {
      [key: string]:
        | string
        | ((element: cytoscape.SingularElementReturnValue) => string)
        | undefined;
    };

export type UseManageStylesProps = {
  cy?: CytoscapeType;
  styles?: {
    [selector: string]: StyleSelector;
  };
  layout: string;
  badgesEnabled?: boolean;
  hideDefaultNodeLabels?: boolean;
  defaultNodeLabelAttribute?: string;
  hideDefaultEdgeLabels?: boolean;
  defaultEdgeLabelAttribute?: string;
};

const useManageStyles = ({
  cy,
  styles,
  layout,
  badgesEnabled,
  hideDefaultEdgeLabels,
  defaultNodeLabelAttribute,
  hideDefaultNodeLabels,
  defaultEdgeLabelAttribute,
}: UseManageStylesProps) => {
  useEffect(() => {
    if (cy) {
      const newStyles = getStyles({
        styles,
        layout,
        badgesEnabled,
        defaultNodeLabelAttribute,
        hideDefaultEdgeLabels,
        defaultEdgeLabelAttribute,
        hideDefaultNodeLabels,
      });
      cy.style(newStyles);
    }
  }, [
    cy,
    styles,
    layout,
    hideDefaultEdgeLabels,
    hideDefaultNodeLabels,
    badgesEnabled,
    defaultNodeLabelAttribute,
    defaultEdgeLabelAttribute,
  ]);
};

export default useManageStyles;
