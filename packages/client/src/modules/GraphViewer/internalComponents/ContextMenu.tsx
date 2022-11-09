import { cx } from "@emotion/css";
import { RefObject, useCallback } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { Card, ListItem } from "../../../components";
import { GraphRef } from "../../../components/Graph/Graph";
import {
  CenterGraphIcon,
  DetailsIcon,
  ExpandGraphIcon,
  FitToFrameIcon,
  RemoveFromCanvasIcon,
  ScreenshotIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "../../../components/icons";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import { edgesSelectedIdsAtom } from "../../../core/StateProvider/edges";
import { nodesSelectedIdsAtom } from "../../../core/StateProvider/nodes";
import { userLayoutAtom } from "../../../core/StateProvider/userPreferences";
import useEntities from "../../../hooks/useEntities";
import useGraphGlobalActions from "../useGraphGlobalActions";
import defaultStyles from "./ContextMenu.styles";

export type ContextMenuProps = {
  classNamePrefix?: string;
  className?: string;
  affectedNodesIds?: string[];
  graphRef: RefObject<GraphRef | null>;
  onClose?(): void;
};

const ContextMenu = ({
  classNamePrefix = "ft",
  className,
  affectedNodesIds,
  graphRef,
  onClose,
}: ContextMenuProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);
  const [entities, setEntitites] = useEntities();
  const [nodesSelectedIds, setNodesSelectedIds] = useRecoilState(
    nodesSelectedIdsAtom
  );
  const [edgesSelectedIds, setEdgesSelectedIds] = useRecoilState(
    edgesSelectedIdsAtom
  );
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
    nodesSelectedIds.size > 1 || edgesSelectedIds.size > 1;

  const openSidebarPanel = useCallback(
    (panelName: string) => () => {
      setUserLayout(prev => ({
        ...prev,
        activeSidebarItem: panelName,
      }));
      setEdgesSelectedIds(prev => (prev.size === 0 ? prev : new Set([])));
      setNodesSelectedIds(new Set(affectedNodesIds ?? []));
      onClose?.();
    },
    [
      affectedNodesIds,
      onClose,
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
    (vertexIds: string[]) => () => {
      setEntitites(prev => ({
        nodes: prev.nodes.filter(n => !vertexIds.includes(n.data.id)),
        edges: prev.edges,
        forceSet: true,
      }));
      onClose?.();
    },
    [onClose, setEntitites]
  );

  return (
    <div
      className={cx(
        styleWithTheme(defaultStyles(classNamePrefix)),
        pfx("context-menu"),
        className
      )}
    >
      <Card className={pfx("card-root")}>
        {affectedNodesIds?.length === 1 && (
          <>
            <ListItem
              classNamePrefix={"ft"}
              className={pfx("list-item")}
              clickable={true}
              onClick={openSidebarPanel("details")}
              startAdornment={<DetailsIcon />}
            >
              Details
            </ListItem>
            <ListItem
              classNamePrefix={"ft"}
              className={pfx("list-item")}
              clickable={true}
              onClick={openSidebarPanel("expand")}
              startAdornment={<ExpandGraphIcon />}
            >
              Expand
            </ListItem>
            <div className={pfx("divider")} />
          </>
        )}
        <ListItem
          classNamePrefix={"ft"}
          className={pfx("list-item")}
          clickable={true}
          onClick={handleFitToFrame}
          startAdornment={<FitToFrameIcon />}
        >
          {nonEmptySelection ? "Fit Selection to Frame" : "Fit to Frame"}
        </ListItem>
        <ListItem
          classNamePrefix={"ft"}
          className={pfx("list-item")}
          clickable={true}
          onClick={handleCenter}
          startAdornment={<CenterGraphIcon />}
        >
          {nonEmptySelection ? "Center Selection" : "Center"}
        </ListItem>
        <ListItem
          classNamePrefix={"ft"}
          className={pfx("list-item")}
          clickable={true}
          onClick={handleDownloadScreenshot}
          startAdornment={<ScreenshotIcon />}
        >
          Download Screenshot
        </ListItem>
        <div className={pfx("divider")} />
        <ListItem
          classNamePrefix={"ft"}
          className={pfx("list-item")}
          clickable={true}
          onClick={handleZoomIn}
          startAdornment={<ZoomInIcon />}
        >
          Zoom in
        </ListItem>
        <ListItem
          classNamePrefix={"ft"}
          className={pfx("list-item")}
          clickable={true}
          onClick={handleZoomOut}
          startAdornment={<ZoomOutIcon />}
        >
          Zoom out
        </ListItem>
        {!!affectedNodesIds?.length && (
          <>
            <div className={pfx("divider")} />
            <ListItem
              classNamePrefix={"ft"}
              className={pfx("list-item")}
              clickable={true}
              onClick={handleRemoveFromCanvas(affectedNodesIds)}
              startAdornment={<RemoveFromCanvasIcon color={"red"} />}
            >
              Remove from canvas
            </ListItem>
          </>
        )}
        {nodesSelectedIds.size > 0 && (
          <>
            <div className={pfx("divider")} />
            <ListItem
              classNamePrefix={"ft"}
              className={pfx("list-item")}
              clickable={true}
              onClick={handleRemoveFromCanvas(Array.from(nodesSelectedIds))}
              startAdornment={<RemoveFromCanvasIcon color={"red"} />}
            >
              Remove selection from canvas
            </ListItem>
          </>
        )}
        {affectedNodesIds?.length === 0 && nodesSelectedIds.size === 0 && (
          <>
            <div className={pfx("divider")} />
            <ListItem
              classNamePrefix={"ft"}
              className={pfx("list-item")}
              clickable={true}
              onClick={handleRemoveFromCanvas(
                entities.nodes.map(n => n.data.id)
              )}
              startAdornment={<RemoveFromCanvasIcon color={"red"} />}
            >
              Clear canvas
            </ListItem>
          </>
        )}
      </Card>
    </div>
  );
};

export default ContextMenu;
