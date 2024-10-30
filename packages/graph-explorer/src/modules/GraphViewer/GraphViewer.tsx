import { cn } from "@/utils";
import { MouseEvent, useCallback, useMemo, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { Vertex } from "@/types/entities";
import type { ActionItem, ModuleContainerHeaderProps } from "@/components";
import {
  ModuleContainer,
  ModuleContainerHeader,
  RemoveFromCanvasIcon,
  ResetIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@/components";
import Card from "@/components/Card";
import Graph from "@/components/Graph";
import { GraphRef } from "@/components/Graph/Graph";
import { ElementEventCallback } from "@/components/Graph/hooks/useAddClickEvents";
import IconButton from "@/components/IconButton";
import CloseIcon from "@/components/icons/CloseIcon";
import InfoIcon from "@/components/icons/InfoIcon";
import ScreenshotIcon from "@/components/icons/ScreenshotIcon";
import ListItem from "@/components/ListItem";
import RemoteSvgIcon from "@/components/RemoteSvgIcon";
import Select from "@/components/Select";
import {
  edgesHiddenIdsAtom,
  edgesOutOfFocusIdsAtom,
  edgesSelectedIdsAtom,
} from "@/core/StateProvider/edges";
import {
  nodesHiddenIdsAtom,
  nodesOutOfFocusIdsAtom,
  nodesSelectedIdsAtom,
} from "@/core/StateProvider/nodes";
import useWithTheme from "@/core/ThemeProvider/useWithTheme";
import fade from "@/core/ThemeProvider/utils/fade";
import { useEntities, useExpandNode } from "@/hooks";
import useTextTransform from "@/hooks/useTextTransform";
import defaultStyles from "./GraphViewerModule.styles";
import ContextMenu from "./internalComponents/ContextMenu";
import useContextMenu from "./useContextMenu";
import useGraphGlobalActions from "./useGraphGlobalActions";
import useGraphStyles from "./useGraphStyles";
import useNodeBadges from "./useNodeBadges";
import useNodeDrop from "./useNodeDrop";
import { useVertexTypeConfigs } from "@/core/ConfigurationProvider/useConfiguration";

export type GraphViewerProps = Omit<
  ModuleContainerHeaderProps,
  "title" | "sidebar"
> & {
  title?: ModuleContainerHeaderProps["title"];
  onNodeCustomize(nodeType?: string): void;
  onEdgeCustomize(edgeType?: string): void;
};

const LAYOUT_OPTIONS = [
  {
    label: "Force Directed  (F0Cose)",
    value: "F_COSE",
  },
  {
    label: "Force Directed (D3)",
    value: "D3",
  },
  {
    label: "Hierarchical - Vertical",
    value: "DAGRE_VERTICAL",
  },
  {
    label: "Hierarchical - Horizontal",
    value: "DAGRE_HORIZONTAL",
  },
  {
    label: "Subway - Vertical",
    value: "SUBWAY_VERTICAL",
  },
  {
    label: "Subway - Horizontal",
    value: "SUBWAY_HORIZONTAL",
  },
  {
    label: "Klay",
    value: "KLAY",
  },
  {
    label: "Concentric",
    value: "CONCENTRIC",
  },
];

const HEADER_ACTIONS: ActionItem[] = [
  {
    value: "download_screenshot",
    label: "Download Screenshot",
    icon: <ScreenshotIcon />,
  },
  "divider",
  {
    value: "zoom_in",
    label: "Zoom in",
    icon: <ZoomInIcon />,
  },
  {
    value: "zoom_out",
    label: "Zoom out",
    icon: <ZoomOutIcon />,
  },
  "divider",
  {
    value: "clear_canvas",
    label: "Clear canvas",
    icon: <RemoveFromCanvasIcon />,
    color: "error",
  },
  "divider",
  {
    value: "legend",
    label: "Legend",
    icon: <InfoIcon />,
  },
];

// Prevent open context menu on Windows
function onContextMenu(e: MouseEvent<HTMLDivElement>) {
  e.preventDefault();
  e.stopPropagation();
}

export default function GraphViewer({
  title = "Graph View",
  onNodeCustomize,
  onEdgeCustomize,
  ...headerProps
}: GraphViewerProps) {
  const styleWithTheme = useWithTheme();

  const graphRef = useRef<GraphRef | null>(null);
  const [entities, setEntities] = useEntities();
  const { dropAreaRef, isOver, canDrop } = useNodeDrop();

  const [nodesSelectedIds, setNodesSelectedIds] =
    useRecoilState(nodesSelectedIdsAtom);
  const hiddenNodesIds = useRecoilValue(nodesHiddenIdsAtom);

  const [edgesSelectedIds, setEdgesSelectedIds] =
    useRecoilState(edgesSelectedIdsAtom);
  const hiddenEdgesIds = useRecoilValue(edgesHiddenIdsAtom);
  const nodesOutIds = useRecoilValue(nodesOutOfFocusIdsAtom);
  const edgesOutIds = useRecoilValue(edgesOutOfFocusIdsAtom);

  const onSelectedNodesIdsChange = useCallback(
    (selectedIds: string[] | Set<string>) => {
      setNodesSelectedIds(new Set(selectedIds));
    },
    [setNodesSelectedIds]
  );

  const onSelectedEdgesIdsChange = useCallback(
    (selectedIds: string[] | Set<string>) => {
      setEdgesSelectedIds(new Set(selectedIds));
    },
    [setEdgesSelectedIds]
  );

  const [legendOpen, setLegendOpen] = useState(false);
  const { onZoomIn, onZoomOut, onSaveScreenshot } =
    useGraphGlobalActions(graphRef);

  const {
    clearAllLayers,
    contextLayerProps,
    contextNodeId,
    contextEdgeId,
    isContextOpen,
    onGraphRightClick,
    onNodeRightClick,
    onEdgeRightClick,
    parentRef,
    renderContextLayer,
  } = useContextMenu();

  const styles = useGraphStyles();
  const getNodeBadges = useNodeBadges();

  const { expandNode } = useExpandNode();
  const onNodeDoubleClick: ElementEventCallback<Vertex> = useCallback(
    (_, vertex) => {
      const offset = vertex.__unfetchedNeighborCount
        ? Math.max(0, vertex.neighborsCount - vertex.__unfetchedNeighborCount)
        : undefined;
      expandNode(vertex, {
        limit: 10,
        offset,
      });
    },
    [expandNode]
  );

  const [layout, setLayout] = useState("F_COSE");
  const onClearCanvas = useCallback(() => {
    setEntities({
      nodes: [],
      edges: [],
      forceSet: true,
    });
  }, [setEntities]);

  const onHeaderActionClick = useCallback(
    (action: any) => {
      switch (action) {
        case "zoom_in":
          return onZoomIn();
        case "zoom_out":
          return onZoomOut();
        case "clear_canvas":
          return onClearCanvas();
        case "download_screenshot":
          return onSaveScreenshot();
        case "legend":
          return setLegendOpen(open => !open);
      }
    },
    [onClearCanvas, onSaveScreenshot, onZoomIn, onZoomOut]
  );

  const nodes = useMemo(
    () => entities.nodes.map(n => ({ data: n })),
    [entities]
  );
  const edges = useMemo(
    () => entities.edges.map(e => ({ data: e })),
    [entities]
  );

  return (
    <div
      ref={dropAreaRef}
      className={cn(styleWithTheme(defaultStyles), "graph-viewer-module")}
      onContextMenu={onContextMenu}
    >
      <ModuleContainer>
        <ModuleContainerHeader
          title={
            <div
              style={{ display: "flex", width: "100%", alignItems: "center" }}
            >
              <div style={{ whiteSpace: "nowrap" }}>{title}</div>
              <Select
                className={"entity-select"}
                label={"Layout"}
                labelPlacement={"inner"}
                hideError={true}
                options={LAYOUT_OPTIONS}
                value={layout}
                onChange={v => setLayout(v as string)}
              />
              <IconButton
                tooltipText={"Re-run Layout"}
                tooltipPlacement={"bottom-center"}
                icon={<ResetIcon />}
                variant={"text"}
                onPress={() => {
                  graphRef.current?.runLayout();
                }}
              />
            </div>
          }
          variant={"default"}
          actions={HEADER_ACTIONS}
          onActionClick={onHeaderActionClick}
          {...headerProps}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            width: "100%",
            height: "100%",
          }}
          ref={parentRef}
        >
          <Graph
            ref={graphRef}
            nodes={nodes}
            edges={edges}
            badgesEnabled={false}
            getNodeBadges={getNodeBadges(nodesOutIds)}
            selectedNodesIds={nodesSelectedIds}
            hiddenNodesIds={hiddenNodesIds}
            selectedEdgesIds={edgesSelectedIds}
            hiddenEdgesIds={hiddenEdgesIds}
            outOfFocusNodesIds={nodesOutIds}
            outOfFocusEdgesIds={edgesOutIds}
            onSelectedNodesIdsChange={onSelectedNodesIdsChange}
            onSelectedEdgesIdsChange={onSelectedEdgesIdsChange}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeRightClick={onNodeRightClick}
            onEdgeRightClick={onEdgeRightClick}
            onGraphRightClick={onGraphRightClick}
            styles={styles}
            layout={layout}
          />
          {isContextOpen &&
            renderContextLayer(
              <div
                {...contextLayerProps}
                style={{ ...contextLayerProps.style, zIndex: 999999 }}
              >
                <ContextMenu
                  graphRef={graphRef}
                  onClose={clearAllLayers}
                  affectedNodesIds={contextNodeId ? [contextNodeId] : []}
                  affectedEdgesIds={contextEdgeId ? [contextEdgeId] : []}
                  onNodeCustomize={onNodeCustomize}
                  onEdgeCustomize={onEdgeCustomize}
                />
              </div>
            )}
          {legendOpen && <Legend onClose={() => setLegendOpen(false)} />}
        </div>
      </ModuleContainer>
      <div
        className={cn("drop-overlay", {
          ["drop-overlay-is-over"]: isOver,
          ["drop-overlay-can-drop"]: !isOver && canDrop,
        })}
      />
    </div>
  );
}

function Legend({ onClose }: { onClose: () => void }) {
  const textTransform = useTextTransform();
  const vtConfigs = useVertexTypeConfigs();

  return (
    <Card className={"legend-container"}>
      <ListItem
        className={cn("legend-item", "legend-title")}
        endAdornment={
          <IconButton
            icon={<CloseIcon />}
            onPress={onClose}
            variant={"text"}
            size={"small"}
          />
        }
      >
        Legend
      </ListItem>
      {vtConfigs.map(vtConfig => {
        return (
          <ListItem
            key={vtConfig.type}
            className={"legend-item"}
            startAdornment={
              vtConfig.iconUrl && (
                <div
                  className={"icon"}
                  style={{
                    background: fade(vtConfig.color, 0.2),
                    color: vtConfig.color,
                  }}
                >
                  <RemoteSvgIcon src={vtConfig.iconUrl} />
                </div>
              )
            }
          >
            {vtConfig.displayLabel || textTransform(vtConfig.type)}
          </ListItem>
        );
      })}
    </Card>
  );
}
