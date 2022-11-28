import type { NodeStyle } from "../Graph.model";

const defaultNodeStyle: NodeStyle = {
  background: "#128EE5",
  backgroundOpacity: 0.4,
  borderColor: "#128EE5",
  backgroundFit: "none",
  backgroundWidth: "60%",
  backgroundHeight: "60%",
  borderWidth: 1,
  borderStyle: "solid",
  borderOpacity: 0,
  color: "#FFFFFF",
  height: 24,
  opacity: 1,
  padding: 0,
  shape: "ellipse",
  text: {
    fontSize: 7,
    minZoomedFontSize: 6,
    rotation: "autorotate",
    vAlign: "bottom",
    vMargin: 0,
    wrap: "wrap",
    hAlign: "center",
    maxWidth: 80,
    color: "#ffffff",
    background: "#1d2531",
    opacity: 0.7,
    padding: 2,
    shape: "round-rectangle",
    border: {
      width: 0,
      opacity: 0.5,
      color: "#1d2531",
      style: "solid",
    },
  },
  visible: true,
  width: 24,
};

export default defaultNodeStyle;
