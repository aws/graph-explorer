import { useRef, useState } from "react";
import { useLayer, useMousePositionAsTrigger } from "react-laag";
import {
  getEdgeIdFromRenderedEdgeId,
  getVertexIdFromRenderedVertexId,
  type RenderedEdge,
  type RenderedVertex,
  type EdgeId,
  type VertexId,
} from "@/core";
import type {
  ElementEventCallback,
  GraphEventCallback,
} from "@/components/Graph/hooks/useAddClickEvents";
import { useClickOutside } from "@/utils";

function useContextMenu() {
  // Bounding container used to position the layer correctly
  const parentRef = useRef<HTMLDivElement | null>(null);

  const [contextNodeId, setContextNodeId] = useState<VertexId | null>(null);
  const [contextEdgeId, setContextEdgeId] = useState<EdgeId | null>(null);
  const [contextPosition, setContextPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const { hasMousePosition, handleMouseEvent, trigger } =
    useMousePositionAsTrigger({
      enabled: true,
      preventDefault: false,
    });

  const clearAllLayers = () => {
    setContextNodeId(null);
    setContextEdgeId(null);
    setContextPosition(null);
  };

  useClickOutside({
    ref: parentRef,
    onClickOutside: clearAllLayers,
    id: "",
  });

  const { renderLayer: renderContextLayer, layerProps: contextLayerProps } =
    useLayer({
      isOpen: Boolean(contextNodeId) || Boolean(contextPosition),
      overflowContainer: true,
      auto: true,
      placement: "right-center",
      triggerOffset: 0,
      trigger,
      onParentClose: clearAllLayers,
      onDisappear: clearAllLayers,
      onOutsideClick: clearAllLayers,
    });

  const onNodeRightClick: ElementEventCallback<RenderedVertex["data"]> = (
    event,
    node,
    bounds,
  ) => {
    const parentBounds = parentRef.current?.getBoundingClientRect() || {
      top: 0,
      left: 0,
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    handleMouseEvent({
      ...event.originalEvent,
      // Override the event position to node bounds and parent offsets
      clientY: parentBounds.top + bounds.top + bounds.height / 2,
      clientX: parentBounds.left + bounds.left + bounds.width,
    });
    setContextNodeId(getVertexIdFromRenderedVertexId(node.id));
  };

  const onEdgeRightClick: ElementEventCallback<RenderedEdge["data"]> = (
    event,
    edge,
  ) => {
    const parentBounds = parentRef.current?.getBoundingClientRect() || {
      top: 0,
      left: 0,
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    handleMouseEvent({
      ...event.originalEvent,
      // Override the event position to event position and parent offsets
      clientY: event.renderedPosition.y + parentBounds.top,
      clientX: event.renderedPosition.x + parentBounds.left,
    });
    setContextEdgeId(getEdgeIdFromRenderedEdgeId(edge.id));
    event.preventDefault();
  };

  const onGraphRightClick: GraphEventCallback = (event, position) => {
    event.originalEvent.preventDefault();
    event.originalEvent.stopPropagation();
    event.originalEvent.cancelBubble = true;
    event.preventDefault();
    event.stopPropagation();

    clearAllLayers();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    handleMouseEvent({
      ...event.originalEvent,
      clientY: position.top,
      clientX: position.left,
    });
    setContextPosition(position);
  };

  const isContextOpen =
    (Boolean(contextNodeId) ||
      Boolean(contextEdgeId) ||
      Boolean(contextPosition)) &&
    hasMousePosition;

  return {
    parentRef,
    isContextOpen,
    onNodeRightClick,
    onEdgeRightClick,
    onGraphRightClick,
    renderContextLayer,
    contextLayerProps,
    contextNodeId,
    contextEdgeId,
    clearAllLayers,
  };
}

export default useContextMenu;
