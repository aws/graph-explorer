import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components";
import useActivateConnection from "@/core/StateProvider/useActivateConnection";
import { useResolveUrlConnectionIntent } from "@/core/useResolveUrlConnectionIntent";
import CreateConnection, {
  mapToConnectionForm,
} from "@/modules/CreateConnection";
import { logger } from "@/utils";
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
 * Only the create form outlives that moment, and it is the one thing held in
 * state. The rest is a side effect, not a rendered value — which is why the
 * intent is resolved inside the effect rather than derived on every render.
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
  const resolveIntent = useResolveUrlConnectionIntent();
  const activateConnection = useActivateConnection();

  // Resolved on entry and never again: the link was opened once, so the decision
  // is initial state rather than a value derived each render or an effect that
  // sets state after the first paint.
  const [intent] = useState(() => resolveIntent(search));

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

  return (
    <Dialog open onOpenChange={open => !open && leave()}>
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
          onClose={leave}
        />
      </DialogContent>
    </Dialog>
  );
}
