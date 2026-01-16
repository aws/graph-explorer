import {
  ConnectionsRouteButton,
  GraphExplorerRouteButton,
  NavBar,
  NavBarActions,
  NavBarContent,
  NavBarTitle,
  NavBarVersion,
  Panel,
  PanelContent,
  PanelGroup,
  Workspace,
  WorkspaceContent,
} from "@/components";
import Redirect from "@/components/Redirect";
import { useConfiguration, useHasActiveSchema } from "@/core";

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
        <PanelGroup>
          <Panel className="flex-1">
            <PanelContent className="flex items-center justify-center">
              <p className="text-text-secondary text-lg">
                Schema visualization coming soon...
              </p>
            </PanelContent>
          </Panel>
        </PanelGroup>
      </WorkspaceContent>
    </Workspace>
  );
}
