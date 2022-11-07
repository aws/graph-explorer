import { cx } from "@emotion/css";
import { useCallback } from "react";
import { Link } from "react-router-dom";
import { useRecoilState } from "recoil";
import { Button } from "../../components";
import PanelEmptyState from "../../components/EmptyStates/PanelEmptyState";
import IconButton from "../../components/IconButton";
import {
  DatabaseIcon,
  DetailsIcon,
  ExpandGraphIcon,
  FilterIcon,
  GraphIcon,
  StylingIcon,
} from "../../components/icons";
import EmptyWidgetIcon from "../../components/icons/EmptyWidgetIcon";
import GridIcon from "../../components/icons/GridIcon";
import Workspace from "../../components/Workspace";
import {
  useConfiguration,
  useWithTheme,
  withClassNamePrefix,
} from "../../core";
import { userLayoutAtom } from "../../core/StateProvider/userPreferences";
import EntitiesFilter from "../../modules/EntitiesFilter";
import EntitiesTabular from "../../modules/EntitiesTabular/EntitiesTabular";
import EntityDetails from "../../modules/EntityDetails";
import GraphViewer from "../../modules/GraphViewer";
import KeywordSearch from "../../modules/KeywordSearch/KeywordSearch";
import VertexExpand from "../../modules/VertexExpand";
import VerticesStyling from "../../modules/VerticesStyling";
import TopBarWithLogo from "../common/TopBarWithLogo";
import defaultStyles from "./GraphExplorer.styles";

export type GraphViewProps = {
  classNamePrefix?: string;
};

const GraphExplorer = ({ classNamePrefix = "ft" }: GraphViewProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);
  const config = useConfiguration();
  const [userLayout, setUserLayout] = useRecoilState(userLayoutAtom);

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

  const toggles = userLayout.activeToggles;
  return (
    <Workspace
      className={cx(
        styleWithTheme(defaultStyles(classNamePrefix)),
        pfx("graph-explorer")
      )}
    >
      <TopBarWithLogo>
        <Workspace.TopBar.Title>
          <div>
            <div className={pfx("top-bar-title")}>Graph Explorer</div>
            <div className={pfx("top-bar-subtitle")}>
              Active connection: {config?.displayLabel || config?.id}
            </div>
          </div>
        </Workspace.TopBar.Title>
        <Workspace.TopBar.Content>
          <KeywordSearch />
        </Workspace.TopBar.Content>
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
          <div className={pfx("v-divider")} />
          <Link to={"/connections"}>
            <Button
              className={pfx("button")}
              icon={<DatabaseIcon />}
              variant={"filled"}
            >
              Open Connections
            </Button>
          </Link>
        </Workspace.TopBar.AdditionalControls>
      </TopBarWithLogo>

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
        {toggles.has("graph-viewer") && (
          <div style={{ width: "100%", minHeight: "60%", flexGrow: 1 }}>
            <GraphViewer />
          </div>
        )}
        {toggles.has("table-view") && (
          <div style={{ width: "100%", minHeight: "30%", flexGrow: 1 }}>
            <EntitiesTabular />
          </div>
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
          active={userLayout.activeSidebarItem === "filters"}
        />
        <Workspace.SideBar.Button
          tooltipText={"Expand"}
          icon={<ExpandGraphIcon />}
          onPress={toggleSidebar("expand")}
          active={userLayout.activeSidebarItem === "expand"}
        />
        <Workspace.SideBar.Button
          tooltipText={"Styling"}
          icon={<StylingIcon />}
          onPress={toggleSidebar("styling")}
          active={userLayout.activeSidebarItem === "styling"}
        />

        <Workspace.SideBar.Content
          isOpen={userLayout.activeSidebarItem !== null}
        >
          {userLayout.activeSidebarItem === "details" && (
            <EntityDetails onClose={closeSidebar} />
          )}
          {userLayout.activeSidebarItem === "expand" && (
            <VertexExpand onClose={closeSidebar} />
          )}
          {userLayout.activeSidebarItem === "filters" && (
            <EntitiesFilter onClose={closeSidebar} />
          )}
          {userLayout.activeSidebarItem === "styling" && (
            <VerticesStyling onClose={closeSidebar} />
          )}
        </Workspace.SideBar.Content>
      </Workspace.SideBar>
    </Workspace>
  );
};

export default GraphExplorer;
