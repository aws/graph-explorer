import type {
  ComponentPropsWithRef,
  MouseEventHandler,
  PropsWithChildren,
} from "react";
import { createContext, use } from "react";
import { Divider, EdgeIcon, GraphIcon, StylingIcon } from "@/components";
import {
  CenterGraphIcon,
  DetailsIcon,
  ExpandGraphIcon,
} from "@/components/icons";
import {
  type EdgeId,
  type VertexId,
  userLayoutAtom,
  type SidebarItems,
  useDisplayVertex,
  useDisplayEdgeInCanvas,
} from "@/core";
import {
  useClearGraph,
  useRefreshEntities,
  useRemoveFromGraph,
  useTranslations,
  useContextMenuTarget,
} from "@/hooks";
import useGraphGlobalActions from "../useGraphGlobalActions";
import {
  CircleSlash2,
  FullscreenIcon,
  ImageDownIcon,
  MinusCircleIcon,
  RefreshCwIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { useOpenNodeStyleDialog } from "@/modules/NodesStyling";
import { useOpenEdgeStyleDialog } from "@/modules/EdgesStyling";
import { useSetAtom } from "jotai";
import { useGraphSelection } from "../useGraphSelection";
import { cn } from "@/utils";

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
    selectedVertexIds: graphSelection.vertices,
    selectedEdgeIds: graphSelection.edges,
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

  const handleCenter = () => onCenterVertex(vertexId);
  const handleFit = () => onFitVertexToCanvas(vertexId);

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
      <ContextMenuItem onClick={handleFit}>
        <FullscreenIcon />
        Fit {t("graph-viewer.node").toLowerCase()} to frame
      </ContextMenuItem>
      <ContextMenuItem onClick={handleCenter}>
        <CenterGraphIcon />
        Center {t("graph-viewer.node").toLowerCase()}
      </ContextMenuItem>
      <ContextMenuItem onClick={handleRefresh}>
        <RefreshCwIcon />
        Refresh {t("graph-viewer.node").toLowerCase()}
      </ContextMenuItem>
      <Divider />
      <ContextMenuItem onClick={openSidebarPanel("details")}>
        <DetailsIcon />
        Details panel
      </ContextMenuItem>
      <ContextMenuItem onClick={openSidebarPanel("expand")}>
        <ExpandGraphIcon />
        Expand panel
      </ContextMenuItem>
      <ContextMenuItem onClick={handleOpenStyle}>
        <StylingIcon />
        Customize {t("graph-viewer.node").toLowerCase()} style
      </ContextMenuItem>
      <Divider />
      <ContextMenuItem onClick={handleRemove}>
        <MinusCircleIcon color="red" />
        Remove {t("graph-viewer.node").toLowerCase()} from view
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
      <ContextMenuItem onClick={handleFit}>
        <FullscreenIcon />
        Fit {t("graph-viewer.edge").toLowerCase()} to frame
      </ContextMenuItem>
      <ContextMenuItem onClick={handleCenter}>
        <CenterGraphIcon />
        Center {t("graph-viewer.edge").toLowerCase()}
      </ContextMenuItem>
      <ContextMenuItem onClick={handleRefresh}>
        <RefreshCwIcon />
        Refresh {t("graph-viewer.edge").toLowerCase()}
      </ContextMenuItem>
      <Divider />
      <ContextMenuItem onClick={openSidebarPanel("details")}>
        <DetailsIcon />
        Details panel
      </ContextMenuItem>
      <ContextMenuItem onClick={handleOpenStyle}>
        <StylingIcon />
        Customize {t("graph-viewer.edge").toLowerCase()} style
      </ContextMenuItem>
      <Divider />
      <ContextMenuItem onClick={handleRemove}>
        <MinusCircleIcon color="red" />
        Remove {t("graph-viewer.edge").toLowerCase()} from view
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
  const { onFitSelectionToCanvas, onCenterGraph } = useGraphGlobalActions();
  const removeFromGraph = useRemoveFromGraph();

  const handleRemove = () => {
    removeFromGraph({ vertices: vertexIds, edges: edgeIds });
  };

  return (
    <ContextMenuContent>
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
