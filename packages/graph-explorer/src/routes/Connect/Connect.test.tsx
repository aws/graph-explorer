// @vitest-environment happy-dom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router";
import { toast } from "sonner";

import { TooltipProvider } from "@/components";
import { type ConfigurationId, getAppStore } from "@/core";
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

function searchFor(graphDbUrl: string, queryEngine = "gremlin") {
  return `?graphDbUrl=${encodeURIComponent(graphDbUrl)}&queryEngine=${queryEngine}`;
}

function renderConnect(search: string) {
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
        </Routes>
        <LocationDisplay />
      </TooltipProvider>
    </TestProvider>,
  );
  return store;
}

function seedInactiveConnection(store: ReturnType<typeof getAppStore>) {
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
  test("redirects to the graph canvas when there are no params", () => {
    new DbState().applyTo(getAppStore());

    renderConnect("");

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
      `${searchFor("https://brand-new.neptune.amazonaws.com")}&name=Brand+New`,
    );

    expect(
      screen.getByRole("button", { name: "Add Connection" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Brand New");
    // The dialog explains the connection details came from the user's link
    expect(screen.getByText(/details from your link/i)).toBeInTheDocument();
  });

  // The form is the page, not a layer over it, so it renders in place and
  // leaves the rest of the page usable.
  test("renders the create form in the page rather than as a modal", () => {
    new DbState().applyTo(getAppStore());

    renderConnect(searchFor("https://brand-new.neptune.amazonaws.com"));

    const form = screen.getByRole("dialog", {
      name: "Create connection from link",
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
      screen.getByRole("dialog", { name: "Create connection from link" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/connect");
  });

  test("pressing Escape cancels without creating and lands on the graph canvas", async () => {
    const user = userEvent.setup();
    new DbState().applyTo(getAppStore());
    const store = getAppStore();
    const connectionsBefore = store.get(configurationAtom).size;

    renderConnect(searchFor("https://brand-new.neptune.amazonaws.com"));
    await user.keyboard("{Escape}");

    expect(await screen.findByText("graph canvas")).toBeInTheDocument();
    expect(store.get(configurationAtom).size).toBe(connectionsBefore);
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
