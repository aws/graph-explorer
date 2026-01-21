import type {
  ComponentPropsWithRef,
  MouseEventHandler,
  PropsWithChildren,
} from "react";

import { useSetAtom } from "jotai";
import {
  CircleSlash2,
  FullscreenIcon,
  ImageDownIcon,
  MinusCircleIcon,
  RefreshCwIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { createContext, use } from "react";

import { Divider, EdgeIcon, GraphIcon, StylingIcon } from "@/components";
import { useGraphGlobalActions } from "@/components/Graph";
import {
  CenterGraphIcon,
  DetailsIcon,
  ExpandGraphIcon,
} from "@/components/icons";
import {
  type EdgeId,
  type SidebarItems,
  useDisplayEdgeInCanvas,
  useDisplayVertex,
  userLayoutAtom,
  type VertexId,
} from "@/core";
import {
  useClearGraph,
  useContextMenuTarget,
  useExpandNode,
  useRefreshEntities,
  useRemoveFromGraph,
  useTranslations,
} from "@/hooks";
import { useDefaultNeighborExpansionLimit } from "@/hooks/useExpandNode";
import { useOpenEdgeStyleDialog } from "@/modules/EdgesStyling";
import { useOpenNodeStyleDialog } from "@/modules/NodesStyling";
import { cn } from "@/utils";

import { useGraphSelection } from "../useGraphSelection";

type ContextMenuProps = {
  affectedNodesIds: VertexId[];
  affectedEdgesIds: EdgeId[];
  onClose(): void;
};

export default function ContextMenu({
  affectedNodesIds,
  affectedEdgesIds,
  onClose,
}: ContextMenuProps) {
  const { graphSelection } = useGraphSelection();

  const target = useContextMenuTarget({
    affectedVertexIds: affectedNodesIds,
    affectedEdgeIds: affectedEdgesIds,
    graphSelection,
  });

  return (
    <ContextMenuCloseContext.Provider value={onClose}>
      {target.type === "single-vertex" && (
        <SingleVertexMenu vertexId={target.vertexId} />
      )}
      {target.type === "single-edge" && (
        <SingleEdgeMenu edgeId={target.edgeId} />
      )}
      {target.type === "multiple-vertices" && (
        <MultipleEntitiesMenu vertexIds={target.vertexIds} edgeIds={[]} />
      )}
      {target.type === "multiple-edges" && (
        <MultipleEntitiesMenu edgeIds={target.edgeIds} vertexIds={[]} />
      )}
      {target.type === "multiple-vertices-and-edges" && (
        <MultipleEntitiesMenu
          vertexIds={target.vertexIds}
          edgeIds={target.edgeIds}
        />
      )}
      {target.type === "none" && <NoTargetMenu />}
    </ContextMenuCloseContext.Provider>
  );
}

function SingleVertexMenu({ vertexId }: { vertexId: VertexId }) {
  const t = useTranslations();
  const vertex = useDisplayVertex(vertexId);
  const setUserLayout = useSetAtom(userLayoutAtom);
  const { replaceGraphSelection } = useGraphSelection();
  const { refresh: refreshEntities } = useRefreshEntities();
  const removeFromGraph = useRemoveFromGraph();
  const openNodeStyleDialog = useOpenNodeStyleDialog();
  const { onCenterVertex, onFitVertexToCanvas } = useGraphGlobalActions();
  const { expandNode } = useExpandNode();
  const defaultNeighborExpansionLimit = useDefaultNeighborExpansionLimit();

  const handleCenter = () => onCenterVertex(vertexId);
  const handleFit = () => onFitVertexToCanvas(vertexId);
  const handleExpand = () =>
    expandNode({
      vertexId,
      limit: defaultNeighborExpansionLimit ?? undefined,
    });

  const openSidebarPanel = (panelName: SidebarItems) => () => {
    setUserLayout(prev => ({ ...prev, activeSidebarItem: panelName }));
    replaceGraphSelection({ vertices: [vertexId], disableSideEffects: true });
  };

  const handleRefresh = () =>
    refreshEntities({ vertexIds: [vertexId], edgeIds: [] });

  const handleRemove = () =>
    removeFromGraph({ vertices: [vertexId], edges: [] });

  const handleOpenStyle = () => openNodeStyleDialog(vertex.primaryType);

  return (
    <ContextMenuContent>
      <ContextMenuTitle>
        <GraphIcon />
        {vertex.displayName}
      </ContextMenuTitle>
      <Divider />
      <ContextMenuItem onClick={handleExpand}>
        <ExpandGraphIcon />
        Expand {t("node").toLowerCase()}
      </ContextMenuItem>
      <ContextMenuItem onClick={handleRefresh}>
        <RefreshCwIcon />
        Refresh {t("node").toLowerCase()}
      </ContextMenuItem>
      <Divider />
      <ContextMenuItem onClick={handleFit}>
        <FullscreenIcon />
        Fit {t("node").toLowerCase()} to frame
      </ContextMenuItem>
      <ContextMenuItem onClick={handleCenter}>
        <CenterGraphIcon />
        Center {t("node").toLowerCase()}
      </ContextMenuItem>
      <Divider />
      <ContextMenuItem onClick={openSidebarPanel("details")}>
        <DetailsIcon />
        Show details panel
      </ContextMenuItem>
      <ContextMenuItem onClick={openSidebarPanel("expand")}>
        <ExpandGraphIcon />
        Show expand panel
      </ContextMenuItem>
      <ContextMenuItem onClick={handleOpenStyle}>
        <StylingIcon />
        Customize {t("node").toLowerCase()} style
      </ContextMenuItem>
      <Divider />
      <ContextMenuItem onClick={handleRemove}>
        <MinusCircleIcon color="red" />
        Remove {t("node").toLowerCase()} from view
      </ContextMenuItem>
    </ContextMenuContent>
  );
}

function SingleEdgeMenu({ edgeId }: { edgeId: EdgeId }) {
  const t = useTranslations();
  const edge = useDisplayEdgeInCanvas(edgeId);
  const setUserLayout = useSetAtom(userLayoutAtom);
  const { replaceGraphSelection } = useGraphSelection();
  const { refresh: refreshEntities } = useRefreshEntities();
  const removeFromGraph = useRemoveFromGraph();
  const openEdgeStyleDialog = useOpenEdgeStyleDialog();
  const { onCenterEdge, onFitEdgeToCanvas } = useGraphGlobalActions();

  const handleCenter = () => onCenterEdge(edgeId);
  const handleFit = () => onFitEdgeToCanvas(edgeId);

  const openSidebarPanel = (panelName: SidebarItems) => () => {
    setUserLayout(prev => ({ ...prev, activeSidebarItem: panelName }));
    replaceGraphSelection({ edges: [edgeId], disableSideEffects: true });
  };

  const handleRefresh = () =>
    refreshEntities({ vertexIds: [], edgeIds: [edgeId] });

  const handleRemove = () => removeFromGraph({ vertices: [], edges: [edgeId] });

  const handleOpenStyle = () => openEdgeStyleDialog(edge.type);

  return (
    <ContextMenuContent>
      <ContextMenuTitle>
        <EdgeIcon />
        {edge.displayTypes}
      </ContextMenuTitle>
      <Divider />
      <ContextMenuItem onClick={handleRefresh}>
        <RefreshCwIcon />
        Refresh {t("edge").toLowerCase()}
      </ContextMenuItem>
      <Divider />
      <ContextMenuItem onClick={handleFit}>
        <FullscreenIcon />
        Fit {t("edge").toLowerCase()} to frame
      </ContextMenuItem>
      <ContextMenuItem onClick={handleCenter}>
        <CenterGraphIcon />
        Center {t("edge").toLowerCase()}
      </ContextMenuItem>
      <Divider />
      <ContextMenuItem onClick={openSidebarPanel("details")}>
        <DetailsIcon />
        Show details panel
      </ContextMenuItem>
      <ContextMenuItem onClick={handleOpenStyle}>
        <StylingIcon />
        Customize {t("edge").toLowerCase()} style
      </ContextMenuItem>
      <Divider />
      <ContextMenuItem onClick={handleRemove}>
        <MinusCircleIcon color="red" />
        Remove {t("edge").toLowerCase()} from view
      </ContextMenuItem>
    </ContextMenuContent>
  );
}

function MultipleEntitiesMenu({
  vertexIds,
  edgeIds,
}: {
  vertexIds: VertexId[];
  edgeIds: EdgeId[];
}) {
  const defaultNeighborExpansionLimit = useDefaultNeighborExpansionLimit();
  const { expandNodes } = useExpandNode();
  const { onFitSelectionToCanvas, onCenterGraph } = useGraphGlobalActions();
  const removeFromGraph = useRemoveFromGraph();

  const handleExpand = () =>
    expandNodes({
      vertexIds,
      limit: defaultNeighborExpansionLimit ?? undefined,
    });

  const handleRemove = () => {
    removeFromGraph({ vertices: vertexIds, edges: edgeIds });
  };

  const hasSelectedVertices = vertexIds.length > 0;

  return (
    <ContextMenuContent>
      <ContextMenuTitle>
        <GraphIcon />
        {vertexIds.length + edgeIds.length} items selected
      </ContextMenuTitle>
      <Divider />
      {hasSelectedVertices ? (
        <>
          <ContextMenuItem onClick={handleExpand}>
            <ExpandGraphIcon />
            Expand selection
          </ContextMenuItem>
          <Divider />
        </>
      ) : null}
      <ContextMenuItem onClick={onFitSelectionToCanvas}>
        <FullscreenIcon />
        Fit selection to frame
      </ContextMenuItem>
      <ContextMenuItem onClick={onCenterGraph}>
        <CenterGraphIcon />
        Center selection
      </ContextMenuItem>
      <Divider />
      <ContextMenuItem onClick={handleRemove}>
        <MinusCircleIcon color="red" />
        Remove selection from view
      </ContextMenuItem>
    </ContextMenuContent>
  );
}

function NoTargetMenu() {
  const {
    onFitAllToCanvas,
    onCenterGraph,
    onSaveScreenshot,
    onZoomIn,
    onZoomOut,
  } = useGraphGlobalActions();
  const clearGraph = useClearGraph();

  return (
    <ContextMenuContent>
      <ContextMenuItem onClick={onFitAllToCanvas}>
        <FullscreenIcon />
        Fit to frame
      </ContextMenuItem>
      <ContextMenuItem onClick={onCenterGraph}>
        <CenterGraphIcon />
        Center
      </ContextMenuItem>
      <ContextMenuItem onClick={onSaveScreenshot}>
        <ImageDownIcon />
        Download screenshot
      </ContextMenuItem>
      <Divider />
      <ContextMenuItem onClick={onZoomIn}>
        <ZoomInIcon />
        Zoom in
      </ContextMenuItem>
      <ContextMenuItem onClick={onZoomOut}>
        <ZoomOutIcon />
        Zoom out
      </ContextMenuItem>
      <Divider />
      <ContextMenuItem onClick={clearGraph}>
        <CircleSlash2 color="red" />
        Clear canvas
      </ContextMenuItem>
    </ContextMenuContent>
  );
}

const ContextMenuCloseContext = createContext<(() => void) | undefined>(
  undefined,
);

function useContextMenuClose() {
  const value = use(ContextMenuCloseContext);
  if (!value) {
    throw new Error(
      "useContextMenuClose must be used within a ContextMenu component",
    );
  }
  return value;
}

function ContextMenuContent({ children }: PropsWithChildren) {
  return (
    <div className="bg-background-default rounded-lg p-1 shadow-lg">
      {children}
    </div>
  );
}

function ContextMenuItem({
  className,
  onClick,
  ...props
}: ComponentPropsWithRef<"button"> & {
  onClick: MouseEventHandler<HTMLDivElement>;
}) {
  const onClose = useContextMenuClose();
  const handleClick: MouseEventHandler<HTMLButtonElement> = e => {
    onClick?.(e);
    onClose();
  };

  return (
    <button
      className={cn(
        "text-text-primary [&_svg]:text-primary-dark hover:bg-background-secondary line-clamp-1 flex w-full flex-row items-center gap-3 rounded-sm px-3 py-2 hover:cursor-pointer [&_svg]:size-5",
        className,
      )}
      onClick={handleClick}
      {...props}
    />
  );
}

function ContextMenuTitle({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "text-text-primary [&_svg]:text-primary-dark line-clamp-1 flex flex-row items-center gap-3 rounded-sm px-3 py-2 font-bold [&_svg]:size-5",
        className,
      )}
      {...props}
    />
  );
}
