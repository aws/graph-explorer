import { EdgeStyle } from "../Graph.model";
import defaultEdgeStyle from "./defaultEdgeStyle";

const defaultSubwayEdgeStyles: EdgeStyle = {
  ...defaultEdgeStyle,
  curveStyle: "taxi",
  taxiDirection: "rightward",
};

export default defaultSubwayEdgeStyles;
