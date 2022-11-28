import type { EdgeStyle } from "../Graph.model";

const outOfFocusEdgeStyle: Partial<EdgeStyle> = {
  label: "",
  lineColor: "#a0a0a0",
  opacity: 0.2,
  sourceArrowColor: "#a0a0a0",
  targetArrowColor: "#a0a0a0",
  transitionDuration: "200ms",
  transitionProperty: "opacity",
  width: 2,
};

export default outOfFocusEdgeStyle;
