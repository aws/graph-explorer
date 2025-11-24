import type { PropsWithChildren } from "react";
import {
  Divider,
  EdgeIcon,
  GraphIcon,
  ListItem,
  StylingIcon,
} from "@/components";
import {
  CenterGraphIcon,
  DetailsIcon,
  ExpandGraphIcon,
  FitToFrameIcon,
} from "@/components/icons";
import {
  useDisplayEdgesInCanvas,
  useDisplayVerticesInCanvas,
  type EdgeId,
  type VertexId,
  userLayoutAtom,
  type SidebarItems,
} from "@/core";
import {
  useClearGraph,
  useRefreshEntities,
  useRemoveFromGraph,
  useTranslations,
} from "@/hooks";
import useGraphGlobalActions from "../useGraphGlobalActions";
import {
  CircleSlash2,
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

export type ContextMenuProps = {
  affectedNodesIds: VertexId[];
  affectedEdgesIds: EdgeId[];
  onClose?(): void;
};

const ContextMenu = ({
  affectedNodesIds,
  affectedEdgesIds,
  onClose,
}: ContextMenuProps) => {
  const t = useTranslations();
  const displayNodes = useDisplayVerticesInCanvas();
  const displayEdges = useDisplayEdgesInCanvas();
  const { graphSelection, replaceGraphSelection } = useGraphSelection();
  const setUserLayout = useSetAtom(userLayoutAtom);
  const refreshEntities = useRefreshEntities({
    vertexIds: affectedNodesIds,
    edgeIds: affectedEdgesIds,
  });

  const {
    onFitToCanvas,
    onCenterGraph,
    onCenterSelectedGraph,
    onSaveScreenshot,
    onZoomIn,
    onZoomOut,
  } = useGraphGlobalActions();

  const nonEmptySelection =
    graphSelection.vertices.length || graphSelection.edges.length;

  const openNodeStyleDialog = useOpenNodeStyleDialog();
  const openEdgeStyleDialog = useOpenEdgeStyleDialog();

  const openSidebarPanel = (panelName: SidebarItems) => () => {
    setUserLayout(prev => {
      return {
        ...prev,
        activeSidebarItem: panelName,
      };
    });
    if (affectedNodesIds.length) {
      replaceGraphSelection({
        vertices: affectedNodesIds,
        disableSideEffects: true,
      });
    } else if (affectedEdgesIds.length) {
      replaceGraphSelection({
        edges: affectedEdgesIds,
        disableSideEffects: true,
      });
    }

    onClose?.();
  };

  const openNodeStyle = (nodeType: string) => () => {
    openNodeStyleDialog(nodeType);
    onClose?.();
  };

  const openEdgeStyle = (edgeType: string) => () => {
    openEdgeStyleDialog(edgeType);
    onClose?.();
  };

  const handleFitToFrame = () => {
    onFitToCanvas();
    onClose?.();
  };

  const handleCenter = () => {
    if (nonEmptySelection) {
      onCenterSelectedGraph();
    } else {
      onCenterGraph();
    }
    onClose?.();
  };

  const handleDownloadScreenshot = () => {
    onSaveScreenshot();
    onClose?.();
  };

  const handleZoomIn = () => {
    onZoomIn();
    onClose?.();
  };

  const handleZoomOut = () => {
    onZoomOut();
    onClose?.();
  };

  const removeFromGraph = useRemoveFromGraph();
  const handleRemoveFromCanvas =
    (nodesIds: VertexId[], edgesIds: EdgeId[]) => () => {
      removeFromGraph({ vertices: nodesIds, edges: edgesIds });
      onClose?.();
    };

  const clearGraph = useClearGraph();
  const handleRemoveAllFromCanvas = () => {
    clearGraph();
    onClose?.();
  };

  const onRefresh = () => {
    refreshEntities.refresh();
    onClose?.();
  };

  const noSelectionOrNotAffected =
    affectedNodesIds.length === 0 &&
    graphSelection.vertices.length === 0 &&
    affectedEdgesIds.length === 0 &&
    graphSelection.edges.length === 0;

  const selectedButNoAffected =
    affectedNodesIds.length === 0 &&
    affectedEdgesIds.length === 0 &&
    graphSelection.vertices.length + graphSelection.edges.length > 0;

  const affectedNode =
    affectedNodesIds.length === 1
      ? displayNodes.get(affectedNodesIds[0])
      : undefined;
  const affectedEdge =
    affectedEdgesIds.length === 1
      ? displayEdges.get(affectedEdgesIds[0])
      : undefined;

  if (affectedNode) {
    return (
      <Layout>
        <ListItem className="font-bold">
          <GraphIcon />
          {affectedNode.displayName}
        </ListItem>
        <Divider />
        <ListItem onClick={onRefresh}>
          <RefreshCwIcon />
          Refresh {t("graph-viewer.node").toLowerCase()}
        </ListItem>
        <ListItem onClick={openSidebarPanel("details")}>
          <DetailsIcon />
          Details panel
        </ListItem>
        <ListItem onClick={openSidebarPanel("expand")}>
          <ExpandGraphIcon />
          Expand panel
        </ListItem>
        <ListItem onClick={openNodeStyle(affectedNode.primaryType)}>
          <StylingIcon />
          Customize {t("graph-viewer.node").toLowerCase()} style
        </ListItem>
        <Divider />
        <ListItem onClick={handleRemoveFromCanvas([affectedNode.id], [])}>
          <MinusCircleIcon color="red" />
          Remove {t("graph-viewer.node").toLowerCase()} from view
        </ListItem>
      </Layout>
    );
  }

  if (affectedEdge) {
    return (
      <Layout>
        <ListItem className="font-bold">
          <EdgeIcon />
          {affectedEdge.displayTypes}
        </ListItem>
        <Divider />
        <ListItem onClick={onRefresh}>
          <RefreshCwIcon />
          Refresh {t("graph-viewer.edge").toLowerCase()}
        </ListItem>
        <ListItem onClick={openSidebarPanel("details")}>
          <DetailsIcon />
          Details Panel
        </ListItem>
        <ListItem onClick={openEdgeStyle(affectedEdge.type)}>
          <StylingIcon />
          Customize {t("graph-viewer.edge").toLocaleLowerCase()} style
        </ListItem>
        <Divider />
        <ListItem onClick={handleRemoveFromCanvas([], [affectedEdge.id])}>
          <MinusCircleIcon color="red" />
          Remove {t("graph-viewer.edge")} from canvas
        </ListItem>
      </Layout>
    );
  }

  return (
    <Layout>
      <ListItem onClick={handleFitToFrame}>
        <FitToFrameIcon />
        {nonEmptySelection ? "Fit Selection to Frame" : "Fit to Frame"}
      </ListItem>
      <ListItem onClick={handleCenter}>
        <CenterGraphIcon />
        {nonEmptySelection ? "Center Selection" : "Center"}
      </ListItem>
      <ListItem onClick={handleDownloadScreenshot}>
        <ImageDownIcon />
        Download Screenshot
      </ListItem>
      <Divider />
      <ListItem onClick={handleZoomIn}>
        <ZoomInIcon />
        Zoom in
      </ListItem>
      <ListItem onClick={handleZoomOut}>
        <ZoomOutIcon />
        Zoom out
      </ListItem>
      {selectedButNoAffected && (
        <>
          <Divider />
          <ListItem
            onClick={handleRemoveFromCanvas(
              graphSelection.vertices,
              graphSelection.edges,
            )}
          >
            <CircleSlash2 color="red" />
            Remove selection from canvas
          </ListItem>
        </>
      )}
      {noSelectionOrNotAffected && (
        <>
          <Divider />
          <ListItem onClick={handleRemoveAllFromCanvas}>
            <CircleSlash2 color="red" />
            Clear canvas
          </ListItem>
        </>
      )}
    </Layout>
  );
};

function Layout({ children }: PropsWithChildren) {
  return (
    <div className="bg-background-default rounded-lg p-1 shadow-lg">
      {children}
    </div>
  );
}

export default ContextMenu;
