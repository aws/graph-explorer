import { useCallback, useRef, useState } from "react";
import { useLayer, useMousePositionAsTrigger } from "react-laag";
import type { EdgeData, VertexData } from "../../@types/entities";
import type {
  ElementEventCallback,
  GraphEventCallback,
} from "../../components/Graph/hooks/useAddClickEvents";
import { useClickOutside } from "../../utils";

const useContextMenu = () => {
  // Bounding container used to position the layer correctly
  const parentRef = useRef<HTMLDivElement>(null);

  const [contextNodeId, setContextNodeId] = useState<string | null>(null);
  const [contextEdgeId, setContextEdgeId] = useState<string | null>(null);
  const [contextPosition, setContextPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const {
    hasMousePosition,
    handleMouseEvent,
    trigger,
  } = useMousePositionAsTrigger({
    enabled: true,
    preventDefault: false,
  });

  const clearAllLayers = useCallback(() => {
    setContextNodeId(null);
    setContextEdgeId(null);
    setContextPosition(null);
  }, []);

  useClickOutside({
    ref: parentRef,
    onClickOutside: clearAllLayers,
    id: "",
  });

  const {
    renderLayer: renderContextLayer,
    layerProps: contextLayerProps,
  } = useLayer({
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

  const onNodeRightClick: ElementEventCallback<VertexData> = useCallback(
    (event, node, bounds) => {
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
      setContextNodeId(node.id);
    },
    [handleMouseEvent]
  );

  const onEdgeRightClick: ElementEventCallback<EdgeData> = useCallback(
    (event, edge) => {
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
      setContextEdgeId(edge.id);
      event.preventDefault();
    },
    [handleMouseEvent]
  );

  const onGraphRightClick: GraphEventCallback = useCallback(
    (event, position) => {
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
    },
    [clearAllLayers, handleMouseEvent]
  );

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
};

export default useContextMenu;
