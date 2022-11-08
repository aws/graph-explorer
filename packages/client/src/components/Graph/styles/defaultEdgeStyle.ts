import type { EdgeStyle } from "../Graph.model";

const defaultEdgeStyle: EdgeStyle = {
  visible: true,
  opacity: 1,
  color: "#f0f0f0",
  width: 2,
  lineColor: "#b3b3b3",
  curveStyle: "bezier",
  sourceArrowShape: "none",
  sourceArrowColor: "#b3b3b3",
  targetArrowShape: "triangle",
  targetArrowColor: "#b3b3b3",
  lineCap: "square",
  lineStyle: "solid",
  text: {
    background: "#17457b",
    border: {
      width: 0,
      opacity: 1,
      color: "#1d2531",
      style: "solid",
    },
    color: "#ffffff",
    fontSize: 7,
    hAlign: "center",
    maxWidth: 80,
    minZoomedFontSize: 6,
    opacity: 0.7,
    padding: 2,
    rotation: "autorotate",
    shape: "round-rectangle",
    vAlign: "bottom",
    vMargin: 0,
    wrap: "wrap",
  },
};

export default defaultEdgeStyle;
