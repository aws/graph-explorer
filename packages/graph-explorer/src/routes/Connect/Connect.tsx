import { useEffect, useEffectEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
  Dialog,
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
import { createDisplayError } from "@/utils/createDisplayError";

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
  //
  // An effect event so the intent itself stays out of the dependencies: it is
  // recomputed every render, and the `invalid` error is a fresh object each
  // time, which would re-fire an effect that only needs to run on entry.
  const actOnIntent = useEffectEvent(() => {
    if (intent.kind === "activate") {
      logger.debug(
        "Activating matching connection from URL params",
        intent.connection.id,
      );
      activateConnection(intent.connection.id);
    } else if (intent.kind === "invalid") {
      logger.warn("Ignoring invalid connection link", intent.error);
      const displayError = createDisplayError(intent.error);
      toast.error(displayError.title, {
        // A stable id dedupes the toast if the effect runs more than once.
        id: "invalid-connection-link",
        description: displayError.message,
      });
    }
    navigate(GRAPH_CANVAS_ROUTE, { replace: true });
  });

  const isCreate = intent.kind === "create";
  useEffect(() => {
    if (isCreate) {
      return;
    }
    actOnIntent();
  }, [isCreate]);

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
          <CreateConnection
            initialValues={mapToConnectionForm(intent.connection)}
            onClose={() => navigate(GRAPH_CANVAS_ROUTE, { replace: true })}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // none / invalid / activate: the effect above handles the side effect and
  // the redirect, so there is nothing to render in the meantime.
  return null;
}
