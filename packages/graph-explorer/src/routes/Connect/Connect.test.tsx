// @vitest-environment happy-dom

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { describe, expect, test } from "vitest";

import { TooltipProvider } from "@/components";
import { getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import {
  activeConfigurationAtom,
  configurationAtom,
  nodesAtom,
} from "@/core/StateProvider";
import {
  createRandomRawConfiguration,
  createTestableVertex,
  DbState,
  TestProvider,
} from "@/utils/testing";

import Connect from "./Connect";

function LocationDisplay() {
  const location = useLocation();
  return (
    <div data-testid="location">{location.pathname + location.search}</div>
  );
}

/** Goes back one history entry, the way the browser back button would. */
function GoBack() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(-1)}>
      go back
    </button>
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

/** The problems the invalid link card lists, one per row. */
function problemsShown() {
  return within(screen.getByRole("list"))
    .getAllByRole("listitem")
    .map(item => item.textContent);
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
        <GoBack />
        {nextSearch != null && <OpenLink search={nextSearch} />}
      </TooltipProvider>
    </TestProvider>,
  );
  return store;
}

describe("Connect route", () => {
  // The `#/connect` route exists only for connection links, so reaching it
  // with no params at all is a missing graphDbUrl, which is shown rather than
  // silently redirecting.
  test("shows the invalid link card when there are no params", () => {
    new DbState().applyTo(getAppStore());

    renderConnect("");

    expect(screen.getByText("Invalid connection link")).toBeInTheDocument();
    expect(problemsShown()).toStrictEqual(["graphDbUrl is required"]);
    expect(screen.getByTestId("location")).toHaveTextContent("/connect");
  });

  test("redirects to the graph canvas when the params target the active connection", () => {
    const state = new DbState();
    const activeUrl = "https://active.neptune.amazonaws.com";
    state.activeConfig.connection = {
      queryEngine: "gremlin",
      graphDbUrl: activeUrl,
    };
    state.applyTo(getAppStore());

    renderConnect(searchFor(activeUrl));

    expect(screen.getByTestId("location")).toHaveTextContent("/graph-explorer");
  });

  test("keeps the session when the params target the active connection", () => {
    const state = new DbState();
    const activeUrl = "https://active.neptune.amazonaws.com";
    state.activeConfig.connection = {
      queryEngine: "gremlin",
      graphDbUrl: activeUrl,
    };
    state.addTestableVertexToGraph(createTestableVertex());
    const store = getAppStore();
    state.applyTo(store);
    const activeId = store.get(activeConfigurationAtom);
    const nodeCount = store.get(nodesAtom).size;
    expect(nodeCount).toBeGreaterThan(0);

    renderConnect(searchFor(activeUrl));

    expect(screen.getByTestId("location")).toHaveTextContent("/graph-explorer");
    expect(store.get(activeConfigurationAtom)).toBe(activeId);
    expect(store.get(nodesAtom).size).toBe(nodeCount);
  });

  test("activates an inactive matching connection and redirects without a prompt", async () => {
    const inactiveUrl = "https://inactive.neptune.amazonaws.com";
    const inactiveConfig = createRandomRawConfiguration();
    inactiveConfig.connection = {
      queryEngine: "gremlin",
      graphDbUrl: inactiveUrl,
    };
    const store = getAppStore();
    new DbState().addInactiveConnection(inactiveConfig).applyTo(store);

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
    expect(screen.getByRole("textbox", { name: "Database URL" })).toHaveValue(
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
    expect(screen.getByRole("textbox", { name: "Database URL" })).toHaveValue(
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

  test("lists each bad param of an invalid link on its own row", () => {
    new DbState().applyTo(getAppStore());

    renderConnect("?graphDbUrl=not-a-url&queryEngine=cypher");

    expect(problemsShown()).toStrictEqual([
      "graphDbUrl must be a valid http or https URL",
      'queryEngine must be one of "gremlin", "openCypher", "sparql"',
    ]);
    expect(
      screen.queryByRole("button", { name: "Add Connection" }),
    ).not.toBeInTheDocument();
  });

  test("does not raise a toast for an invalid link", () => {
    new DbState().applyTo(getAppStore());

    renderConnect("?graphDbUrl=not-a-url");

    expect(toast.error).not.toHaveBeenCalled();
  });

  test("stays on the invalid link card until the user continues", async () => {
    const state = new DbState();
    state.applyTo(getAppStore());
    const user = userEvent.setup();

    renderConnect("?graphDbUrl=not-a-url");

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/connect?graphDbUrl=not-a-url",
    );

    await user.click(
      screen.getByRole("button", { name: "Continue to Graph Explorer" }),
    );

    expect(screen.getByTestId("location")).toHaveTextContent("/graph-explorer");
    expect(screen.getByText("graph canvas")).toBeInTheDocument();
    expect(getAppStore().get(activeConfigurationAtom)).toBe(
      state.activeConfig.id,
    );
  });

  // With one connection the graph view is the obvious next stop; otherwise the
  // user has a connection to choose.
  test("continuing with several connections lands on the connections list", async () => {
    new DbState()
      .addInactiveConnection(createRandomRawConfiguration())
      .applyTo(getAppStore());
    const user = userEvent.setup();

    renderConnect("?graphDbUrl=not-a-url");
    await user.click(
      screen.getByRole("button", { name: "Continue to Graph Explorer" }),
    );

    expect(screen.getByTestId("location")).toHaveTextContent("/connections");
  });

  test("continuing with no connections lands on the connections list", async () => {
    new DbState().applyTo(getAppStore());
    getAppStore().set(configurationAtom, new Map());
    const user = userEvent.setup();

    renderConnect("?graphDbUrl=not-a-url");
    await user.click(
      screen.getByRole("button", { name: "Continue to Graph Explorer" }),
    );

    expect(screen.getByTestId("location")).toHaveTextContent("/connections");
  });

  // Continuing replaces the link, so going back can't reopen the card.
  test("continuing from an invalid link leaves no way back to it", async () => {
    new DbState().applyTo(getAppStore());
    const user = userEvent.setup();

    renderConnect("?graphDbUrl=not-a-url");
    await user.click(
      screen.getByRole("button", { name: "Continue to Graph Explorer" }),
    );
    await user.click(screen.getByRole("button", { name: "go back" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/graph-explorer");
  });

  test("a link opened over the invalid link card is resolved", async () => {
    new DbState().applyTo(getAppStore());
    const user = userEvent.setup();

    renderConnect(
      "?graphDbUrl=not-a-url",
      searchFor("https://next.neptune.amazonaws.com"),
    );
    expect(screen.getByText("Invalid connection link")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "open next link" }));

    expect(screen.queryByText("Invalid connection link")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Add Connection" }),
    ).toBeInTheDocument();
  });
});
