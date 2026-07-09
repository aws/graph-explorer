import { useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components";
import useActivateConnection from "@/core/StateProvider/useActivateConnection";
import { useUrlConnectionIntent } from "@/core/useUrlConnectionIntent";
import CreateConnection, {
  mapToConnectionForm,
} from "@/modules/CreateConnection";
import { logger } from "@/utils";

const GRAPH_CANVAS_ROUTE = "/graph-explorer";

/**
 * Route that opens a connection from link params (`#/connect?graphDbUrl=…`). It
 * resolves the params against the current connections and either redirects
 * straight to the graph canvas (the params target the active connection or are
 * absent), warns and redirects when the link's data is invalid, silently
 * switches to a matching existing connection, or opens the create-connection
 * form prefilled from the params. Every outcome ends at the graph canvas, so
 * the connect URL never lingers in history.
 *
 * Switching to an existing connection needs no confirmation: it is the same
 * no-prompt operation as clicking that connection in the connections list, and
 * it only ever targets a connection the user already created and validated. The
 * create form keeps its friction — that is the trust gate for the untrusted
 * endpoint details a link can carry.
 */
export default function Connect() {
  const navigate = useNavigate();
  const intent = useUrlConnectionIntent();
  const activateConnection = useActivateConnection();

  // Every intent except `create` ends by leaving for the canvas. Activating a
  // connection and warning about a bad link are side effects that happen
  // because the link was opened (not from any in-app gesture), so they belong
  // in an effect — and pairing each with the redirect in the same effect
  // guarantees the toast is raised before we navigate away, rather than racing
  // a render-phase redirect. (`create` redirects from its own dialog button.)
  const connectionIdToActivate =
    intent.kind === "activate" ? intent.connection.id : null;
  const isInvalid = intent.kind === "invalid";
  const isCreate = intent.kind === "create";
  useEffect(() => {
    if (isCreate) {
      return;
    }
    if (connectionIdToActivate) {
      logger.debug(
        "Activating matching connection from URL params",
        connectionIdToActivate,
      );
      activateConnection(connectionIdToActivate);
    } else if (isInvalid) {
      logger.debug("Ignoring connection link with invalid params");
      toast.error("Invalid connection link", {
        // A stable id dedupes the toast if the effect runs more than once.
        id: "invalid-connection-link",
        description:
          "The link's connection details were invalid, so it was ignored. Check the graph database URL and try again.",
      });
    }
    navigate(GRAPH_CANVAS_ROUTE, { replace: true });
  }, [
    isCreate,
    connectionIdToActivate,
    isInvalid,
    activateConnection,
    navigate,
  ]);

  if (isCreate) {
    return (
      <Dialog
        open
        onOpenChange={open =>
          !open && navigate(GRAPH_CANVAS_ROUTE, { replace: true })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create connection from link</DialogTitle>
            <DialogDescription>
              Review the connection details from your link and create it to
              continue.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <CreateConnection
              initialValues={mapToConnectionForm(intent.connection)}
              onClose={() => navigate(GRAPH_CANVAS_ROUTE, { replace: true })}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    );
  }

  // none / invalid / activate: the effect above handles the side effect and
  // the redirect, so there is nothing to render in the meantime.
  return null;
}
