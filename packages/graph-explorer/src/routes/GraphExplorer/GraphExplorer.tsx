import { Activity } from "react";
import { cn, isVisible } from "@/utils";
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
import {
  DEFAULT_TABLE_VIEW_HEIGHT,
  useConfiguration,
  useSidebar,
  useTableViewSize,
  useViewToggles,
} from "@/core";
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
import { LABELS } from "@/utils/constants";
import { SearchSidebarPanel } from "@/modules/SearchSidebar";
import { useAtomValue } from "jotai";

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

  const filteredEntitiesCount = useAtomValue(totalFilteredCount);

  const {
    isGraphVisible,
    isTableVisible,
    toggleGraphVisibility,
    toggleTableVisibility,
  } = useViewToggles();

  const { activeSidebarItem, toggleSidebar, shouldShowNamespaces } =
    useSidebar();

  const [tableViewHeight, setTableViewHeight] = useTableViewSize();

  return (
    <Workspace>
      <Workspace.TopBar logoVisible>
        <Workspace.TopBar.Title
          title={LABELS.APP_NAME}
          subtitle={`Connection: ${config?.displayLabel || config?.id}`}
        />
        <Workspace.TopBar.Version>
          {__GRAPH_EXP_VERSION__}
        </Workspace.TopBar.Version>
        <Workspace.TopBar.AdditionalControls>
          <IconButton
            tooltipText={isGraphVisible ? "Hide Graph View" : "Show Graph View"}
            variant={isGraphVisible ? "filled" : "text"}
            icon={<GraphIcon />}
            onClick={toggleGraphVisibility}
          />
          <IconButton
            tooltipText={isTableVisible ? "Hide Table View" : "Show Table View"}
            variant={isTableVisible ? "filled" : "text"}
            icon={<GridIcon />}
            onClick={toggleTableVisibility}
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
        <Activity mode={isVisible(!isGraphVisible && !isTableVisible)}>
          <PanelEmptyState
            icon={<EmptyWidgetIcon />}
            title="No active views"
            subtitle="Use toggles in the top-right corner to show/hide views"
          />
        </Activity>
        <Activity mode={isVisible(isGraphVisible)}>
          <GraphViewer />
        </Activity>
        <Activity mode={isVisible(isTableVisible)}>
          <Resizable
            enable={RESIZE_ENABLE_TOP}
            size={{
              width: "100%",
              height: tableViewHeight,
            }}
            minHeight={DEFAULT_TABLE_VIEW_HEIGHT}
            onResizeStop={(_e, _dir, _ref, delta) =>
              setTableViewHeight(delta.height)
            }
          >
            <EntitiesTabular />
          </Resizable>
        </Activity>
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
          <Activity mode={isVisible(activeSidebarItem === "search")}>
            <SearchSidebarPanel />
          </Activity>
          <Activity mode={isVisible(activeSidebarItem === "details")}>
            <EntityDetails />
          </Activity>
          <Activity mode={isVisible(activeSidebarItem === "expand")}>
            <NodeExpand />
          </Activity>
          <Activity mode={isVisible(activeSidebarItem === "filters")}>
            <EntitiesFilter />
          </Activity>
          <Activity mode={isVisible(activeSidebarItem === "nodes-styling")}>
            <NodesStyling />
          </Activity>
          <Activity mode={isVisible(activeSidebarItem === "edges-styling")}>
            <EdgesStyling />
          </Activity>
          <Activity mode={isVisible(activeSidebarItem === "namespaces")}>
            <Namespaces />
          </Activity>
        </Workspace.SideBar.Content>
      </Workspace.SideBar>
    </Workspace>
  );
};

export default GraphExplorer;
