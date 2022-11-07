import { cx } from "@emotion/css";
import { useCallback, useRef, useState } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { VertexData } from "../../@types/entities";
import type { ModuleContainerHeaderProps } from "../../components";
import {
  LoadingSpinner,
  ModuleContainer,
  ModuleContainerHeader,
  ResetIcon,
} from "../../components";
import Card from "../../components/Card";
import Graph from "../../components/Graph";
import { GraphRef } from "../../components/Graph/Graph";
import { ElementEventCallback } from "../../components/Graph/hooks/useAddClickEvents";
import IconButton from "../../components/IconButton";
import CloseIcon from "../../components/icons/CloseIcon";
import InfoIcon from "../../components/icons/InfoIcon";
import ScreenshotIcon from "../../components/icons/ScreenshotIcon";
import ListItem from "../../components/ListItem";
import { useNotification } from "../../components/NotificationProvider";
import RemoteSvgIcon from "../../components/RemoteSvgIcon";
import Select from "../../components/Select";
import useConfiguration from "../../core/ConfigurationProvider/useConfiguration";
import {
  edgesHiddenIdsAtom,
  edgesOutOfFocusIdsAtom,
  edgesSelectedIdsAtom,
} from "../../core/StateProvider/edges";
import {
  nodesHiddenIdsAtom,
  nodesOutOfFocusIdsAtom,
  nodesSelectedIdsAtom,
} from "../../core/StateProvider/nodes";
import { userLayoutAtom } from "../../core/StateProvider/userPreferences";
import useWithTheme from "../../core/ThemeProvider/useWithTheme";
import fade from "../../core/ThemeProvider/utils/fade";
import withClassNamePrefix from "../../core/ThemeProvider/utils/withClassNamePrefix";
import { useEntities, useExpandNode } from "../../hooks";
import useDisplayNames from "../../hooks/useDisplayNames";
import defaultStyles from "./GraphViewerModule.styles";
import ContextMenu from "./internalComponents/ContextMenu";
import useContextMenu from "./useContextMenu";
import useGraphGlobalActions from "./useGraphGlobalActions";
import useGraphStyles from "./useGraphStyles";
import useGraphViewerInit from "./useGraphViewerInit";
import useNodeBadges from "./useNodeBadges";
import useNodeDrop from "./useNodeDrop";

export type GraphViewerProps = Omit<
  ModuleContainerHeaderProps,
  "title" | "sidebar"
> & {
  title?: ModuleContainerHeaderProps["title"];
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

const GraphViewer = ({
  title = "Graph View",
  ...headerProps
}: GraphViewerProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix("ft");

  useGraphViewerInit();
  const graphRef = useRef<GraphRef | null>(null);
  const [entities] = useEntities();
  const { dropAreaRef, isOver, canDrop } = useNodeDrop();

  const [nodesSelectedIds, setNodesSelectedIds] = useRecoilState(
    nodesSelectedIdsAtom
  );
  const hiddenNodesIds = useRecoilValue(nodesHiddenIdsAtom);

  const [edgesSelectedIds, setEdgesSelectedIds] = useRecoilState(
    edgesSelectedIdsAtom
  );
  const hiddenEdgesIds = useRecoilValue(edgesHiddenIdsAtom);
  const nodesOutIds = useRecoilValue(nodesOutOfFocusIdsAtom);
  const edgesOutIds = useRecoilValue(edgesOutOfFocusIdsAtom);
  const setUserLayout = useSetRecoilState(userLayoutAtom);

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

  const config = useConfiguration();
  const [legendOpen, setLegendOpen] = useState(false);
  const { onSaveScreenshot } = useGraphGlobalActions(graphRef);

  const {
    clearAllLayers,
    contextLayerProps,
    contextNodeId,
    isContextOpen,
    onGraphRightClick,
    onNodeRightClick,
    parentRef,
    renderContextLayer,
  } = useContextMenu();

  const styles = useGraphStyles();
  const getNodeBadges = useNodeBadges();

  const { enqueueNotification, clearNotification } = useNotification();
  const expandNode = useExpandNode();
  const [expandVertexName, setExpandVertexName] = useState<string | null>(null);
  const getDisplayNames = useDisplayNames();
  const onNodeDoubleClick: ElementEventCallback<VertexData> = useCallback(
    async (_, vertexData) => {
      if (vertexData.__unfetchedNeighborCount === 0) {
        enqueueNotification({
          title: "No more neighbors",
          message:
            "This vertex has been fully expanded or it does not have connections",
        });
        return;
      }

      if (vertexData.__unfetchedNeighborCount > 20) {
        setUserLayout(prev => ({
          ...prev,
          activeSidebarItem: "expand",
        }));
        return;
      }

      const { name } = getDisplayNames({ data: vertexData });
      setExpandVertexName(name);
      const notificationId = enqueueNotification({
        title: "Expanding neighbors",
        message: `Expanding all neighbors for ${name}`,
      });
      await expandNode({
        vertexId: vertexData.id,
        limit: vertexData.__totalNeighborCount,
        offset: 0,
      });
      clearNotification(notificationId);
      setExpandVertexName(null);
    },
    [
      getDisplayNames,
      clearNotification,
      enqueueNotification,
      expandNode,
      setUserLayout,
    ]
  );

  const [layout, setLayout] = useState("F_COSE");

  return (
    <div
      ref={dropAreaRef}
      className={cx(
        styleWithTheme(defaultStyles("ft")),
        pfx("graph-viewer-module")
      )}
    >
      <ModuleContainer>
        <ModuleContainerHeader
          title={
            <div
              style={{ display: "flex", width: "100%", alignItems: "center" }}
            >
              <div style={{ whiteSpace: "nowrap" }}>{title}</div>
              <Select
                className={pfx("entity-select")}
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
          actions={[
            {
              value: "download_screenshot",
              label: "Download Screenshot",
              icon: <ScreenshotIcon />,
            },
            {
              value: "legend",
              label: "Legend",
              icon: <InfoIcon />,
            },
          ]}
          onActionClick={action => {
            switch (action) {
              case "download_screenshot":
                return onSaveScreenshot();
              case "legend":
                return setLegendOpen(open => !open);
            }
          }}
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
            nodes={entities.nodes}
            edges={entities.edges}
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
            onNodeRightClick={onNodeRightClick}
            onNodeDoubleClick={onNodeDoubleClick}
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
                />
              </div>
            )}
          {legendOpen && (
            <Card className={pfx("legend-container")}>
              <ListItem
                className={cx(pfx("legend-item"), pfx("legend-title"))}
                endAdornment={
                  <IconButton
                    icon={<CloseIcon />}
                    onPress={() => setLegendOpen(false)}
                    variant={"text"}
                    size={"small"}
                  />
                }
              >
                Legend
              </ListItem>
              {config?.vertexTypes.map(vertexType => {
                const vtConfig = config?.getVertexTypeConfig(vertexType);
                return (
                  <ListItem
                    key={vertexType}
                    className={pfx("legend-item")}
                    startAdornment={
                      vtConfig?.iconUrl && (
                        <div
                          className={pfx("icon")}
                          style={{
                            background: fade(vtConfig?.color, 0.2),
                            color: vtConfig?.color,
                          }}
                        >
                          <RemoteSvgIcon src={vtConfig.iconUrl} />
                        </div>
                      )
                    }
                  >
                    {vtConfig?.displayLabel}
                  </ListItem>
                );
              })}
            </Card>
          )}
        </div>
      </ModuleContainer>
      <div
        className={cx(pfx("drop-overlay"), {
          [pfx("drop-overlay-is-over")]: isOver,
          [pfx("drop-overlay-can-drop")]: !isOver && canDrop,
        })}
      />
      <div
        className={cx(pfx("drop-overlay"), pfx("expanding-overlay"), {
          [pfx("visible")]: !!expandVertexName,
        })}
      >
        <div>
          <LoadingSpinner className={pfx("expanding-spinner")} /> Expanding{" "}
          {expandVertexName}
        </div>
      </div>
    </div>
  );
};

export default GraphViewer;
