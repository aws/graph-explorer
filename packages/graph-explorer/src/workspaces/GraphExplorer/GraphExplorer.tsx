import { cn } from "@/utils";
import { Resizable } from "re-resizable";
import { Link } from "react-router";
import {
  buttonStyles,
  Divider,
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
import { useConfiguration, userLayoutAtom, useSidebar } from "@/core";
import { totalFilteredCount } from "@/core/StateProvider/filterCount";
import useTranslations from "@/hooks/useTranslations";
import EdgesStyling from "@/modules/EdgesStyling/EdgesStyling";
import EntitiesFilter from "@/modules/EntitiesFilter";
import EntitiesTabular from "@/modules/EntitiesTabular/EntitiesTabular";
import EntityDetails from "@/modules/EntityDetails";
import GraphViewer from "@/modules/GraphViewer";
import Namespaces from "@/modules/Namespaces/Namespaces";
import NodeExpand from "@/modules/NodeExpand";
import { NodesStyling } from "@/modules/NodesStyling";

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
  const config = useConfiguration();
  const t = useTranslations();
  const [userLayout, setUserLayout] = useAtom(userLayoutAtom);

  const filteredEntitiesCount = useAtomValue(totalFilteredCount);

  const { activeSidebarItem, toggleSidebar, shouldShowNamespaces } =
    useSidebar();

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
    <Workspace>
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
          <Divider axis="vertical" className="mx-2 h-[50%]" />
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
          <PanelEmptyState
            icon={<EmptyWidgetIcon />}
            title="No active views"
            subtitle="Use toggles in the top-right corner to show/hide views"
          />
        )}
        {toggles.has("graph-viewer") && <GraphViewer />}
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
            <EntitiesTabular />
          </Resizable>
        )}
      </Workspace.Content>

      <Workspace.SideBar direction="row">
        <SidebarButton
          title="Search"
          icon={<SearchIcon />}
          onPressedChange={() => toggleSidebar("search")}
          pressed={activeSidebarItem === "search"}
        />
        <SidebarButton
          title="Details"
          icon={<DetailsIcon />}
          onPressedChange={() => toggleSidebar("details")}
          pressed={activeSidebarItem === "details"}
        />
        <SidebarButton
          title="Filters"
          icon={<FilterIcon />}
          onPressedChange={() => toggleSidebar("filters")}
          badge={filteredEntitiesCount > 0}
          pressed={activeSidebarItem === "filters"}
        />
        <SidebarButton
          title="Expand"
          icon={<ExpandGraphIcon />}
          onPressedChange={() => toggleSidebar("expand")}
          pressed={activeSidebarItem === "expand"}
        />
        <SidebarButton
          title={t("nodes-styling.title")}
          icon={<GraphIcon />}
          onPressedChange={() => toggleSidebar("nodes-styling")}
          pressed={activeSidebarItem === "nodes-styling"}
        />
        <SidebarButton
          title={t("edges-styling.title")}
          icon={<EdgeIcon />}
          onPressedChange={() => toggleSidebar("edges-styling")}
          pressed={activeSidebarItem === "edges-styling"}
        />
        {shouldShowNamespaces && (
          <SidebarButton
            title="Namespaces"
            icon={<NamespaceIcon />}
            onPressedChange={() => toggleSidebar("namespaces")}
            pressed={activeSidebarItem === "namespaces"}
          />
        )}

        <Workspace.SideBar.Content>
          {activeSidebarItem === "search" && <SearchSidebarPanel />}
          {activeSidebarItem === "details" && <EntityDetails />}
          {activeSidebarItem === "expand" && <NodeExpand />}
          {activeSidebarItem === "filters" && <EntitiesFilter />}
          {activeSidebarItem === "nodes-styling" && <NodesStyling />}
          {activeSidebarItem === "edges-styling" && <EdgesStyling />}
          {activeSidebarItem === "namespaces" && <Namespaces />}
        </Workspace.SideBar.Content>
      </Workspace.SideBar>
    </Workspace>
  );
};

export default GraphExplorer;
