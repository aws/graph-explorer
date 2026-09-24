import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogInlineContent,
  DialogTitle,
  NavBar,
  NavBarContent,
  NavBarTitle,
  PanelGroup,
  Workspace,
  WorkspaceContent,
} from "@/components";
import { resolveConnectionLink } from "@/core/resolveConnectionLink";
import useActivateConnection from "@/core/StateProvider/useActivateConnection";
import CreateConnection, {
  mapToConnectionForm,
} from "@/modules/CreateConnection";
import { logger } from "@/utils";
import { LABELS } from "@/utils/constants";
import { createDisplayError } from "@/utils/createDisplayError";

const GRAPH_CANVAS_ROUTE = "/graph-explorer";

/**
 * Route that opens a connection from link params (`#/connect?graphDbUrl=…`).
 * Opening a link is a one-shot event, so the route resolves it once on entry and
 * acts: it switches to a matching existing connection, warns when the link's
 * data is invalid, or opens the create-connection form prefilled from the
 * params. Every outcome ends at the graph canvas, so the connect URL never
 * lingers in history.
 *
 * The intent is resolved once, on entry, and held as this component's initial
 * state. Deriving it on every render would re-decide a question the link already
 * answered, and resolving it in the effect would decide after the first paint
 * what could be known before it. The create form is the only outcome that
 * outlives that moment, so it is the only thing rendered.
 *
 * Resolving on entry is correct because `AppStatusLoader` gates this route
 * behind a loading state until the default connections have arrived. The test
 * "does not prompt to create when a loading default connection matches the
 * connect URL" in `core/AppStatusLoader.test.tsx` pins that ordering.
 *
 * Switching to an existing connection needs no confirmation: it is the same
 * no-prompt operation as clicking that connection in the connections list, and
 * it only ever targets a connection the user already created and validated. The
 * create form keeps its friction — that is the trust gate for the untrusted
 * endpoint details a link can carry.
 */
export default function Connect() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const activateConnection = useActivateConnection();

  const [intent] = useState(() => resolveConnectionLink(search));

  const leave = () => navigate(GRAPH_CANVAS_ROUTE, { replace: true });

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
      toast.error(displayError.title, { description: displayError.message });
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
          <Dialog open modal={false} onOpenChange={open => !open && leave()}>
            <DialogInlineContent>
              <DialogHeader>
                <DialogTitle>Create connection from link</DialogTitle>
                <DialogDescription>
                  Review the connection details from your link and create it to
                  continue.
                </DialogDescription>
              </DialogHeader>
              <CreateConnection
                initialValues={mapToConnectionForm({
                  displayLabel: intent.name,
                  connection: intent.connection,
                })}
                onClose={leave}
              />
            </DialogInlineContent>
          </Dialog>
        </PanelGroup>
      </WorkspaceContent>
    </Workspace>
  );
}
