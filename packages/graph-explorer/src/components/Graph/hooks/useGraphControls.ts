import { useCallback } from "react";

import { CytoscapeType } from "../Graph.model";
// Exposes common graph ui actions
// Zoom, Fit, Center
export const useGraphControls = (graph: CytoscapeType) => {
  const increaseGraphZoom = useCallback(() => {
    const current = graph.zoom();
    graph.zoom(current + 0.015);
  }, [graph]);

  const decreaseGraphZoom = useCallback(() => {
    const current = graph.zoom();
    graph.zoom(current - 0.015);
  }, [graph]);

  const fitGraph = useCallback(() => {
    graph.fit(graph.elements());
  }, [graph]);

  const centerGraph = useCallback(() => {
    graph.center(graph.elements());
  }, [graph]);

  const centerSelectedElements = useCallback(() => {
    graph.center(graph.elements(":selected"));
  }, [graph]);

  const exportGraphImage = useCallback(() => {
    const imageBlob: Blob & {
      lastModifiedDate?: Date;
      name?: string;
    } = graph.png({ output: "blob", full: true });
    imageBlob.lastModifiedDate = new Date();
    imageBlob.name = "GraphImage.png";
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";

    const url = window.URL.createObjectURL(imageBlob);
    a.href = url;
    a.download = "Graph.png";
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }, [graph]);

  return {
    decreaseGraphZoom,
    increaseGraphZoom,
    fitGraph,
    centerGraph,
    centerSelectedElements,
    exportGraphImage,
  };
};

export default useGraphControls;
