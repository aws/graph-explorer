import cytoscape from "cytoscape";

const getNodeBoundingBox = (node: cytoscape.NodeSingular) => {
  const { x1, y1, x2, y2 } = node.boundingbox({
    includeEdges: false,
    includeLabels: false,
    includeOverlays: false,
  });

  return {
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
  };
};

export default getNodeBoundingBox;
