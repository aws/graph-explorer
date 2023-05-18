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
