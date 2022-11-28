import cytoscape from "cytoscape";
import debounce from "lodash/debounce";
import { useEffect, useRef, useState } from "react";

import { GraphProps } from "../Graph";
import { Config, CytoscapeType } from "../Graph.model";

export interface UseInitCytoscapeProps
  extends Required<
    Pick<GraphProps, keyof Omit<Config, "minZoom" | "maxZoom" | "pan">>
  > {
  wrapper?: HTMLElement;
  minZoom?: number;
  maxZoom?: number;
  pan?: { x: number; y: number };
  onLayoutRunningChanged?: (isRunning: boolean) => void;
  onZoomChanged?: (e: unknown) => void;
  onPanChanged?: (e: unknown) => void;
}

const useInitCytoscape = ({
  wrapper,
  onLayoutRunningChanged,
  onPanChanged,
  onZoomChanged,
  ...config
}: UseInitCytoscapeProps) => {
  const [cy, setCy] = useState<CytoscapeType | undefined>();

  const { autolock, userZoomingEnabled, userPanningEnabled } = config;
  const layoutGraphConfig = useRef({
    autolock,
    userZoomingEnabled,
    userPanningEnabled,
  });

  // holds the event handlers so we do not need to keep re-attaching them
  const eventHandlerRefs = useRef({
    onLayoutRunningChanged,
    onPanChanged,
    onZoomChanged,
  });

  useEffect(() => {
    eventHandlerRefs.current = {
      onLayoutRunningChanged,
      onPanChanged,
      onZoomChanged,
    };
  }, [onLayoutRunningChanged, onPanChanged, onZoomChanged]);

  useEffect(() => {
    layoutGraphConfig.current = {
      autolock,
      userZoomingEnabled,
      userPanningEnabled,
    };
  }, [autolock, userZoomingEnabled, userPanningEnabled]);

  useEffect(() => {
    if (wrapper) {
      const cy = cytoscape({
        container: wrapper,
        style: [],
        ...config,
      });

      cy.on("layoutstart", () => {
        cy.userPanningEnabled(false);
        cy.userZoomingEnabled(false);
        eventHandlerRefs.current.onLayoutRunningChanged?.(true);
      });

      cy.on("layoutstop", () => {
        cy.userPanningEnabled(layoutGraphConfig.current.userPanningEnabled);
        cy.userZoomingEnabled(layoutGraphConfig.current.userZoomingEnabled);
        if (layoutGraphConfig.current.autolock) {
          cy.nodes().lock();
        }
        eventHandlerRefs.current.onLayoutRunningChanged?.(false);
      });

      // Avoid to notify every single change during animation
      const debouncedZoom = debounce(() => {
        eventHandlerRefs.current.onZoomChanged?.(cy.zoom());
      }, 100);
      cy.on("zoom", debouncedZoom);

      const debouncedPan = debounce(() => {
        eventHandlerRefs.current.onPanChanged?.(cy.pan());
      }, 100);
      cy.on("pan", debouncedPan);

      setCy(cy);

      return () => {
        (cy.elements() as any).removeAllListeners();
        (cy as any).removeAllListeners();
        cy.destroy();
        cy.unmount();
        setCy(undefined);
      };
    }
    // since this is to init cytoscape, this should only run when wrapper is set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapper]);

  return cy;
};

export default useInitCytoscape;
