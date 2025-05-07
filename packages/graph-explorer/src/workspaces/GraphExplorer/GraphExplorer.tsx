import { cn } from "@/utils";
import { Resizable } from "re-resizable";
import { Link } from "react-router";
import {
  buttonStyles,
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
  SearchIcon,
} from "@/components/icons";
import GridIcon from "@/components/icons/GridIcon";
import Workspace, { SidebarButton } from "@/components/Workspace";
import { useConfiguration, useWithTheme } from "@/core";
import { totalFilteredCount } from "@/core/StateProvider/filterCount";
import {
  SidebarItems,
  userLayoutAtom,
} from "@/core/StateProvider/userPreferences";
import useTranslations from "@/hooks/useTranslations";
import EdgesStyling from "@/modules/EdgesStyling/EdgesStyling";
import EntitiesFilter from "@/modules/EntitiesFilter";
import EntitiesTabular from "@/modules/EntitiesTabular/EntitiesTabular";
import EntityDetails from "@/modules/EntityDetails";
import GraphViewer from "@/modules/GraphViewer";
import Namespaces from "@/modules/Namespaces/Namespaces";
import NodeExpand from "@/modules/NodeExpand";
import { NodesStyling } from "@/modules/NodesStyling";
import defaultStyles from "./GraphExplorer.styles";
import { APP_NAME } from "@/utils/constants";
import { SearchSidebarPanel } from "@/modules/SearchSidebar";
import { useAtom, useAtomValue } from "jotai";

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
  const [userLayout, setUserLayout] = useAtom(userLayoutAtom);

  const filteredEntitiesCount = useAtomValue(totalFilteredCount);

  const toggleSidebar = (item: SidebarItems) => async () => {
    await setUserLayout(async prev => {
      const prevValue = await prev;
      if (prevValue.activeSidebarItem === item) {
        return {
          ...prevValue,
          activeSidebarItem: null,
        };
      }

      return {
        ...prevValue,
        activeSidebarItem: item,
      };
    });
  };

  const toggleView = (item: string) => async () => {
    await setUserLayout(async prev => {
      const prevValue = await prev;
      const toggles = new Set(prevValue.activeToggles);
      if (toggles.has(item)) {
        toggles.delete(item);
      } else {
        toggles.add(item);
      }

      return {
        ...prevValue,
        activeToggles: toggles,
      };
    });
  };

  const onTableViewResizeStop = async (
    _e: unknown,
    _dir: unknown,
    _ref: unknown,
    delta: { height: number }
  ) => {
    await setUserLayout(async prev => {
      const prevValue = await prev;
      return {
        ...prevValue,
        tableView: {
          ...(prevValue.tableView || {}),
          height: (prevValue.tableView?.height ?? 300) + delta.height,
        },
      };
    });
  };

  const toggles = userLayout.activeToggles;

  return (
    <Workspace className={cn(styleWithTheme(defaultStyles), "graph-explorer")}>
      <Workspace.TopBar logoVisible>
        <Workspace.TopBar.Title
          title={APP_NAME}
          subtitle={`Connection: ${config?.displayLabel || config?.id}`}
        />
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
            variant={toggles.has("graph-viewer") ? "filled" : "text"}
            icon={<GraphIcon />}
            onClick={toggleView("graph-viewer")}
          />
          <IconButton
            tooltipText={
              toggles.has("table-view") ? "Hide Table View" : "Show Table View"
            }
            variant={toggles.has("table-view") ? "filled" : "text"}
            icon={<GridIcon />}
            onClick={toggleView("table-view")}
          />
          <div className="v-divider" />
          <Link
            to="/connections"
            className={cn(buttonStyles({ variant: "filled" }))}
          >
            <DatabaseIcon />
            Open Connections
          </Link>
        </Workspace.TopBar.AdditionalControls>
      </Workspace.TopBar>

      <Workspace.Content>
        {toggles.size === 0 && (
          <div style={{ width: "100%", flexGrow: 1 }}>
            <PanelEmptyState
              icon={<EmptyWidgetIcon />}
              title="No active views"
              subtitle="Use toggles in the top-right corner to show/hide views"
            />
          </div>
        )}
        {toggles.size === 0 && (
          <div style={{ width: "100%", flexGrow: 1 }}>
            <PanelEmptyState
              icon={<EmptyWidgetIcon />}
              title="No active views"
              subtitle="Use toggles in the top-right corner to show/hide views"
            />
          </div>
        )}
        {toggles.has("graph-viewer") && (
          <div className="relative w-full grow">
            <GraphViewer />
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

      <Workspace.SideBar direction="row">
        <SidebarButton
          title="Search"
          icon={<SearchIcon />}
          onPressedChange={toggleSidebar("search")}
          pressed={userLayout.activeSidebarItem === "search"}
        />
        <SidebarButton
          title="Details"
          icon={<DetailsIcon />}
          onPressedChange={toggleSidebar("details")}
          pressed={userLayout.activeSidebarItem === "details"}
        />
        <SidebarButton
          title="Filters"
          icon={<FilterIcon />}
          onPressedChange={toggleSidebar("filters")}
          badge={filteredEntitiesCount > 0}
          pressed={userLayout.activeSidebarItem === "filters"}
        />
        <SidebarButton
          title="Expand"
          icon={<ExpandGraphIcon />}
          onPressedChange={toggleSidebar("expand")}
          pressed={userLayout.activeSidebarItem === "expand"}
        />
        <SidebarButton
          title={t("nodes-styling.title")}
          icon={<GraphIcon />}
          onPressedChange={toggleSidebar("nodes-styling")}
          pressed={userLayout.activeSidebarItem === "nodes-styling"}
        />
        <SidebarButton
          title={t("edges-styling.title")}
          icon={<EdgeIcon />}
          onPressedChange={toggleSidebar("edges-styling")}
          pressed={userLayout.activeSidebarItem === "edges-styling"}
        />
        {hasNamespaces && (
          <SidebarButton
            title="Namespaces"
            icon={<NamespaceIcon />}
            onPressedChange={toggleSidebar("namespaces")}
            pressed={userLayout.activeSidebarItem === "namespaces"}
          />
        )}

        <Workspace.SideBar.Content
          isOpen={
            !hasNamespaces && userLayout.activeSidebarItem === "namespaces"
              ? false
              : userLayout.activeSidebarItem !== null
          }
        >
          {userLayout.activeSidebarItem === "search" && <SearchSidebarPanel />}
          {userLayout.activeSidebarItem === "details" && <EntityDetails />}
          {userLayout.activeSidebarItem === "expand" && <NodeExpand />}
          {userLayout.activeSidebarItem === "filters" && <EntitiesFilter />}
          {userLayout.activeSidebarItem === "nodes-styling" && <NodesStyling />}
          {userLayout.activeSidebarItem === "edges-styling" && <EdgesStyling />}
          {userLayout.activeSidebarItem === "namespaces" && <Namespaces />}
        </Workspace.SideBar.Content>
      </Workspace.SideBar>
    </Workspace>
  );
};

export default GraphExplorer;
