import { saveAs } from "file-saver";
import { useCallback, useEffect, useState } from "react";
import { useGraphRef } from "@/components/Graph/GraphContext";

const useGraphGlobalActions = () => {
  const graphRef = useGraphRef();
  const [isZoomInDisabled, setIsZoomInDisabled] = useState(false);
  const [isZoomOutDisabled, setIsZoomOutDisabled] = useState(false);

  useEffect(() => {
    const updateFunction = () => {
      setIsZoomInDisabled(
        graphRef?.current?.cytoscape?.zoom() ===
          graphRef?.current?.cytoscape?.maxZoom(),
      );
      setIsZoomOutDisabled(
        graphRef?.current?.cytoscape?.zoom() ===
          graphRef?.current?.cytoscape?.minZoom(),
      );
    };
    // Call to set values on initialization
    updateFunction();

    const cy = graphRef?.current?.cytoscape;
    if (cy) {
      cy.on("zoom", updateFunction);
      return () => {
        cy.off("zoom", updateFunction);
      };
    }
    // graphRef is a reference that doesn't change but cytoscape can
    //eslint-disable-next-line
  }, [graphRef?.current?.cytoscape]);

  const onFitToCanvas = useCallback(() => {
    const selectedElements =
      graphRef?.current?.cytoscape?.elements(":selected");
    graphRef?.current?.cytoscape?.fit(
      selectedElements?.nonempty()
        ? selectedElements
        : graphRef?.current?.cytoscape.elements(),
      48, // avoid fit elements to the limit of the canvas
    );
  }, [graphRef]);

  const onFitSelectionToCanvas = useCallback(
    (nodeId: string | undefined = undefined) => {
      const selectedElements = nodeId
        ? graphRef?.current?.cytoscape?.getElementById(nodeId)
        : graphRef?.current?.cytoscape?.elements(":selected");
      graphRef?.current?.cytoscape?.fit(
        selectedElements,
        48, // avoid fit elements to the limit of the canvas
      );
    },
    [graphRef],
  );

  const onFitAllToCanvas = useCallback(() => {
    graphRef?.current?.cytoscape?.animate({
      fit: { eles: graphRef?.current?.cytoscape?.elements(), padding: 48 },
      duration: 200,
      easing: "ease-in-out-cubic",
    });
  }, [graphRef]);

  const onCenterGraph = useCallback(() => {
    const selectedElements =
      graphRef?.current?.cytoscape?.elements(":selected");
    graphRef?.current?.cytoscape?.center(
      selectedElements?.nonempty()
        ? selectedElements
        : graphRef?.current?.cytoscape.elements(),
    );
  }, [graphRef]);

  const onCenterSelectedGraph = useCallback(
    (nodeId: string | undefined = undefined) => {
      const selectedElements = nodeId
        ? graphRef?.current?.cytoscape?.getElementById(nodeId)
        : graphRef?.current?.cytoscape?.elements(":selected");
      graphRef?.current?.cytoscape?.center(selectedElements);
    },
    [graphRef],
  );

  const onRunLayout = useCallback(() => {
    graphRef.current?.runLayout();
  }, [graphRef]);

  const onCenterEntireGraph = useCallback(() => {
    graphRef?.current?.cytoscape?.center(
      graphRef?.current?.cytoscape.elements(),
    );
  }, [graphRef]);

  const onSaveScreenshot = useCallback(() => {
    // graphRef?.current?.cytoscape.png does NOT RENDER CUSTOM BADGES
    // such node name or connections because they are rendered using
    // cytoscape-canvas plugin.
    // The alternative is export the current view of the graph by merging all
    // canvases under the cytoscape root container.

    // Get all canvases from the container
    const canvases = graphRef?.current?.cytoscape
      ?.container()
      ?.querySelectorAll("canvas");

    if (!canvases || canvases.length === 0) {
      return;
    }

    // Create a canvas element and assign to it the same size that one of the
    // cytoscape canvases
    const canvas = document.createElement("canvas");
    canvas.width = canvases[0].width;
    canvas.height = canvases[0].height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    // Copy each canvas from cytoscape into the new canvas
    canvases?.forEach(cnvs => {
      ctx.drawImage(cnvs, 0, 0);
    });

    const data = canvas.toDataURL("image/png", 1);
    saveAs(data, `graph-${new Date().getTime()}.png`);
  }, [graphRef]);

  const onZoomIn = useCallback(() => {
    const selectedElements =
      graphRef?.current?.cytoscape?.elements(":selected");
    graphRef?.current?.cytoscape?.zoom(
      graphRef?.current?.cytoscape?.zoom() + 0.5,
    );
    if (selectedElements?.nonempty()) {
      onCenterGraph();
    }
  }, [onCenterGraph, graphRef]);

  const onZoomOut = useCallback(() => {
    graphRef?.current?.cytoscape?.zoom(
      graphRef?.current?.cytoscape?.zoom() - 0.5,
    );
  }, [graphRef]);

  return {
    onFitToCanvas,
    onFitSelectionToCanvas,
    onFitAllToCanvas,
    onRunLayout,
    onCenterGraph,
    onCenterSelectedGraph,
    onCenterEntireGraph,
    onSaveScreenshot,
    onZoomIn,
    onZoomOut,
    isZoomInDisabled,
    isZoomOutDisabled,
  };
};

export default useGraphGlobalActions;
