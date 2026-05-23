import {
  NavBar,
  NavBarContent,
  NavBarTitle,
  RouteButtonGroup,
  SchemaDiscoveryBoundary,
  Workspace,
  WorkspaceContent,
} from "@/components";
import { GraphProvider } from "@/components/Graph";
import { useConfiguration } from "@/core";
import { EdgeStyleDialog } from "@/modules/EdgesStyling";
import { NodeStyleDialog } from "@/modules/NodesStyling";
import { SchemaGraph } from "@/modules/SchemaGraph";

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

        <RouteButtonGroup active="schema-explorer" />
      </NavBar>
      <WorkspaceContent>
        <SchemaDiscoveryBoundary requireEdgeConnections>
          <GraphProvider>
            <SchemaGraph />
          </GraphProvider>
          <NodeStyleDialog />
          <EdgeStyleDialog />
        </SchemaDiscoveryBoundary>
      </WorkspaceContent>
    </Workspace>
  );
}
