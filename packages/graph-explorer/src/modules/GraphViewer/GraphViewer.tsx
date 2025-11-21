import {
  Activity,
  type ComponentPropsWithRef,
  type MouseEvent,
  useRef,
  useState,
} from "react";
import {
  createRenderedEdgeId,
  createRenderedVertexId,
  getEdgeIdFromRenderedEdgeId,
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
  IconButton,
  VertexSymbolByType,
} from "@/components";
import Graph from "@/components/Graph";
import type { GraphRef } from "@/components/Graph/Graph";
import type { ElementEventCallback } from "@/components/Graph/hooks/useAddClickEvents";
import { edgesOutOfFocusIdsAtom } from "@/core/StateProvider/edges";
import { nodesOutOfFocusIdsAtom } from "@/core/StateProvider/nodes";
import { useClearGraph, useExpandNode } from "@/hooks";
import ContextMenu from "./internalComponents/ContextMenu";
import useContextMenu from "./useContextMenu";
import useGraphGlobalActions from "./useGraphGlobalActions";
import useGraphStyles from "./useGraphStyles";
import useNodeBadges from "./useNodeBadges";
import type { SelectedElements } from "@/components/Graph/Graph.model";
import { ImportGraphButton } from "./ImportGraphButton";
import { ExportGraphButton } from "./ExportGraphButton";
import {
  BadgeInfoIcon,
  CircleSlash2,
  FullscreenIcon,
  GitCompareArrowsIcon,
  ImageDownIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { useAtomValue } from "jotai";
import { useDefaultNeighborExpansionLimit } from "@/hooks/useExpandNode";
import { graphLayoutSelectionAtom, SelectLayout } from "./SelectLayout";
import { useGraphSelection } from "./useGraphSelection";
import { cn, isVisible } from "@/utils";
import { GraphViewerEmptyState } from "./GraphViewerEmptyState";

// Prevent open context menu on Windows
function onContextMenu(e: MouseEvent<HTMLDivElement>) {
  e.preventDefault();
  e.stopPropagation();
}

export default function GraphViewer({
  className,
  ...props
}: Omit<ComponentPropsWithRef<"div">, "children" | "onContextMenu">) {
  const graphRef = useRef<GraphRef | null>(null);

  const { graphSelection, replaceGraphSelection } = useGraphSelection();
  const selectedVertices = graphSelection.vertices.map(createRenderedVertexId);
  const selectedEdges = graphSelection.edges.map(createRenderedEdgeId);

  const nodesOutIds = useAtomValue(nodesOutOfFocusIdsAtom);
  const edgesOutIds = useAtomValue(edgesOutOfFocusIdsAtom);

  // Map the ids to rendered IDs for compatibility with Cytoscape
  const nodesOutRenderedIds = new Set(
    nodesOutIds.values().map(createRenderedVertexId),
  );
  const edgesOutRenderedIds = new Set(
    edgesOutIds.values().map(createRenderedEdgeId),
  );

  const onSelectedElementIdsChange = ({
    nodeIds,
    edgeIds,
  }: SelectedElements) => {
    // Map the rendered ids to the original ids and change selection
    replaceGraphSelection({
      vertices: (nodeIds as Set<RenderedVertexId>)
        .values()
        .map(getVertexIdFromRenderedVertexId),
      edges: (edgeIds as Set<RenderedEdgeId>)
        .values()
        .map(getEdgeIdFromRenderedEdgeId),
      disableSideEffects: false,
    });
  };

  const [legendOpen, setLegendOpen] = useState(false);
  const { onZoomIn, onZoomOut, onSaveScreenshot, onFitAllToCanvas } =
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
  const defaultNeighborExpansionLimit = useDefaultNeighborExpansionLimit();
  const onNodeDoubleClick: ElementEventCallback<RenderedVertex["data"]> = (
    _,
    vertex,
  ) => {
    const vertexId = getVertexIdFromRenderedVertexId(vertex.id);

    expandNode({
      vertexId,
      limit: defaultNeighborExpansionLimit ?? undefined,
    });
  };

  const layout = useAtomValue(graphLayoutSelectionAtom);
  const onClearGraph = useClearGraph();

  const nodes = useRenderedVertices();
  const edges = useRenderedEdges();

  const isEmpty = !nodes.length && !edges.length;

  return (
    <div className={cn("size-full min-h-0 grow", className)} {...props}>
      <Panel>
        <PanelHeader>
          <PanelTitle>Graph View</PanelTitle>
          <PanelHeaderActions>
            <SelectLayout className="max-w-64 min-w-auto" />
            <IconButton
              tooltipText="Re-run Layout"
              icon={<GitCompareArrowsIcon />}
              variant="text"
              onClick={() => {
                graphRef.current?.runLayout();
              }}
            />
            <IconButton
              tooltipText="Zoom to Fit"
              icon={<FullscreenIcon />}
              variant="text"
              onClick={onFitAllToCanvas}
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
        <PanelContent className="bg-background-secondary grid" ref={parentRef}>
          <Activity mode={isVisible(!isEmpty)}>
            <Graph
              ref={graphRef}
              nodes={nodes}
              edges={edges}
              badgesEnabled={false}
              getNodeBadges={getNodeBadges(nodesOutRenderedIds)}
              selectedNodesIds={selectedVertices}
              selectedEdgesIds={selectedEdges}
              outOfFocusNodesIds={nodesOutRenderedIds}
              outOfFocusEdgesIds={edgesOutRenderedIds}
              onSelectedElementIdsChange={onSelectedElementIdsChange}
              onNodeDoubleClick={onNodeDoubleClick}
              onNodeRightClick={onNodeRightClick}
              onEdgeRightClick={onEdgeRightClick}
              onGraphRightClick={onGraphRightClick}
              styles={styles}
              layout={layout}
              className="col-start-1 row-start-1 min-h-0 min-w-0"
              onContextMenu={onContextMenu}
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
                </div>,
              )}
          </Activity>
          <Activity mode={isVisible(isEmpty)}>
            <GraphViewerEmptyState className="col-start-1 row-start-1" />
          </Activity>
          <Activity mode={isVisible(legendOpen)}>
            <div className="z-20 col-start-1 row-start-1 grid min-h-0 justify-self-end p-3">
              <Legend onClose={() => setLegendOpen(false)} />
            </div>
          </Activity>
        </PanelContent>
      </Panel>
    </div>
  );
}

function Legend({
  onClose,
  className,
  ...props
}: { onClose: () => void } & ComponentPropsWithRef<typeof Panel>) {
  const vtConfigs = useDisplayVertexTypeConfigs().values().toArray();

  return (
    <Panel className={cn("max-w-md shadow-md", className)} {...props}>
      <PanelHeader>
        <PanelTitle>Legend</PanelTitle>
        <PanelHeaderActions>
          <PanelHeaderCloseButton onClose={onClose} />
        </PanelHeaderActions>
      </PanelHeader>
      <PanelContent className="p-3">
        <ul className="space-y-3">
          {vtConfigs.map(vtConfig => (
            <li
              key={vtConfig.type}
              className="gx-wrap-break-word flex items-center gap-3 text-base font-medium"
            >
              <VertexSymbolByType
                vertexType={vtConfig.type}
                className="size-9"
              />
              {vtConfig.displayLabel}
            </li>
          ))}
        </ul>
      </PanelContent>
    </Panel>
  );
}
