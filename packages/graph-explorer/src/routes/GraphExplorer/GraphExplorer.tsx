import { ListTreeIcon } from "lucide-react";
import { Resizable } from "re-resizable";

import {
  Button,
  Divider,
  EmptyState,
  EmptyStateActions,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
  NavBar,
  NavBarActions,
  NavBarContent,
  NavBarTitle,
  PanelGroup,
  RouteButtonGroup,
  SchemaDiscoveryBoundary,
  Workspace,
  WorkspaceContent,
} from "@/components";
import { EmptyWidgetIcon, GraphIcon } from "@/components/icons";
import GridIcon from "@/components/icons/GridIcon";
import {
  DEFAULT_TABLE_VIEW_HEIGHT,
  useConfiguration,
  useHasActiveSchema,
  useTableViewSize,
  useTreeViewSize,
  useViewToggles,
} from "@/core";
import { EdgeStyleDialog } from "@/modules/EdgesStyling";
import EntitiesTabular from "@/modules/EntitiesTabular/EntitiesTabular";
import GraphViewer from "@/modules/GraphViewer";
import { NodeStyleDialog } from "@/modules/NodesStyling";
import TreeView from "@/modules/TreeView";
import { cn } from "@/utils";
import { LABELS } from "@/utils/constants";

import { Sidebar } from "./Sidebar";

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

const RESIZE_ENABLE_RIGHT = {
  top: false,
  right: true,
  bottom: false,
  left: false,
  topRight: false,
  bottomRight: false,
  bottomLeft: false,
  topLeft: false,
};

const MIN_TREE_VIEW_WIDTH = 200;

const GraphExplorer = () => {
  const config = useConfiguration();

  const {
    isGraphVisible,
    isTableVisible,
    isTreeVisible,
    toggleGraphVisibility,
    toggleTableVisibility,
    toggleTreeVisibility,
  } = useViewToggles();

  const hasSchema = useHasActiveSchema();
  const [tableViewHeight, setTableViewHeight] = useTableViewSize();
  const [treeViewWidth, setTreeViewWidth] = useTreeViewSize();

  return (
    <Workspace>
      <NavBar logoVisible>
        <NavBarContent>
          <NavBarTitle
            title={LABELS.APP_NAME}
            subtitle={`Connection: ${config?.displayLabel || config?.id}`}
          />
        </NavBarContent>

        {hasSchema && (
          <>
            <NavBarActions>
              <div className="flex gap-1">
                <Button
                  tooltip={isTreeVisible ? "Hide Tree View" : "Show Tree View"}
                  variant={isTreeVisible ? "primary" : "ghost"}
                  size="icon"
                  onClick={toggleTreeVisibility}
                >
                  <ListTreeIcon />
                </Button>
                <Button
                  tooltip={
                    isGraphVisible ? "Hide Graph View" : "Show Graph View"
                  }
                  variant={isGraphVisible ? "primary" : "ghost"}
                  size="icon"
                  onClick={toggleGraphVisibility}
                >
                  <GraphIcon />
                </Button>
                <Button
                  tooltip={
                    isTableVisible ? "Hide Table View" : "Show Table View"
                  }
                  variant={isTableVisible ? "primary" : "ghost"}
                  size="icon"
                  onClick={toggleTableVisibility}
                >
                  <GridIcon />
                </Button>
              </div>
            </NavBarActions>
            <Divider axis="vertical" className="h-[30%]" />
          </>
        )}
        <RouteButtonGroup active="graph-explorer" />
      </NavBar>

      <WorkspaceContent className="flex min-h-0 flex-1 flex-row">
        <SchemaDiscoveryBoundary>
          {isTreeVisible && (
            <Resizable
              enable={RESIZE_ENABLE_RIGHT}
              size={{ width: treeViewWidth, height: "100%" }}
              minWidth={MIN_TREE_VIEW_WIDTH}
              onResizeStop={(_e, _dir, _ref, delta) =>
                setTreeViewWidth(delta.width)
              }
              className="min-h-0 shrink-0"
            >
              <TreeView />
            </Resizable>
          )}

          <PanelGroup className="flex min-h-0 flex-col overflow-auto">
            <div
              className={cn(
                "hidden min-h-0 flex-1",
                !isGraphVisible && !isTableVisible && "block",
              )}
            >
              <EmptyState>
                <EmptyStateIcon>
                  <EmptyWidgetIcon />
                </EmptyStateIcon>
                <EmptyStateContent>
                  <EmptyStateTitle>All Views Hidden</EmptyStateTitle>
                  <EmptyStateDescription>
                    To view your graph data show the graph view or table view
                  </EmptyStateDescription>
                  <EmptyStateActions>
                    <Button variant="primary" onClick={toggleGraphVisibility}>
                      <GraphIcon />
                      Show Graph View
                    </Button>
                    <Button variant="primary" onClick={toggleTableVisibility}>
                      <GridIcon />
                      Show Table View
                    </Button>
                  </EmptyStateActions>
                </EmptyStateContent>
              </EmptyState>
            </div>
            <div
              className={cn("hidden min-h-0 flex-1", isGraphVisible && "block")}
            >
              <GraphViewer />
            </div>
            <div
              className={cn(
                "hidden min-h-0",
                isTableVisible && "block",
                isGraphVisible ? "flex-none" : "flex-1",
              )}
            >
              <Resizable
                enable={isGraphVisible ? RESIZE_ENABLE_TOP : false}
                size={{
                  width: "100%",
                  height: isGraphVisible ? tableViewHeight : "100%",
                }}
                minHeight={
                  isGraphVisible ? DEFAULT_TABLE_VIEW_HEIGHT : undefined
                }
                onResizeStop={(_e, _dir, _ref, delta) =>
                  setTableViewHeight(delta.height)
                }
              >
                <EntitiesTabular />
              </Resizable>
            </div>
          </PanelGroup>

          <Sidebar />

          <NodeStyleDialog />
          <EdgeStyleDialog />
        </SchemaDiscoveryBoundary>
      </WorkspaceContent>
    </Workspace>
  );
};

export default GraphExplorer;
