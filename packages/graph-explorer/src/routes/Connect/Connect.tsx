import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogSurface,
  DialogTitle,
} from "@/components";
import { useActivateConnection } from "@/connections";
import { resolveConnectionLink } from "@/core/connectionLink";
import CreateConnection, {
  type CreateConnectionOutcome,
  mapToConnectionForm,
} from "@/modules/CreateConnection";
import { logger } from "@/utils";

import { ConnectPageLayout } from "./ConnectPageLayout";
import { InvalidConnectionLinkCard } from "./InvalidConnectionLinkCard";

const GRAPH_CANVAS_ROUTE = "/graph-explorer";
const CONNECTIONS_ROUTE = "/connections";

/**
 * Route that opens a connection from link params (`#/connect?graphDbUrl=…`).
 * It resolves the link once on entry, then activates a matching connection,
 * explains why an invalid link was ignored, or opens the prefilled create
 * form. Leaving the route always replaces the URL, so `#/connect` never
 * lingers in history.
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

  const [intent] = useState(() => resolveConnectionLink(search));

  // Declining the link lands on the connections list, where the user can pick
  // a connection themselves; saving activated the new one, so show its graph.
  const leave = (outcome: CreateConnectionOutcome) =>
    navigate(outcome === "saved" ? GRAPH_CANVAS_ROUTE : CONNECTIONS_ROUTE, {
      replace: true,
    });

  useEffect(() => {
    if (intent.kind === "invalid") {
      logger.warn("Ignoring invalid connection link", intent.error);
      return;
    }
    // The create form waits on the user, so it renders instead of redirecting.
    if (intent.kind === "create") {
      return;
    }

    logger.debug(
      "Activating matching connection from URL params",
      intent.connection.id,
    );
    activateConnection(intent.connection.id);
    navigate(GRAPH_CANVAS_ROUTE, { replace: true });
  }, [intent, activateConnection, navigate]);

  if (intent.kind === "activate") {
    return null;
  }

  if (intent.kind === "invalid") {
    return (
      <ConnectPageLayout>
        <InvalidConnectionLinkCard
          error={intent.error}
          onContinue={() => navigate(GRAPH_CANVAS_ROUTE, { replace: true })}
        />
      </ConnectPageLayout>
    );
  }

  // The form is the whole page rather than a layer over an empty one, so it
  // renders in place inside the app shell instead of in a portal.
  return (
    <ConnectPageLayout>
      <Dialog
        open
        modal={false}
        onOpenChange={open => !open && leave("cancelled")}
      >
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
          <CreateConnection
            initialValues={mapToConnectionForm(intent.name, intent.connection)}
            onClose={leave}
          />
        </DialogSurface>
      </Dialog>
    </ConnectPageLayout>
  );
}
