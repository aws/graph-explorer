import type { CytoscapeType } from "../Graph.model";
import { availableLayoutsConfig } from "./layoutConfig";

type ExpandedCytoscapeLayoutOptions = {
  fixedNodeConstraint?: {
    nodeId: string | number;
    position: { x: number; y: number };
  }[];
};
export const runLayout = (
  cyReference: CytoscapeType,
  layoutName: string,
  additionalLayoutsConfig: {
    [layoutName: string]: Partial<
      cytoscape.LayoutOptions & ExpandedCytoscapeLayoutOptions
    >;
  } = {},
  useAnimation = false
) => {
  const _layout = {
    ...availableLayoutsConfig[layoutName],
    ...additionalLayoutsConfig[layoutName],
  };
  if (_layout) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Animate is not a cytoscape.LayoutOption. Need to check
    _layout.animate = useAnimation;
    if (layoutName === "F_COSE") {
      // using the fixedNodeConstraint of the newer version of cytoscape-fcose to achieve a better relayout when
      // there are locked nodes
      const nodesToRunLayout = cyReference.nodes("[!__isGroupNode]:locked");
      _layout.fixedNodeConstraint = nodesToRunLayout.map(node => ({
        nodeId: node.data().id,
        position: node.position(),
      }));
    }
    const layout = cyReference.layout(_layout);
    layout.run();
    return;
  }

  throw new Error(
    "Layout configuration not found, if you are using a custom layout make sure to pass down the" +
      " layout configuration through the additionalLayouts Prop "
  );
};

export const graphLayouts = Object.keys(availableLayoutsConfig);
