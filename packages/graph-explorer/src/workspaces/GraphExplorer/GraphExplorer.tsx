import { cn } from "@/utils";
import debounce from "lodash/debounce";
import { Resizable } from "re-resizable";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  Button,
  EdgeIcon,
  IconButton,
  NamespaceIcon,
  PanelEmptyState,
} from "@/components";
import {
  DatabaseIcon,
  DetailsIcon,
  EmptyWidgetIcon,
  ExpandGraphIcon,
  FilterIcon,
  GraphIcon,
} from "@/components/icons";
import GridIcon from "@/components/icons/GridIcon";
import Workspace from "@/components/Workspace";
import { useConfiguration, useWithTheme } from "@/core";
import { edgesSelectedIdsAtom } from "@/core/StateProvider/edges";
import { nodesSelectedIdsAtom } from "@/core/StateProvider/nodes";
import { totalFilteredCount } from "@/core/StateProvider/filterCount";
import { userLayoutAtom } from "@/core/StateProvider/userPreferences";
import { usePrevious } from "@/hooks";
import useTranslations from "@/hooks/useTranslations";
import EdgesStyling from "@/modules/EdgesStyling/EdgesStyling";
import EntitiesFilter from "@/modules/EntitiesFilter";
import EntitiesTabular from "@/modules/EntitiesTabular/EntitiesTabular";
import EntityDetails from "@/modules/EntityDetails";
import GraphViewer from "@/modules/GraphViewer";
import KeywordSearch from "@/modules/KeywordSearch/KeywordSearch";
import Namespaces from "@/modules/Namespaces/Namespaces";
import NodeExpand from "@/modules/NodeExpand";
import NodesStyling from "@/modules/NodesStyling/NodesStyling";
import defaultStyles from "./GraphExplorer.styles";
import { APP_NAME } from "@/utils/constants";

const RESIZE_ENABLE_TOP = {
  top: true,
  right: false,
  bottom: false,
  left: false,
  topRight: false,
  bottomRight: false,
  bottomLeft: false,
  topLeft: false,
};

const GraphExplorer = () => {
  const styleWithTheme = useWithTheme();
  const config = useConfiguration();
  const t = useTranslations();
  const hasNamespaces = config?.connection?.queryEngine === "sparql";
  const [userLayout, setUserLayout] = useRecoilState(userLayoutAtom);

  const nodesSelectedIds = useRecoilValue(nodesSelectedIdsAtom);
  const edgesSelectedIds = useRecoilValue(edgesSelectedIdsAtom);
  const nodeOrEdgeSelected =
    nodesSelectedIds.size + edgesSelectedIds.size === 1;
  const filteredEntitiesCount = useRecoilValue(totalFilteredCount);

  const closeSidebar = useCallback(() => {
    setUserLayout(prev => ({
      ...prev,
      activeSidebarItem: null,
    }));
  }, [setUserLayout]);

  const toggleSidebar = useCallback(
    (item: string) => () => {
      setUserLayout(prev => {
        if (prev.activeSidebarItem === item) {
          return {
            ...prev,
            activeSidebarItem: null,
          };
        }

        return {
          ...prev,
          activeSidebarItem: item,
        };
      });
    },
    [setUserLayout]
  );

  const toggleView = useCallback(
    (item: string) => () => {
      setUserLayout(prev => {
        const toggles = new Set(prev.activeToggles);
        if (toggles.has(item)) {
          toggles.delete(item);
        } else {
          toggles.add(item);
        }

        return {
          ...prev,
          activeToggles: toggles,
        };
      });
    },
    [setUserLayout]
  );

  const onTableViewResizeStop = useCallback(
    (_e: unknown, _dir: unknown, _ref: unknown, delta: { height: number }) => {
      setUserLayout(prev => {
        return {
          ...prev,
          tableView: {
            ...(prev.tableView || {}),
            height: (prev.tableView?.height ?? 300) + delta.height,
          },
        };
      });
    },
    [setUserLayout]
  );

  const toggles = userLayout.activeToggles;
  const [customizeNodeType, setCustomizeNodeType] = useState<
    string | undefined
  >();
  const [customizeEdgeType, setCustomizeEdgeType] = useState<
    string | undefined
  >();

  const prevActiveSidebarItem = usePrevious(userLayout.activeSidebarItem);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceAutoOpenDetails = useCallback(
    debounce((nodeOrEdgeSelected: boolean) => {
      if (!nodeOrEdgeSelected) {
        return;
      }

      if (
        userLayout.detailsAutoOpenOnSelection === false ||
        userLayout.activeSidebarItem !== null
      ) {
        return;
      }

      if (prevActiveSidebarItem != null) {
        return;
      }

      setUserLayout(prevState => ({
        ...prevState,
        activeSidebarItem: "details",
      }));
    }, 400),
    [
      setUserLayout,
      prevActiveSidebarItem,
      userLayout.activeSidebarItem,
      userLayout.detailsAutoOpenOnSelection,
    ]
  );

  useEffect(() => {
    debounceAutoOpenDetails(nodeOrEdgeSelected);
  }, [debounceAutoOpenDetails, nodeOrEdgeSelected]);

  return (
    <Workspace className={cn(styleWithTheme(defaultStyles), "graph-explorer")}>
      <Workspace.TopBar logoVisible>
        <Workspace.TopBar.Title
          title={APP_NAME}
          subtitle={`Connection: ${config?.displayLabel || config?.id}`}
        />
        <Workspace.TopBar.Content>
          <KeywordSearch />
        </Workspace.TopBar.Content>
        <Workspace.TopBar.Version>
          {__GRAPH_EXP_VERSION__}
        </Workspace.TopBar.Version>
        <Workspace.TopBar.AdditionalControls>
          <IconButton
            tooltipText={
              toggles.has("graph-viewer")
                ? "Hide Graph View"
                : "Show Graph View"
            }
            tooltipPlacement={"bottom-center"}
            variant={toggles.has("graph-viewer") ? "filled" : "text"}
            icon={<GraphIcon />}
            onPress={toggleView("graph-viewer")}
          />
          <IconButton
            tooltipText={
              toggles.has("table-view") ? "Hide Table View" : "Show Table View"
            }
            tooltipPlacement={"bottom-center"}
            variant={toggles.has("table-view") ? "filled" : "text"}
            icon={<GridIcon />}
            onPress={toggleView("table-view")}
          />
          <div className={"v-divider"} />
          <Link to={"/connections"}>
            <Button
              className={"button"}
              icon={<DatabaseIcon />}
              variant={"filled"}
            >
              Open Connections
            </Button>
          </Link>
        </Workspace.TopBar.AdditionalControls>
      </Workspace.TopBar>

      <Workspace.Content>
        {toggles.size === 0 && (
          <div style={{ width: "100%", flexGrow: 1 }}>
            <PanelEmptyState
              icon={<EmptyWidgetIcon />}
              title={"No active views"}
              subtitle={
                "Use toggles in the top-right corner to show/hide views"
              }
            />
          </div>
        )}
        {toggles.size === 0 && (
          <div style={{ width: "100%", flexGrow: 1 }}>
            <PanelEmptyState
              icon={<EmptyWidgetIcon />}
              title={"No active views"}
              subtitle={
                "Use toggles in the top-right corner to show/hide views"
              }
            />
          </div>
        )}
        {toggles.has("graph-viewer") && (
          <div
            style={{
              width: "100%",
              flexGrow: 1,
              position: "relative",
            }}
          >
            <GraphViewer
              onNodeCustomize={setCustomizeNodeType}
              onEdgeCustomize={setCustomizeEdgeType}
            />
          </div>
        )}
        {toggles.has("table-view") && (
          <Resizable
            enable={RESIZE_ENABLE_TOP}
            size={{
              width: "100%",
              height: !toggles.has("graph-viewer")
                ? "100%"
                : userLayout.tableView?.height || 300,
            }}
            minHeight={300}
            onResizeStop={onTableViewResizeStop}
          >
            <div style={{ width: "100%", height: "100%", flexGrow: 1 }}>
              <EntitiesTabular />
            </div>
          </Resizable>
        )}
      </Workspace.Content>

      <Workspace.SideBar direction={"row"}>
        <Workspace.SideBar.Button
          tooltipText={"Details"}
          icon={<DetailsIcon />}
          onPress={toggleSidebar("details")}
          active={userLayout.activeSidebarItem === "details"}
        />
        <Workspace.SideBar.Button
          tooltipText={"Filters"}
          icon={<FilterIcon />}
          onPress={toggleSidebar("filters")}
          badge={filteredEntitiesCount}
          badgeVariant="undetermined"
          badgePlacement="top-right"
          active={userLayout.activeSidebarItem === "filters"}
        />
        <Workspace.SideBar.Button
          tooltipText={"Expand"}
          icon={<ExpandGraphIcon />}
          onPress={toggleSidebar("expand")}
          active={userLayout.activeSidebarItem === "expand"}
        />
        <Workspace.SideBar.Button
          tooltipText={t("nodes-styling.title")}
          icon={<GraphIcon />}
          onPress={toggleSidebar("nodes-styling")}
          active={userLayout.activeSidebarItem === "nodes-styling"}
        />
        <Workspace.SideBar.Button
          tooltipText={t("edges-styling.title")}
          icon={<EdgeIcon />}
          onPress={toggleSidebar("edges-styling")}
          active={userLayout.activeSidebarItem === "edges-styling"}
        />
        {hasNamespaces && (
          <Workspace.SideBar.Button
            tooltipText={"Namespaces"}
            icon={<NamespaceIcon />}
            onPress={toggleSidebar("namespaces")}
            active={userLayout.activeSidebarItem === "namespaces"}
          />
        )}

        <Workspace.SideBar.Content
          isOpen={
            !hasNamespaces && userLayout.activeSidebarItem === "namespaces"
              ? false
              : userLayout.activeSidebarItem !== null
          }
        >
          {userLayout.activeSidebarItem === "details" && (
            <EntityDetails onClose={closeSidebar} />
          )}
          {userLayout.activeSidebarItem === "expand" && (
            <NodeExpand onClose={closeSidebar} />
          )}
          {userLayout.activeSidebarItem === "filters" && (
            <EntitiesFilter onClose={closeSidebar} />
          )}
          {userLayout.activeSidebarItem === "nodes-styling" && (
            <NodesStyling
              onClose={closeSidebar}
              customizeNodeType={customizeNodeType}
              onNodeCustomize={setCustomizeNodeType}
            />
          )}
          {userLayout.activeSidebarItem === "edges-styling" && (
            <EdgesStyling
              onClose={closeSidebar}
              customizeEdgeType={customizeEdgeType}
              onEdgeCustomize={setCustomizeEdgeType}
            />
          )}
          {userLayout.activeSidebarItem === "namespaces" && (
            <Namespaces onClose={closeSidebar} />
          )}
        </Workspace.SideBar.Content>
      </Workspace.SideBar>
    </Workspace>
  );
};

export default GraphExplorer;
