import type { RenderedEdgeStyle } from "../Graph.model";

import defaultEdgeStyle from "./defaultEdgeStyle";

const defaultSubwayEdgeStyles: RenderedEdgeStyle = {
  ...defaultEdgeStyle,
  curveStyle: "taxi",
  taxiDirection: "rightward",
};

export default defaultSubwayEdgeStyles;
