import cytoscape from "cytoscape";
import { useEffect, useRef } from "react";

import { CytoscapeType } from "../Graph.model";

export type Position = {
  top: number;
  left: number;
};

export type BoundingRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type GraphEventCallback = (
  event: cytoscape.EventObject,
  position: Position
) => void;

export type ElementEventCallback<TElement extends object = any> = (
  event: cytoscape.EventObject,
  element: TElement,
  bounds: BoundingRect
) => void;

type GroupElementEventCallback<TNode extends object = any> = (
  event: cytoscape.EventObject,
  node: TNode,
  children: TNode[],
  bounds: BoundingRect
) => void;

export interface UseAddClickEvents<
  TNode extends object = any,
  TEdge extends object = any
> {
  cy?: CytoscapeType;
  // Graph events
  onGraphClick?: GraphEventCallback;
  onGraphRightClick?: GraphEventCallback;

  // Node events
  onNodeClick?: ElementEventCallback<TNode>;
  onNodeDoubleClick?: ElementEventCallback<TNode>;
  onNodeRightClick?: ElementEventCallback<TNode>;
  onNodeMouseOver?: ElementEventCallback<TNode>;
  onNodeMouseOut?: ElementEventCallback<TNode>;
  onNodeMouseDown?: ElementEventCallback<TNode>;

  // Edge events
  onEdgeClick?: ElementEventCallback<TEdge>;
  onEdgeMouseOver?: ElementEventCallback<TEdge>;
  onEdgeMouseOut?: ElementEventCallback<TEdge>;
  onEdgeRightClick?: ElementEventCallback<TEdge>;
  onEdgeDoubleClick?: ElementEventCallback<TEdge>;

  // Group events
  onGroupClick?: GroupElementEventCallback<TNode>;
  onGroupDoubleClick?: GroupElementEventCallback<TNode>;
}

const DOUBLE_CLICK_DELAY_MS = 200;

const useAddClickEvents = ({
  cy,
  onGraphClick,
  onGraphRightClick,
  onNodeClick,
  onEdgeClick,
  onNodeDoubleClick,
  onNodeRightClick,
  onEdgeDoubleClick,
  onEdgeRightClick,
  onGroupClick,
  onGroupDoubleClick,
  onNodeMouseOver,
  onNodeMouseOut,
  onNodeMouseDown,
  onEdgeMouseOut,
  onEdgeMouseOver,
}: UseAddClickEvents) => {
  const lastTapTimestamp = useRef<number>(0);

  useEffect(() => {
    if (!cy) {
      return;
    }

    const handleDoubleTap = (event: cytoscape.EventObject) => {
      if (
        lastTapTimestamp.current + DOUBLE_CLICK_DELAY_MS >=
        new Date().getTime()
      ) {
        event.target.trigger("doubleTap", event);
        return;
      }

      lastTapTimestamp.current = new Date().getTime();
    };

    cy.on("tap", handleDoubleTap);

    return () => {
      cy.off("tap", handleDoubleTap);
    };
  }, [cy]);

  useEffect(() => {
    if (!cy) {
      return;
    }

    const withMousePosition = (
      e: cytoscape.EventObject,
      cb?: GraphEventCallback
    ) => {
      if (!cb) {
        return;
      }

      const { clientY, clientX } = e.originalEvent;
      cb(e, { top: clientY, left: clientX });
    };

    const withElementAndBounds = (
      e: cytoscape.EventObject,
      cb?: ElementEventCallback
    ) => {
      if (!cb) {
        return;
      }

      const { x1, y1, x2, y2 } = e.target.renderedBoundingBox({
        includeEdges: false,
        includeLabels: false,
        includeOverlays: false,
      });

      cb(e, e.target.data(), {
        top: y1,
        left: x1,
        width: x2 - x1,
        height: y2 - y1,
      });
    };

    const withGroupElementAndBounds = (
      e: cytoscape.EventObject,
      cb?: GroupElementEventCallback
    ) => {
      if (!cb) {
        return;
      }

      const { x1, y1, x2, y2 } = e.target.renderedBoundingBox({
        includeEdges: false,
        includeLabels: false,
        includeOverlays: false,
      });

      const groupElement = e.target as cytoscape.CollectionReturnValue;
      cb(
        e,
        e.target.data(),
        groupElement
          .children()
          .nodes()
          .toArray()
          .map(node => node.data()),
        {
          top: y1,
          left: x1,
          width: x2 - x1,
          height: y2 - y1,
        }
      );
    };

    const handleOnGraphClick = (e: cytoscape.EventObject) =>
      withMousePosition(e, onGraphClick);
    const handleOnGraphRightClick = (e: cytoscape.EventObject) =>
      withMousePosition(e, onGraphRightClick);
    const handleOnNodeClick = (e: cytoscape.EventObject) =>
      withElementAndBounds(e, onNodeClick);
    const handleOnNodeMouseOver = (e: cytoscape.EventObject) =>
      withElementAndBounds(e, onNodeMouseOver);
    const handleOnNodeMouseOut = (e: cytoscape.EventObject) =>
      withElementAndBounds(e, onNodeMouseOut);
    const handleOnNodeMouseDown = (e: cytoscape.EventObject) =>
      withElementAndBounds(e, onNodeMouseDown);
    const handleOnNodeDoubleClick = (e: cytoscape.EventObject) =>
      withElementAndBounds(e, onNodeDoubleClick);
    const handleOnNodeRightClick = (e: cytoscape.EventObject) =>
      withElementAndBounds(e, onNodeRightClick);

    const handleOnEdgeClick = (e: cytoscape.EventObject) =>
      withElementAndBounds(e, onEdgeClick);
    const handleOnEdgeRightClick = (e: cytoscape.EventObject) =>
      withElementAndBounds(e, onEdgeRightClick);
    const handleOnEdgeDoubleClick = (e: cytoscape.EventObject) =>
      withElementAndBounds(e, onEdgeDoubleClick);
    const handleOnEdgeMouseOver = (e: cytoscape.EventObject) =>
      withElementAndBounds(e, onEdgeMouseOver);
    const handleOnEdgeMouseOut = (e: cytoscape.EventObject) =>
      withElementAndBounds(e, onEdgeMouseOut);
    const handleOnGroupClick = (e: cytoscape.EventObject) =>
      withGroupElementAndBounds(e, onGroupClick);
    const handleOnGroupDoubleClick = (e: cytoscape.EventObject) =>
      withGroupElementAndBounds(e, onGroupDoubleClick);

    // Graph events
    cy.on("tap", handleOnGraphClick);
    cy.on("cxttap", handleOnGraphRightClick);

    // Node events
    cy.on("tap", "node[!__isGroupNode]", handleOnNodeClick);
    cy.on("tapstart", "node[!__isGroupNode]", handleOnNodeMouseDown);
    cy.on("doubleTap", "node[!__isGroupNode]", handleOnNodeDoubleClick);
    cy.on("cxttap", "node[!__isGroupNode]", handleOnNodeRightClick);
    cy.on("mouseover", "node[!__isGroupNode]", handleOnNodeMouseOver);
    cy.on("mouseout", "node[!__isGroupNode]", handleOnNodeMouseOut);

    // Edge events
    cy.on("tap", "edge", handleOnEdgeClick);
    cy.on("cxttap", "edge", handleOnEdgeRightClick);
    cy.on("doubleTap", "edge", handleOnEdgeDoubleClick);
    cy.on("mouseover", "edge", handleOnEdgeMouseOver);
    cy.on("mouseout", "edge", handleOnEdgeMouseOut);

    // Group events
    onGroupClick && cy.on("tap", "node[?__isGroupNode]", handleOnGroupClick);
    onGroupDoubleClick &&
      cy.on("doubleTap", "node[?__isGroupNode]", handleOnGroupDoubleClick);
    return () => {
      // Graph events
      cy.off("tap", handleOnGraphClick);
      cy.off("cxttap", handleOnGraphRightClick);

      // Node events
      cy.off("tap", "node[!__isGroupNode]", handleOnNodeClick);
      cy.off("tapstart", "node[!__isGroupNode]", handleOnNodeMouseDown);
      cy.off("doubleTap", "node[!__isGroupNode]", handleOnNodeDoubleClick);
      cy.off("cxttap", "node[!__isGroupNode]", handleOnNodeRightClick);
      cy.off("mouseover", "node[!__isGroupNode]", handleOnNodeMouseOver);
      cy.off("mouseout", "node[!__isGroupNode]", handleOnNodeMouseOut);

      // Edge events
      cy.off("tap", "edge", handleOnEdgeClick);
      cy.off("cxttap", "edge", handleOnEdgeRightClick);
      cy.off("doubleTap", "edge", handleOnEdgeDoubleClick);
      cy.off("mouseover", "edge", handleOnEdgeMouseOver);
      cy.off("mouseout", "edge", handleOnGroupClick);

      // Group events
      onGroupClick && cy.off("tap", "node[?__isGroupNode]", handleOnGroupClick);
      onGroupDoubleClick &&
        cy.off("doubleTap", "node[?__isGroupNode]", handleOnGroupDoubleClick);
    };
  }, [
    cy,
    onNodeDoubleClick,
    onNodeRightClick,
    onEdgeClick,
    onNodeClick,
    onEdgeDoubleClick,
    onGroupDoubleClick,
    onNodeMouseOver,
    onNodeMouseOut,
    onGraphClick,
    onNodeMouseDown,
    onEdgeMouseOver,
    onEdgeMouseOut,
    onGraphRightClick,
    onGroupClick,
    onEdgeRightClick,
  ]);
};

export default useAddClickEvents;
