import type { RenderedNodeStyle } from "../Graph.model";

const defaultNodeStyle: RenderedNodeStyle = {
  background: "#128EE5",
  backgroundOpacity: 0.4,
  borderColor: "#128EE5",
  // The icon image is a square wrapper that already insets the artwork
  // (issue #2108), so the node only has to fit that square without
  // distorting it: `contain` is what does that — `auto`/`auto` are
  // cytoscape's own defaults, restated for intent. `contain` alone, without
  // the wrapper, is not enough: it fits the whole square node box, and the
  // node is an ellipse, so a square-ish icon's corners spill past the shape.
  backgroundFit: "contain",
  backgroundWidth: "auto",
  backgroundHeight: "auto",
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
