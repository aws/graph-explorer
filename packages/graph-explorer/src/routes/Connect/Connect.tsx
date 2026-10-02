import { useEffect, useId, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import {
  Button,
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSurface,
  DialogTitle,
  NavBar,
  NavBarContent,
  NavBarTitle,
  PanelGroup,
  Workspace,
  WorkspaceContent,
} from "@/components";
import { resolveConnectionLink } from "@/core/connectionLink";
import useActivateConnection from "@/core/StateProvider/useActivateConnection";
import {
  ConnectionForm,
  mapToConnectionForm,
  useCreateConnection,
} from "@/modules/ConnectionForm";
import { logger } from "@/utils";
import { LABELS } from "@/utils/constants";
import { createDisplayError } from "@/utils/createDisplayError";

const GRAPH_CANVAS_ROUTE = "/graph-explorer";
const CONNECTIONS_ROUTE = "/connections";

/**
 * Route that opens a connection from link params (`#/connect?graphDbUrl=…`).
 * It resolves the link once on entry, then activates a matching connection,
 * warns about an invalid link, or opens the prefilled create form. Every
 * outcome replaces the URL, so `#/connect` never lingers in history.
 *
 * Resolving on entry is safe because `AppStatusLoader` holds this route until
 * the default connections load. Activating needs no confirmation because it
 * only targets a connection the user already created; the create form is the
 * trust gate for a link's untrusted endpoint details.
 */
export default function Connect() {
  const { search } = useLocation();
  // Keyed on the link so a second link opened in this tab, while the create
  // form for the first is still showing, is resolved rather than ignored.
  return <ConnectFromLink key={search} search={search} />;
}

function ConnectFromLink({ search }: { search: string }) {
  const navigate = useNavigate();
  const activateConnection = useActivateConnection();
  const createConnection = useCreateConnection();
  const formId = useId();

  const [intent] = useState(() => resolveConnectionLink(search));

  // Declining the link lands on the connections list, where the user can pick
  // a connection themselves.
  const cancel = () => navigate(CONNECTIONS_ROUTE, { replace: true });

  useEffect(() => {
    // The create form is the one outcome that waits on the user, so it renders
    // instead of redirecting.
    if (intent.kind === "create") {
      return;
    }

    if (intent.kind === "activate") {
      logger.debug(
        "Activating matching connection from URL params",
        intent.connection.id,
      );
      activateConnection(intent.connection.id);
    } else if (intent.kind === "invalid") {
      logger.warn("Ignoring invalid connection link", intent.error);
      const displayError = createDisplayError(intent.error);
      // A stable id keeps StrictMode's double-invoked effect from showing the
      // same toast twice in dev.
      toast.error(displayError.title, {
        id: "invalid-connection-link",
        description: displayError.message,
      });
    }

    // Paired with the side effect above so the toast is raised before we leave,
    // rather than racing a render-phase redirect.
    navigate(GRAPH_CANVAS_ROUTE, { replace: true });
  }, [intent, activateConnection, navigate]);

  if (intent.kind !== "create") {
    return null;
  }

  // The form is the whole page rather than a layer over an empty one, so it
  // renders in place inside the app shell instead of in a portal.
  return (
    <Workspace>
      <NavBar logoVisible>
        <NavBarContent>
          <NavBarTitle title={LABELS.APP_NAME} />
        </NavBarContent>
      </NavBar>
      <WorkspaceContent>
        <PanelGroup className="items-center justify-center p-20">
          <Dialog open modal={false} onOpenChange={open => !open && cancel()}>
            <DialogSurface
              // Outside is the rest of this page, so an outside click would
              // silently discard the form.
              onInteractOutside={event => event.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle>Add connection from link</DialogTitle>
                <DialogDescription>
                  Review the connection details from your link and add it to
                  continue.
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                <ConnectionForm
                  id={formId}
                  initialValues={mapToConnectionForm(
                    intent.name,
                    intent.connection,
                  )}
                  onSubmit={values => {
                    createConnection(values);
                    // Saving activated the new connection, so show its graph.
                    navigate(GRAPH_CANVAS_ROUTE, { replace: true });
                  }}
                />
              </DialogBody>
              <DialogFooter>
                <Button variant="outline" onClick={cancel}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" form={formId}>
                  Add Connection
                </Button>
              </DialogFooter>
            </DialogSurface>
          </Dialog>
        </PanelGroup>
      </WorkspaceContent>
    </Workspace>
  );
}
