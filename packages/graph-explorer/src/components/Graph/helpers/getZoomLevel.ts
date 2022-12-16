import type { CytoscapeType } from "../Graph.model";

const getZoomLevel = (cy?: CytoscapeType) => {
  if (!cy) {
    return "small";
  }

  const zoomRange = cy.maxZoom() - cy.minZoom();
  const zoomLevel = cy.zoom() - cy.minZoom();

  if (zoomLevel / zoomRange <= 0.15) {
    return "small";
  }
  if (zoomLevel / zoomRange <= 0.35) {
    return "medium";
  }

  return "large";
};

export default getZoomLevel;
