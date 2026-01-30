import {
  ConnectionsRouteButton,
  GraphExplorerRouteButton,
  NavBar,
  NavBarActions,
  NavBarContent,
  NavBarTitle,
  NavBarVersion,
  Workspace,
  WorkspaceContent,
} from "@/components";
import { GraphProvider } from "@/components/Graph";
import Redirect from "@/components/Redirect";
import { useConfiguration, useHasActiveSchema } from "@/core";
import { EdgeDiscoveryBoundary, SchemaGraph } from "@/modules/SchemaGraph";

export default function SchemaExplorer() {
  const config = useConfiguration();
  const hasSchema = useHasActiveSchema();

  if (!hasSchema) {
    return <Redirect to="/connections" />;
  }

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
          <GraphExplorerRouteButton variant="filled" />
        </NavBarActions>
      </NavBar>
      <WorkspaceContent>
        <GraphProvider>
          <EdgeDiscoveryBoundary>
            <SchemaGraph />
          </EdgeDiscoveryBoundary>
        </GraphProvider>
      </WorkspaceContent>
    </Workspace>
  );
}
