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
import { TestProvider } from "@/utils/testing";

import CreateConnection from "./CreateConnection";

function renderCreateConnection() {
  const store = getAppStore();
  store.set(configurationAtom, new Map());

  render(
    <TestProvider client={createQueryClient()} store={store}>
      <TooltipProvider>
        <CreateConnection onClose={vi.fn()} />
      </TooltipProvider>
    </TestProvider>,
  );

  return store;
}

describe("CreateConnection", () => {
  test("removes newlines and surrounding whitespace from URL fields", async () => {
    const user = userEvent.setup();
    const store = renderCreateConnection();

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
    const store = renderCreateConnection();

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
    const store = renderCreateConnection();

    await user.type(
      screen.getByRole("textbox", { name: "Public or Proxy Endpoint" }),
      "https://proxy.example.com",
    );
    await user.click(screen.getByRole("radio", { name: /Sampled/ }));
    await user.click(screen.getByRole("button", { name: "Add Connection" }));

    await waitFor(() => {
      expect(store.get(configurationAtom)).toHaveLength(1);
    });

    const [savedConnection] = store.get(configurationAtom).values();
    expect(savedConnection.connection?.edgeConnectionDiscovery).toBe("sampled");
  });

  test("hides edge connection discovery for query languages that do not use it", async () => {
    const user = userEvent.setup();
    renderCreateConnection();

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

    await user.click(screen.getByRole("radio", { name: /Sampled/ }));
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

  test("rejects a URL that is empty after normalization", async () => {
    const user = userEvent.setup();
    const store = renderCreateConnection();

    await user.type(
      screen.getByRole("textbox", { name: "Public or Proxy Endpoint" }),
      "  {Enter}  ",
    );
    await user.click(screen.getByRole("button", { name: "Add Connection" }));

    expect(store.get(configurationAtom)).toHaveLength(0);
    expect(screen.getByText("URL is required")).toBeInTheDocument();
  });
});
