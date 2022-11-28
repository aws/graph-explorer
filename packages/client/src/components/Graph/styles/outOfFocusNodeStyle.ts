import { NodeStyle } from "../Graph.model";

const outOfFocusNodeStyle: Partial<NodeStyle> = {
  backgroundOpacity: 0.1,
  background: "#a0a0a0",
  borderOpacity: 0.2,
  opacity: 0.2,
  transitionDuration: "200ms",
  transitionProperty: "opacity",
  label: "",
};

export default outOfFocusNodeStyle;
