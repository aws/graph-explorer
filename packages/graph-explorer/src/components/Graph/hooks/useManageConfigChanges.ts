import { useEffect, useRef } from "react";
import type { Config, CytoscapeType } from "../Graph.model";

function useChangeConfig(
  cy?: CytoscapeType,
  configValue?: unknown,
  configFnName?: keyof CytoscapeType,
  compareFn: (oldValue?: any, newValue?: any) => boolean = (
    oldValue,
    newValue
  ) => oldValue !== newValue
) {
  const compare = useRef<typeof compareFn>(compareFn);

  useEffect(() => {
    if (cy && configFnName && configValue !== undefined) {
      if (compare.current((cy[configFnName] as () => void)(), configValue)) {
        (cy[configFnName] as (...args: any[]) => void)(configValue);
      }
    }
  }, [cy, configFnName, configValue]);
}

export const useManageConfigChanges = (config: Config, cy?: CytoscapeType) => {
  const {
    minZoom,
    maxZoom,
    boxSelectionEnabled,
    zoom,
    pan,
    autounselectify,
    autolock,
    autoungrabify,
    selectionType,
    userPanningEnabled,
    userZoomingEnabled,
  } = config;

  useEffect(() => {
    if (cy && cy.zoom() !== zoom) {
      cy.zoom(zoom);
    }
  }, [cy, zoom]);

  useEffect(() => {
    if (cy && minZoom !== undefined && cy.minZoom() !== minZoom) {
      cy.minZoom(minZoom);
    }

    if (cy && maxZoom !== undefined && cy.maxZoom() !== maxZoom) {
      cy.maxZoom(maxZoom);
    }

    if (cy && minZoom !== undefined && zoom !== undefined && zoom < minZoom) {
      cy.zoom(minZoom);
    }

    if (cy && maxZoom !== undefined && zoom !== undefined && zoom > maxZoom) {
      cy.zoom(maxZoom);
    }
  }, [cy, zoom, minZoom, maxZoom]);

  useEffect(() => {
    if (cy) {
      //lock nodes instead of using cy.autolock(autolock) to allow layout to run on newly added nodes before locking
      autolock ? cy.nodes().lock() : cy.nodes().unlock();
    }
  }, [autolock, cy]);

  useChangeConfig(cy, boxSelectionEnabled, "boxSelectionEnabled");
  useChangeConfig(
    cy,
    pan,
    "pan",
    (oldValue, newValue) =>
      oldValue &&
      newValue &&
      (oldValue.x !== newValue.x || oldValue.y !== newValue.y)
  );
  useChangeConfig(cy, autounselectify, "autounselectify");
  useChangeConfig(cy, autoungrabify, "autoungrabify");
  useChangeConfig(cy, selectionType, "selectionType");
  useChangeConfig(cy, userPanningEnabled, "userPanningEnabled");
  useChangeConfig(cy, userZoomingEnabled, "userZoomingEnabled");
};
