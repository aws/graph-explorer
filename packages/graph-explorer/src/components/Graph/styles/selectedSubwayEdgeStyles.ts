import { EdgeStyle } from "../Graph.model";
import selectedEdgeStyle from "./selectedEdgeStyle";

const selectedSubwayEdgeStyles: Partial<EdgeStyle> = {
  ...selectedEdgeStyle,
  curveStyle: "taxi",
  taxiDirection: "rightward",
};

export default selectedSubwayEdgeStyles;
