import cytoscape from "cytoscape";
import debounce from "lodash/debounce";
import { useEffect, useRef, useState, type RefObject } from "react";

import type { ConfigurationId } from "@/core";

import { useDeepMemo } from "@/hooks";

import type { GraphProps } from "../Graph";
import type { Config, CytoscapeType } from "../Graph.model";

export interface UseInitCytoscapeProps extends Required<
  Pick<GraphProps, keyof Omit<Config, "minZoom" | "maxZoom" | "pan">>
> {
  wrapper?: HTMLElement;
  minZoom?: number;
  maxZoom?: number;
  pan?: { x: number; y: number };
  connectionId?: ConfigurationId;
  onLayoutRunningChanged?: (isRunning: boolean) => void;
  onZoomChanged?: (e: unknown) => void;
  onPanChanged?: (e: unknown) => void;
  onArrangementChanged?: (
    cy: CytoscapeType,
    connectionId?: ConfigurationId,
  ) => void;
  arrangementCaptureSuppressed?: RefObject<boolean>;
  arrangementCaptureResetKey?: number;
}

function useInitCytoscape({
  wrapper,
  onLayoutRunningChanged,
  onPanChanged,
  onZoomChanged,
  onArrangementChanged,
  arrangementCaptureSuppressed,
  arrangementCaptureResetKey,
  connectionId,
  ...config
}: UseInitCytoscapeProps) {
  const [cy, setCy] = useState<CytoscapeType | undefined>();

  const memoizedConfig = useDeepMemo(() => config, [config]);

  const { autolock, userZoomingEnabled, userPanningEnabled } = memoizedConfig;
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
    onArrangementChanged,
  });

  useEffect(() => {
    eventHandlerRefs.current = {
      onLayoutRunningChanged,
      onPanChanged,
      onZoomChanged,
      onArrangementChanged,
    };
  }, [
    onLayoutRunningChanged,
    onPanChanged,
    onZoomChanged,
    onArrangementChanged,
  ]);

  useEffect(() => {
    layoutGraphConfig.current = {
      autolock,
      userZoomingEnabled,
      userPanningEnabled,
    };
  }, [autolock, userZoomingEnabled, userPanningEnabled]);

  const connectionIdRef = useRef(connectionId);
  const layoutTargetRef = useRef<ConfigurationId | undefined>(connectionId);
  const dragTargetRef = useRef<ConfigurationId | undefined>(connectionId);
  const pendingViewportRef = useRef<{
    pan?: { x: number; y: number };
    zoom?: number;
  }>({});
  const debouncedArrangementRef = useRef<ReturnType<typeof debounce> | null>(
    null,
  );

  useEffect(() => {
    connectionIdRef.current = connectionId;
    pendingViewportRef.current = {};
    debouncedArrangementRef.current?.cancel();
  }, [connectionId]);

  useEffect(() => {
    pendingViewportRef.current = {};
    debouncedArrangementRef.current?.cancel();
  }, [arrangementCaptureResetKey]);

  useEffect(() => {
    if (wrapper) {
      const cy = cytoscape({
        container: wrapper,
        style: [],
        ...memoizedConfig,
      });

      cy.on("layoutstart", () => {
        cy.userPanningEnabled(false);
        cy.userZoomingEnabled(false);
        layoutTargetRef.current = connectionIdRef.current;
        eventHandlerRefs.current.onLayoutRunningChanged?.(true);
      });

      cy.on("layoutstop", () => {
        cy.userPanningEnabled(layoutGraphConfig.current.userPanningEnabled);
        cy.userZoomingEnabled(layoutGraphConfig.current.userZoomingEnabled);
        if (layoutGraphConfig.current.autolock) {
          cy.nodes().lock();
        }
        eventHandlerRefs.current.onLayoutRunningChanged?.(false);
        if (!arrangementCaptureSuppressed?.current) {
          eventHandlerRefs.current.onArrangementChanged?.(
            cy,
            layoutTargetRef.current,
          );
        }
      });

      cy.on("grab", "node", () => {
        dragTargetRef.current = connectionIdRef.current;
      });

      cy.on("dragfree", "node", () => {
        if (!arrangementCaptureSuppressed?.current) {
          eventHandlerRefs.current.onArrangementChanged?.(
            cy,
            dragTargetRef.current,
          );
        }
      });

      // Avoid to notify every single change during animation
      const debouncedArrangement = debounce(
        (cy: CytoscapeType, targetId?: ConfigurationId) => {
          if (
            arrangementCaptureSuppressed?.current ||
            targetId !== connectionIdRef.current
          ) {
            pendingViewportRef.current = {};
            return;
          }
          if (pendingViewportRef.current.pan) {
            eventHandlerRefs.current.onPanChanged?.(
              pendingViewportRef.current.pan,
            );
          }
          if (pendingViewportRef.current.zoom) {
            eventHandlerRefs.current.onZoomChanged?.(
              pendingViewportRef.current.zoom,
            );
          }
          eventHandlerRefs.current.onArrangementChanged?.(cy, targetId);
          pendingViewportRef.current = {};
        },
        100,
      );
      debouncedArrangementRef.current = debouncedArrangement;

      cy.on("pan", () => {
        if (arrangementCaptureSuppressed?.current) return;
        pendingViewportRef.current.pan = cy.pan();
        debouncedArrangement(cy, connectionIdRef.current);
      });

      cy.on("zoom", () => {
        if (arrangementCaptureSuppressed?.current) return;
        pendingViewportRef.current.zoom = cy.zoom();
        debouncedArrangement(cy, connectionIdRef.current);
      });

      setCy(cy);

      return () => {
        debouncedArrangement.cancel();
        (cy.elements() as any).removeAllListeners();
        (cy as any).removeAllListeners();
        cy.destroy();
        cy.unmount();
        setCy(undefined);
      };
    }
    // since this is to init cytoscape, this should only run when wrapper is set
  }, [arrangementCaptureSuppressed, memoizedConfig, wrapper]);

  return cy;
}

export default useInitCytoscape;
