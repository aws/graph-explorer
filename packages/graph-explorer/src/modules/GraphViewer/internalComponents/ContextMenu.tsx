import { PropsWithChildren, RefObject, useCallback } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  Divider,
  EdgeIcon,
  GraphIcon,
  ListItem,
  StylingIcon,
} from "@/components";
import { GraphRef } from "@/components/Graph/Graph";
import {
  CenterGraphIcon,
  DetailsIcon,
  ExpandGraphIcon,
  FitToFrameIcon,
} from "@/components/icons";
import {
  useDisplayEdgesInCanvas,
  useDisplayVerticesInCanvas,
  EdgeId,
  VertexId,
} from "@/core";
import { edgesSelectedIdsAtom } from "@/core/StateProvider/edges";
import { nodesSelectedIdsAtom } from "@/core/StateProvider/nodes";
import {
  SidebarItems,
  userLayoutAtom,
} from "@/core/StateProvider/userPreferences";
import { useClearGraph, useRemoveFromGraph, useTranslations } from "@/hooks";
import useGraphGlobalActions from "../useGraphGlobalActions";
import {
  CircleSlash2,
  ImageDownIcon,
  MinusCircleIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { customizeNodeTypeAtom } from "@/modules/NodesStyling";
import { customizeEdgeTypeAtom } from "@/modules/EdgesStyling";

export type ContextMenuProps = {
  affectedNodesIds?: VertexId[];
  affectedEdgesIds?: EdgeId[];
  graphRef: RefObject<GraphRef | null>;
  onClose?(): void;
};

const ContextMenu = ({
  affectedNodesIds,
  affectedEdgesIds,
  graphRef,
  onClose,
}: ContextMenuProps) => {
  const t = useTranslations();
  const displayNodes = useDisplayVerticesInCanvas();
  const displayEdges = useDisplayEdgesInCanvas();
  const [nodesSelectedIds, setNodesSelectedIds] =
    useRecoilState(nodesSelectedIdsAtom);
  const [edgesSelectedIds, setEdgesSelectedIds] =
    useRecoilState(edgesSelectedIdsAtom);
  const setUserLayout = useSetRecoilState(userLayoutAtom);

  const {
    onFitToCanvas,
    onCenterGraph,
    onCenterSelectedGraph,
    onSaveScreenshot,
    onZoomIn,
    onZoomOut,
  } = useGraphGlobalActions(graphRef);

  const nonEmptySelection =
    nodesSelectedIds.size >= 1 || edgesSelectedIds.size >= 1;

  const setCustomizeNodeType = useSetRecoilState(customizeNodeTypeAtom);
  const setCustomizeEdgeType = useSetRecoilState(customizeEdgeTypeAtom);

  const openSidebarPanel = useCallback(
    (
      panelName: SidebarItems,
      props?: { nodeType?: string; edgeType?: string }
    ) =>
      () => {
        setUserLayout(prev => ({
          ...prev,
          activeSidebarItem: panelName,
        }));
        if (affectedNodesIds?.length) {
          setEdgesSelectedIds(prev => (prev.size === 0 ? prev : new Set([])));
          setNodesSelectedIds(new Set(affectedNodesIds ?? []));
        }
        if (affectedEdgesIds?.length) {
          setEdgesSelectedIds(new Set(affectedEdgesIds ?? []));
          setNodesSelectedIds(prev => (prev.size === 0 ? prev : new Set([])));
        }

        props?.nodeType && setCustomizeNodeType(props.nodeType);
        props?.edgeType && setCustomizeEdgeType(props.edgeType);

        onClose?.();
      },
    [
      setUserLayout,
      affectedNodesIds,
      affectedEdgesIds,
      setCustomizeNodeType,
      setCustomizeEdgeType,
      onClose,
      setEdgesSelectedIds,
      setNodesSelectedIds,
    ]
  );

  const handleFitToFrame = useCallback(() => {
    onFitToCanvas();
    onClose?.();
  }, [onClose, onFitToCanvas]);

  const handleCenter = useCallback(() => {
    if (nonEmptySelection) {
      onCenterSelectedGraph();
    } else {
      onCenterGraph();
    }
    onClose?.();
  }, [nonEmptySelection, onCenterGraph, onCenterSelectedGraph, onClose]);

  const handleDownloadScreenshot = useCallback(() => {
    onSaveScreenshot();
    onClose?.();
  }, [onClose, onSaveScreenshot]);

  const handleZoomIn = useCallback(() => {
    onZoomIn();
    onClose?.();
  }, [onClose, onZoomIn]);

  const handleZoomOut = useCallback(() => {
    onZoomOut();
    onClose?.();
  }, [onClose, onZoomOut]);

  const removeFromGraph = useRemoveFromGraph();
  const handleRemoveFromCanvas = useCallback(
    (nodesIds: VertexId[], edgesIds: EdgeId[]) => () => {
      removeFromGraph({ vertices: nodesIds, edges: edgesIds });
      onClose?.();
    },
    [onClose, removeFromGraph]
  );

  const clearGraph = useClearGraph();
  const handleRemoveAllFromCanvas = useCallback(() => {
    clearGraph();
    onClose?.();
  }, [onClose, clearGraph]);

  const noSelectionOrNotAffected =
    affectedNodesIds?.length === 0 &&
    nodesSelectedIds.size === 0 &&
    affectedEdgesIds?.length === 0 &&
    edgesSelectedIds.size === 0;

  const selectedButNoAffected =
    affectedNodesIds?.length === 0 &&
    affectedEdgesIds?.length === 0 &&
    nodesSelectedIds.size + edgesSelectedIds.size > 0;

  const affectedNode =
    affectedNodesIds?.length === 1
      ? displayNodes.get(affectedNodesIds[0])
      : undefined;
  const affectedEdge =
    affectedEdgesIds?.length === 1
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
        <ListItem onClick={openSidebarPanel("details")}>
          <DetailsIcon />
          Details panel
        </ListItem>
        <ListItem onClick={openSidebarPanel("expand")}>
          <ExpandGraphIcon />
          Expand panel
        </ListItem>
        <ListItem
          onClick={openSidebarPanel("nodes-styling", {
            nodeType: affectedNode.typeConfig.type,
          })}
        >
          <StylingIcon />
          Customize panel
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
        <ListItem onClick={openSidebarPanel("details")}>
          <DetailsIcon />
          Details Panel
        </ListItem>
        <ListItem
          onClick={openSidebarPanel("edges-styling", {
            edgeType: affectedEdge.typeConfig.type,
          })}
        >
          <StylingIcon />
          Customize Panel
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
              Array.from(nodesSelectedIds),
              Array.from(edgesSelectedIds)
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
