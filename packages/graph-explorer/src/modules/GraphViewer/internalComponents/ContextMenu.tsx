import { RefObject, useCallback } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  Card,
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
  RemoveFromCanvasIcon,
  ScreenshotIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@/components/icons";
import { useDisplayEdgesInCanvas, useDisplayVerticesInCanvas } from "@/core";
import { edgesSelectedIdsAtom, toEdgeMap } from "@/core/StateProvider/edges";
import { nodesSelectedIdsAtom, toNodeMap } from "@/core/StateProvider/nodes";
import {
  SidebarItems,
  userLayoutAtom,
} from "@/core/StateProvider/userPreferences";
import { useEntities, useTranslations } from "@/hooks";
import useGraphGlobalActions from "../useGraphGlobalActions";
import { EdgeId, VertexId } from "@/core";
import { MinusCircleIcon } from "lucide-react";

export type ContextMenuProps = {
  affectedNodesIds?: VertexId[];
  affectedEdgesIds?: EdgeId[];
  graphRef: RefObject<GraphRef | null>;
  onClose?(): void;
  onNodeCustomize(nodeType?: string): void;
  onEdgeCustomize(edgeType?: string): void;
};

const ContextMenu = ({
  affectedNodesIds,
  affectedEdgesIds,
  graphRef,
  onClose,
  onNodeCustomize,
  onEdgeCustomize,
}: ContextMenuProps) => {
  const t = useTranslations();
  const [_, setEntities] = useEntities();
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

        props?.nodeType && onNodeCustomize(props.nodeType);
        props?.edgeType && onEdgeCustomize(props.edgeType);

        onClose?.();
      },
    [
      affectedEdgesIds,
      affectedNodesIds,
      onClose,
      onNodeCustomize,
      onEdgeCustomize,
      setEdgesSelectedIds,
      setNodesSelectedIds,
      setUserLayout,
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

  const handleRemoveFromCanvas = useCallback(
    (nodesIds: VertexId[], edgesIds: EdgeId[]) => () => {
      setEntities(prev => {
        // const newNodes = new Map(prev.nodes);
        // nodesIds.forEach(id => newNodes.delete(id));
        return {
          // nodes: newNodes,
          nodes: toNodeMap(
            prev.nodes
              .values()
              .filter(n => !nodesIds.includes(n.id))
              .toArray()
          ),
          edges: toEdgeMap(
            prev.edges
              .values()
              .filter(e => !edgesIds.includes(e.id))
              .toArray()
          ),
          forceSet: true,
        };
      });
      onClose?.();
    },
    [onClose, setEntities]
  );

  const handleRemoveAllFromCanvas = useCallback(() => {
    setEntities({
      nodes: new Map(),
      edges: new Map(),
      forceSet: true,
    });
    onClose?.();
  }, [onClose, setEntities]);

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
      <Card className="p-1">
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
          <MinusCircleIcon className="size-5" color="red" />
          Remove {t("graph-viewer.node").toLowerCase()} from view
        </ListItem>
      </Card>
    );
  }

  if (affectedEdge) {
    return (
      <Card className="p-1">
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
          <RemoveFromCanvasIcon color="red" />
          Remove {t("graph-viewer.edge")} from canvas
        </ListItem>
      </Card>
    );
  }

  return (
    <Card className="p-1">
      <ListItem onClick={handleFitToFrame}>
        <FitToFrameIcon />
        {nonEmptySelection ? "Fit Selection to Frame" : "Fit to Frame"}
      </ListItem>
      <ListItem onClick={handleCenter}>
        <CenterGraphIcon />
        {nonEmptySelection ? "Center Selection" : "Center"}
      </ListItem>
      <ListItem onClick={handleDownloadScreenshot}>
        <ScreenshotIcon />
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
            <RemoveFromCanvasIcon color="red" />
            Remove selection from canvas
          </ListItem>
        </>
      )}
      {noSelectionOrNotAffected && (
        <>
          <Divider />
          <ListItem onClick={handleRemoveAllFromCanvas}>
            <RemoveFromCanvasIcon color="red" />
            Clear canvas
          </ListItem>
        </>
      )}
    </Card>
  );
};

export default ContextMenu;
