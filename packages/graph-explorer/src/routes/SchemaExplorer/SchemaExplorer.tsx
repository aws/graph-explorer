import {
  ConnectionsRouteButton,
  GraphExplorerRouteButton,
  NavBar,
  NavBarActions,
  NavBarContent,
  NavBarTitle,
  NavBarVersion,
  SchemaDiscoveryBoundary,
  Workspace,
  WorkspaceContent,
} from "@/components";
import { GraphProvider } from "@/components/Graph";
import { useConfiguration } from "@/core";
import { EdgeDiscoveryBoundary, SchemaGraph } from "@/modules/SchemaGraph";

export default function SchemaExplorer() {
  const config = useConfiguration();

  return (
    <Workspace>
      <NavBar logoVisible>
        <NavBarContent>
          <NavBarTitle
            title="Schema Explorer"
            subtitle={`Connection: ${config?.displayLabel || config?.id || "none"}`}
          />
        </NavBarContent>

        <NavBarActions>
          <NavBarVersion>{__GRAPH_EXP_VERSION__}</NavBarVersion>

          <ConnectionsRouteButton />
          <GraphExplorerRouteButton variant="primary" />
        </NavBarActions>
      </NavBar>
      <WorkspaceContent>
        <SchemaDiscoveryBoundary>
          <GraphProvider>
            <EdgeDiscoveryBoundary>
              <SchemaGraph />
            </EdgeDiscoveryBoundary>
          </GraphProvider>
        </SchemaDiscoveryBoundary>
      </WorkspaceContent>
    </Workspace>
  );
}
