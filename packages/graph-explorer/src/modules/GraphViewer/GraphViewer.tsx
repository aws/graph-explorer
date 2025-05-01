import { MouseEvent, useCallback, useRef, useState } from "react";
import {
  getVertexIdFromRenderedVertexId,
  type RenderedEdgeId,
  type RenderedVertex,
  type RenderedVertexId,
  useDisplayVertexTypeConfigs,
  useRenderedEdges,
  useRenderedVertices,
} from "@/core";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActionButton,
  PanelHeaderActions,
  PanelHeaderCloseButton,
  PanelHeaderDivider,
  PanelTitle,
  VertexSymbol,
  IconButton,
} from "@/components";
import Graph from "@/components/Graph";
import { GraphRef } from "@/components/Graph/Graph";
import { ElementEventCallback } from "@/components/Graph/hooks/useAddClickEvents";
import SelectField from "@/components/SelectField";
import {
  edgesOutOfFocusRenderedIdsAtom,
  edgesSelectedRenderedIdsAtom,
} from "@/core/StateProvider/edges";
import {
  nodesOutOfFocusRenderedIdsAtom,
  nodesSelectedRenderedIdsAtom,
} from "@/core/StateProvider/nodes";
import { useClearGraph, useExpandNode } from "@/hooks";
import ContextMenu from "./internalComponents/ContextMenu";
import useContextMenu from "./useContextMenu";
import useGraphGlobalActions from "./useGraphGlobalActions";
import useGraphStyles from "./useGraphStyles";
import useNodeBadges from "./useNodeBadges";
import { SelectedElements } from "@/components/Graph/Graph.model";
import { useAutoOpenDetailsSidebar } from "./useAutoOpenDetailsSidebar";
import { ImportGraphButton } from "./ImportGraphButton";
import { ExportGraphButton } from "./ExportGraphButton";
import {
  BadgeInfoIcon,
  CircleSlash2,
  ImageDownIcon,
  RefreshCwIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { useAtom, useAtomValue } from "jotai";

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

// Prevent open context menu on Windows
function onContextMenu(e: MouseEvent<HTMLDivElement>) {
  e.preventDefault();
  e.stopPropagation();
}

export default function GraphViewer() {
  const graphRef = useRef<GraphRef | null>(null);

  const [nodesSelectedIds, setNodesSelectedIds] = useAtom(
    nodesSelectedRenderedIdsAtom
  );

  const [edgesSelectedIds, setEdgesSelectedIds] = useAtom(
    edgesSelectedRenderedIdsAtom
  );
  const nodesOutIds = useAtomValue(nodesOutOfFocusRenderedIdsAtom);
  const edgesOutIds = useAtomValue(edgesOutOfFocusRenderedIdsAtom);

  const autoOpenDetails = useAutoOpenDetailsSidebar();

  const onSelectedElementIdsChange = useCallback(
    ({ nodeIds, edgeIds }: SelectedElements) => {
      setNodesSelectedIds(nodeIds as Set<RenderedVertexId>);
      setEdgesSelectedIds(edgeIds as Set<RenderedEdgeId>);

      if (
        (nodeIds.size === 1 && edgeIds.size === 0) ||
        (nodeIds.size === 0 && edgeIds.size === 1)
      ) {
        autoOpenDetails();
      }
    },
    [autoOpenDetails, setEdgesSelectedIds, setNodesSelectedIds]
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
  const onNodeDoubleClick: ElementEventCallback<RenderedVertex["data"]> =
    useCallback(
      (_, vertex) => {
        const vertexId = getVertexIdFromRenderedVertexId(vertex.id);

        expandNode(vertexId, vertex.types, {
          limit: 10,
        });
      },
      [expandNode]
    );

  const [layout, setLayout] = useState("F_COSE");
  const onClearGraph = useClearGraph();

  const nodes = useRenderedVertices();
  const edges = useRenderedEdges();

  return (
    <div className="relative size-full grow" onContextMenu={onContextMenu}>
      <Panel>
        <PanelHeader>
          <PanelTitle>Graph View</PanelTitle>
          <PanelHeaderActions>
            <SelectField
              className="min-w-auto max-w-64"
              label="Layout"
              labelPlacement="inner"
              options={LAYOUT_OPTIONS}
              value={layout}
              onValueChange={setLayout}
            />
            <IconButton
              tooltipText="Re-run Layout"
              icon={<RefreshCwIcon />}
              variant="text"
              onClick={() => {
                graphRef.current?.runLayout();
              }}
            />
            <div className="grow" />
            <PanelHeaderActionButton
              label="Download Screenshot"
              icon={<ImageDownIcon />}
              onActionClick={onSaveScreenshot}
            />
            <ExportGraphButton />
            <ImportGraphButton />
            <PanelHeaderDivider />
            <PanelHeaderActionButton
              label="Zoom in"
              icon={<ZoomInIcon />}
              onActionClick={onZoomIn}
            />
            <PanelHeaderActionButton
              label="Zoom out"
              icon={<ZoomOutIcon />}
              onActionClick={onZoomOut}
            />
            <PanelHeaderDivider />
            <PanelHeaderActionButton
              label="Clear canvas"
              icon={<CircleSlash2 />}
              color="danger"
              onActionClick={onClearGraph}
            />
            <PanelHeaderActionButton
              label="Legend"
              icon={<BadgeInfoIcon />}
              onActionClick={() => setLegendOpen(open => !open)}
            />
          </PanelHeaderActions>
        </PanelHeader>
        <PanelContent
          className="bg-background-secondary relative flex h-full w-full"
          ref={parentRef}
        >
          <Graph
            ref={graphRef}
            nodes={nodes}
            edges={edges}
            badgesEnabled={false}
            getNodeBadges={getNodeBadges(nodesOutIds)}
            selectedNodesIds={nodesSelectedIds}
            selectedEdgesIds={edgesSelectedIds}
            outOfFocusNodesIds={nodesOutIds}
            outOfFocusEdgesIds={edgesOutIds}
            onSelectedElementIdsChange={onSelectedElementIdsChange}
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
                style={contextLayerProps.style}
                className="z-menu"
              >
                <ContextMenu
                  graphRef={graphRef}
                  onClose={clearAllLayers}
                  affectedNodesIds={contextNodeId ? [contextNodeId] : []}
                  affectedEdgesIds={contextEdgeId ? [contextEdgeId] : []}
                />
              </div>
            )}
          {legendOpen && <Legend onClose={() => setLegendOpen(false)} />}
        </PanelContent>
      </Panel>
    </div>
  );
}

function Legend({ onClose }: { onClose: () => void }) {
  const vtConfigs = useDisplayVertexTypeConfigs().values().toArray();

  return (
    <Panel className="z-panes absolute bottom-2 right-2 top-2 h-auto min-w-48 max-w-80 rounded-md">
      <PanelHeader className="flex items-center justify-between">
        <PanelTitle className="text-base font-bold">Legend</PanelTitle>
        <PanelHeaderCloseButton onClose={onClose} />
      </PanelHeader>
      <PanelContent className="p-3">
        <ul className="space-y-3">
          {vtConfigs.map(vtConfig => (
            <li
              key={vtConfig.type}
              className="flex items-center gap-3 text-balance text-base font-medium"
            >
              <VertexSymbol vertexStyle={vtConfig.style} className="size-9" />
              {vtConfig.displayLabel}
            </li>
          ))}
        </ul>
      </PanelContent>
    </Panel>
  );
}
