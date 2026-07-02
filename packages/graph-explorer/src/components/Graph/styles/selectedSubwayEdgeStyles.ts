import type { RenderedEdgeStyle } from "../Graph.model";

import selectedEdgeStyle from "./selectedEdgeStyle";

const selectedSubwayEdgeStyles: Partial<RenderedEdgeStyle> = {
  ...selectedEdgeStyle,
  curveStyle: "taxi",
  taxiDirection: "rightward",
};

export default selectedSubwayEdgeStyles;
