// @vitest-environment happy-dom

import type { ConnectionConfig } from "@shared/types";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components";
import {
  type ConfigurationContextProps,
  configurationAtom,
  createEdgeConnection,
  createNewConfigurationId,
  getAppStore,
  schemaAtom,
} from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { mergeConfiguration } from "@/core/StateProvider/configuration";
import { createRandomRawConfiguration, TestProvider } from "@/utils/testing";

import CreateConnection, { mapToConnectionForm } from "./CreateConnection";

function renderCreateConnection(ui: React.ReactElement) {
  const store = getAppStore();
  store.set(configurationAtom, new Map());

  render(ui, {
    wrapper: ({ children }) => (
      <TestProvider client={createQueryClient()} store={store}>
        <TooltipProvider>{children}</TooltipProvider>
      </TestProvider>
    ),
  });

  return store;
}

/** The advanced settings are behind a disclosure, so their content is unmounted until it opens. */
async function openAdvancedOptions(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole("button", { name: "Advanced options" });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  await user.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
}

describe("CreateConnection", () => {
  test("removes newlines and surrounding whitespace from URL fields", async () => {
    const user = userEvent.setup();
    const store = renderCreateConnection(
      <CreateConnection onClose={vi.fn()} />,
    );

    await user.type(
      screen.getByRole("textbox", { name: "Public or Proxy Endpoint" }),
      "  https://proxy.example.com/{Enter}path  ",
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Using Proxy-Server" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Graph Connection URL" }),
      "  https://database.example.com/{Enter}graph  ",
    );
    await user.click(screen.getByRole("button", { name: "Add Connection" }));

    await waitFor(() => {
      expect(store.get(configurationAtom)).toHaveLength(1);
    });

    const [savedConnection] = store.get(configurationAtom).values();
    expect(savedConnection).toMatchObject({
      connection: {
        url: "https://proxy.example.com/path",
        graphDbUrl: "https://database.example.com/graph",
      },
    });
  });

  test("saves the edge connection discovery choice, writing auto rather than leaving it absent", async () => {
    const user = userEvent.setup();
    const store = renderCreateConnection(
      <CreateConnection onClose={vi.fn()} />,
    );

    await user.type(
      screen.getByRole("textbox", { name: "Public or Proxy Endpoint" }),
      "https://proxy.example.com",
    );
    await user.click(screen.getByRole("button", { name: "Add Connection" }));

    await waitFor(() => {
      expect(store.get(configurationAtom)).toHaveLength(1);
    });

    const [savedConnection] = store.get(configurationAtom).values();
    expect(savedConnection.connection?.edgeConnectionDiscovery).toBe("auto");
  });

  test("lets the user force sampled edge connection discovery", async () => {
    const user = userEvent.setup();
    const store = renderCreateConnection(
      <CreateConnection onClose={vi.fn()} />,
    );

    await user.type(
      screen.getByRole("textbox", { name: "Public or Proxy Endpoint" }),
      "https://proxy.example.com",
    );
    await openAdvancedOptions(user);
    await user.click(screen.getByRole("radio", { name: "Sampled" }));
    await user.click(screen.getByRole("button", { name: "Add Connection" }));

    await waitFor(() => {
      expect(store.get(configurationAtom)).toHaveLength(1);
    });

    const [savedConnection] = store.get(configurationAtom).values();
    expect(savedConnection.connection?.edgeConnectionDiscovery).toBe("sampled");
  });

  test("names each discovery option by its title and exposes the rest as a description", async () => {
    const user = userEvent.setup();
    renderCreateConnection(<CreateConnection onClose={vi.fn()} />);
    await openAdvancedOptions(user);

    // The whole card is a label so any part of it is clickable, which would
    // otherwise fold the description into each option's accessible name and
    // re-read the full sentence on every arrow key.
    for (const name of ["Automatic", "Complete", "Sampled"]) {
      const option = screen.getByRole("radio", { name });
      expect(option).toHaveAccessibleName(name);
      expect(option).toHaveAccessibleDescription(/edge/);
    }
  });

  test("hides edge connection discovery for query languages that do not use it", async () => {
    const user = userEvent.setup();
    renderCreateConnection(<CreateConnection onClose={vi.fn()} />);
    await openAdvancedOptions(user);

    expect(
      screen.getByRole("radiogroup", { name: "Edge Connection Discovery" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /SPARQL/ }));

    expect(
      screen.queryByRole("radiogroup", { name: "Edge Connection Discovery" }),
    ).not.toBeInTheDocument();
  });

  test("discards the discovered edge connections when the discovery setting changes", async () => {
    const user = userEvent.setup();
    const configId = createNewConfigurationId();
    const store = getAppStore();
    const connection: ConnectionConfig = {
      url: "https://proxy.example.com",
      // Spelled out so saving does not look like a connection change, which
      // would wipe the whole schema and hide what this test is checking.
      graphDbUrl: "",
      queryEngine: "gremlin",
      edgeConnectionDiscovery: "auto",
    };
    store.set(
      configurationAtom,
      new Map([[configId, { id: configId, connection }]]),
    );
    store.set(
      schemaAtom,
      new Map([
        [
          configId,
          {
            vertices: [],
            edges: [],
            edgeConnections: [
              createEdgeConnection({
                source: "airport",
                edge: "route",
                target: "airport",
              }),
            ],
            lastEdgeConnectionSyncFail: true,
          },
        ],
      ]),
    );

    render(
      <TestProvider client={createQueryClient()} store={store}>
        <TooltipProvider>
          <CreateConnection
            existingConfig={
              { id: configId, connection } as ConfigurationContextProps
            }
            onClose={vi.fn()}
          />
        </TooltipProvider>
      </TestProvider>,
    );

    await openAdvancedOptions(user);
    await user.click(screen.getByRole("radio", { name: "Sampled" }));
    await user.click(screen.getByRole("button", { name: "Update Connection" }));

    await waitFor(() => {
      expect(
        store.get(schemaAtom).get(configId)?.edgeConnections,
      ).toBeUndefined();
    });
    // The failure flag suppresses the automatic retry, so it has to clear too or
    // the rediscovery would never start.
    expect(
      store.get(schemaAtom).get(configId)?.lastEdgeConnectionSyncFail,
    ).toBe(false);
  });

  test("opens the advanced options when the connection already overrides one", () => {
    const configId = createNewConfigurationId();
    const store = getAppStore();
    const connection: ConnectionConfig = {
      url: "https://proxy.example.com",
      graphDbUrl: "",
      queryEngine: "gremlin",
      edgeConnectionDiscovery: "sampled",
    };
    store.set(
      configurationAtom,
      new Map([[configId, { id: configId, connection }]]),
    );

    render(
      <TestProvider client={createQueryClient()} store={store}>
        <TooltipProvider>
          <CreateConnection
            existingConfig={
              { id: configId, connection } as ConfigurationContextProps
            }
            onClose={vi.fn()}
          />
        </TooltipProvider>
      </TestProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Advanced options" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("radio", { name: "Sampled" })).toBeChecked();
  });

  test("rejects a URL that is empty after normalization", async () => {
    const user = userEvent.setup();
    const store = renderCreateConnection(
      <CreateConnection onClose={vi.fn()} />,
    );

    await user.type(
      screen.getByRole("textbox", { name: "Public or Proxy Endpoint" }),
      "  {Enter}  ",
    );
    await user.click(screen.getByRole("button", { name: "Add Connection" }));

    expect(store.get(configurationAtom)).toHaveLength(0);
    expect(screen.getByText("URL is required")).toBeInTheDocument();
  });

  test("prefills the form from initialValues without entering edit mode", () => {
    renderCreateConnection(
      <CreateConnection
        initialValues={{
          name: "Seeded Graph",
          proxyConnection: true,
          graphDbUrl: "https://seed.neptune.amazonaws.com",
        }}
        onClose={() => {}}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue("Seeded Graph");
    expect(screen.getByLabelText("Graph Connection URL")).toHaveValue(
      "https://seed.neptune.amazonaws.com",
    );
    // Still in "add" mode, not "update"
    expect(
      screen.getByRole("button", { name: "Add Connection" }),
    ).toBeInTheDocument();
  });

  // The rest of the app shows an unlabeled connection by its id, so the form
  // should too rather than presenting it as nameless.
  test("names an unlabeled connection by its id when editing it", () => {
    const config = {
      ...createRandomRawConfiguration(),
      displayLabel: undefined,
    };

    renderCreateConnection(
      <CreateConnection
        existingConfig={{
          ...mergeConfiguration(null, config, new Map(), new Map()),
          totalVertices: 0,
          vertexTypes: [],
          totalEdges: 0,
          edgeTypes: [],
        }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue(config.id);
  });
});

describe("mapToConnectionForm", () => {
  test("maps a connection's IAM auth into form values", () => {
    const form = mapToConnectionForm("My Graph", {
      url: "https://localhost",
      queryEngine: "openCypher",
      proxyConnection: true,
      graphDbUrl: "https://g.example.com",
      awsAuthEnabled: true,
      awsRegion: "us-west-2",
      serviceType: "neptune-graph",
    });

    expect(form).toMatchObject({
      name: "My Graph",
      queryEngine: "openCypher",
      proxyConnection: true,
      graphDbUrl: "https://g.example.com",
      awsAuthEnabled: true,
      awsRegion: "us-west-2",
      serviceType: "neptune-graph",
    });
  });
});
