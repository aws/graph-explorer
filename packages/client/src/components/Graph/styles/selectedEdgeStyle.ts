import type { EdgeStyle } from "../Graph.model";
import defaultEdgeStyle from "./defaultEdgeStyle";

const selectedEdgeStyle: EdgeStyle = {
  ...defaultEdgeStyle,
  width: 2,
  lineColor: "#17457b",
  targetArrowColor: "#17457b",
  sourceArrowColor: "white",
};

export default selectedEdgeStyle;
