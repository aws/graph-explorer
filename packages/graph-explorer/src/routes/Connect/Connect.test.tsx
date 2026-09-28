// @vitest-environment happy-dom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import { TooltipProvider } from "@/components";
import { type AppStore, type ConfigurationId, getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "@/core/StateProvider";
import { DbState, TestProvider } from "@/utils/testing";

import Connect from "./Connect";

function LocationDisplay() {
  const location = useLocation();
  return (
    <div data-testid="location">{location.pathname + location.search}</div>
  );
}

/** Opens another link in the same tab, the way a hash change would. */
function OpenLink({ search }: { search: string }) {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(`/connect${search}`)}>
      open next link
    </button>
  );
}

function searchFor(graphDbUrl: string, queryEngine = "gremlin") {
  return `?graphDbUrl=${encodeURIComponent(graphDbUrl)}&queryEngine=${queryEngine}`;
}

function renderConnect(search: string, nextSearch?: string) {
  const store = getAppStore();
  const queryClient = createQueryClient();
  render(
    <TestProvider
      client={queryClient}
      store={store}
      initialEntries={[`/connect${search}`]}
    >
      <TooltipProvider>
        <Routes>
          <Route path="/connect" element={<Connect />} />
          <Route path="/graph-explorer" element={<div>graph canvas</div>} />
          <Route path="/connections" element={<div>connections list</div>} />
        </Routes>
        <LocationDisplay />
        {nextSearch != null && <OpenLink search={nextSearch} />}
      </TooltipProvider>
    </TestProvider>,
  );
  return store;
}

function seedInactiveConnection(store: AppStore) {
  const inactiveUrl = "https://inactive.neptune.amazonaws.com";
  const inactiveConfig = {
    id: "inactive-conn" as ConfigurationId,
    displayLabel: "Inactive",
    connection: {
      url: "https://localhost",
      queryEngine: "gremlin" as const,
      proxyConnection: true,
      graphDbUrl: inactiveUrl,
    },
  };
  store.set(configurationAtom, prev => {
    const updated = new Map(prev);
    updated.set(inactiveConfig.id, inactiveConfig);
    return updated;
  });
  return { inactiveUrl, inactiveConfig };
}

describe("Connect route", () => {
  // The `#/connect` route exists only for connection links, so reaching it
  // with no params at all is a missing graphDbUrl, which warns rather than
  // silently redirecting.
  test("warns and redirects to the graph canvas when there are no params", async () => {
    new DbState().applyTo(getAppStore());

    renderConnect("");

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Invalid connection link",
        expect.objectContaining({
          id: "invalid-connection-link",
          description: expect.stringContaining("graphDbUrl is required"),
        }),
      );
    });
    expect(screen.getByTestId("location")).toHaveTextContent("/graph-explorer");
    expect(screen.getByText("graph canvas")).toBeInTheDocument();
  });

  test("redirects to the graph canvas when the params target the active connection", () => {
    const state = new DbState();
    const activeUrl = "https://active.neptune.amazonaws.com";
    state.activeConfig.connection = {
      url: "https://localhost",
      queryEngine: "gremlin",
      proxyConnection: true,
      graphDbUrl: activeUrl,
    };
    state.applyTo(getAppStore());

    renderConnect(searchFor(activeUrl));

    expect(screen.getByTestId("location")).toHaveTextContent("/graph-explorer");
  });

  test("activates an inactive matching connection and redirects without a prompt", async () => {
    new DbState().applyTo(getAppStore());
    const store = getAppStore();
    const { inactiveUrl, inactiveConfig } = seedInactiveConnection(store);

    renderConnect(searchFor(inactiveUrl));

    // Switching to an already-created connection is the same no-confirm
    // operation as clicking it in the connections list, so there is no dialog.
    await waitFor(() => {
      expect(store.get(activeConfigurationAtom)).toBe(inactiveConfig.id);
    });
    expect(screen.getByTestId("location")).toHaveTextContent("/graph-explorer");
  });

  test("opens the create form prefilled when nothing matches", () => {
    new DbState().applyTo(getAppStore());

    renderConnect(
      `${searchFor("https://brand-new.neptune.amazonaws.com", "openCypher")}&awsRegion=us-west-2&serviceType=neptune-db&name=Brand+New`,
    );

    expect(
      screen.getByRole("button", { name: "Add Connection" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Brand New");
    expect(screen.getByLabelText("Graph Connection URL")).toHaveValue(
      "https://brand-new.neptune.amazonaws.com",
    );
    // The dialog explains the connection details came from the user's link
    expect(screen.getByText(/details from your link/i)).toBeInTheDocument();
    expect(
      screen.getByText("OpenCypher - PG (Property Graph)"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("AWS Region")).toHaveValue("us-west-2");
    expect(screen.getByText("Neptune DB")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "AWS IAM Auth Enabled" }),
    ).toBeChecked();
  });

  test("a second link opened over the create form prefills from that link", async () => {
    new DbState().applyTo(getAppStore());

    renderConnect(
      `${searchFor("https://first.neptune.amazonaws.com")}&name=First`,
      `${searchFor("https://second.neptune.amazonaws.com")}&name=Second`,
    );
    expect(screen.getByLabelText("Name")).toHaveValue("First");

    await userEvent.click(
      screen.getByRole("button", { name: "open next link" }),
    );

    expect(screen.getByLabelText("Name")).toHaveValue("Second");
    expect(screen.getByLabelText("Graph Connection URL")).toHaveValue(
      "https://second.neptune.amazonaws.com",
    );
  });

  // Neptune Analytics only speaks openCypher; the create form normally forces
  // this by disabling the picker when the service type is selected, but a
  // link never goes through that handler, so the schema must resolve the same
  // default the form would have forced.
  test("opens the create form with openCypher when the link targets neptune-graph", () => {
    new DbState().applyTo(getAppStore());

    renderConnect(
      `?graphDbUrl=${encodeURIComponent(
        "https://g-xxx.us-west-2.neptune-graph.amazonaws.com",
      )}&awsRegion=us-west-2&serviceType=neptune-graph`,
    );

    expect(
      screen.getByText("OpenCypher - PG (Property Graph)"),
    ).toBeInTheDocument();
  });

  // The form is the page, not a layer over it, so it renders in place and
  // leaves the rest of the page usable.
  test("renders the create form in the page rather than as a modal", () => {
    new DbState().applyTo(getAppStore());

    renderConnect(searchFor("https://brand-new.neptune.amazonaws.com"));

    const form = screen.getByRole("dialog", {
      name: "Add connection from link",
    });
    expect(form).not.toHaveAttribute("aria-modal", "true");
    expect(screen.getByTestId("location").compareDocumentPosition(form)).toBe(
      Node.DOCUMENT_POSITION_PRECEDING,
    );
  });

  test("stays on the form when the page around it is clicked", async () => {
    const user = userEvent.setup();
    new DbState().applyTo(getAppStore());

    renderConnect(searchFor("https://brand-new.neptune.amazonaws.com"));
    await user.click(screen.getByTestId("location"));

    expect(
      screen.getByRole("dialog", { name: "Add connection from link" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/connect");
  });

  // Declining a link leaves the user where they can pick a connection
  // themselves, rather than on a graph view for whatever was active before.
  test("pressing Escape cancels without creating and lands on the connections list", async () => {
    const user = userEvent.setup();
    new DbState().applyTo(getAppStore());
    const store = getAppStore();
    const connectionsBefore = store.get(configurationAtom).size;

    renderConnect(searchFor("https://brand-new.neptune.amazonaws.com"));
    await user.keyboard("{Escape}");

    expect(await screen.findByText("connections list")).toBeInTheDocument();
    expect(store.get(configurationAtom).size).toBe(connectionsBefore);
  });

  test("clicking Cancel lands on the connections list without creating", async () => {
    const user = userEvent.setup();
    new DbState().applyTo(getAppStore());
    const store = getAppStore();
    const connectionsBefore = store.get(configurationAtom).size;

    renderConnect(searchFor("https://brand-new.neptune.amazonaws.com"));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByText("connections list")).toBeInTheDocument();
    expect(store.get(configurationAtom).size).toBe(connectionsBefore);
  });

  test("adding the connection activates it and lands on the graph canvas", async () => {
    const user = userEvent.setup();
    new DbState().applyTo(getAppStore());
    const store = getAppStore();
    const newUrl = "https://brand-new.neptune.amazonaws.com";

    renderConnect(searchFor(newUrl));
    await user.click(screen.getByRole("button", { name: "Add Connection" }));

    expect(await screen.findByText("graph canvas")).toBeInTheDocument();
    const active = store
      .get(configurationAtom)
      .get(store.get(activeConfigurationAtom)!);
    expect(active?.connection?.graphDbUrl).toBe(newUrl);
  });

  test("warns and redirects when the link's data is invalid", async () => {
    new DbState().applyTo(getAppStore());

    renderConnect("?graphDbUrl=not-a-url");

    // The warning names the offending parameter rather than saying the link was
    // generically bad.
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Invalid connection link",
        expect.objectContaining({
          id: "invalid-connection-link",
          description: expect.stringContaining(
            "graphDbUrl must be a valid http or https URL",
          ),
        }),
      );
    });
    expect(screen.getByTestId("location")).toHaveTextContent("/graph-explorer");
    expect(
      screen.queryByRole("button", { name: "Add Connection" }),
    ).not.toBeInTheDocument();
  });
});
