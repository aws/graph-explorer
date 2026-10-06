// @vitest-environment happy-dom
import type { LegacyConnectionConfig } from "@shared/types";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import type { SavedConnection } from "@/connections";

import { TooltipProvider } from "@/components";
import {
  activeConnectionIdAtom,
  savedConnectionsAtom,
  getAppStore,
  nodesAtom,
  toNodeMap,
} from "@/core";
import { createQueryClient } from "@/core/queryClient";
import {
  createRandomSavedConnection,
  createRandomVertex,
  preloadSavedConnection,
} from "@/utils/testing";
import { TestProvider } from "@/utils/testing";

import { ConnectionRow } from "./ConnectionRow";

describe("ConnectionRow", () => {
  test("clicking the already-active connection does not reset session state", async () => {
    const user = userEvent.setup();
    const store = getAppStore();
    const connection = createRandomSavedConnection();
    const vertex = createRandomVertex();

    store.set(savedConnectionsAtom, new Map([[connection.id, connection]]));
    store.set(activeConnectionIdAtom, connection.id);
    store.set(nodesAtom, toNodeMap([vertex]));

    const queryClient = createQueryClient();

    render(
      <TestProvider client={queryClient} store={store}>
        <TooltipProvider>
          <ConnectionRow
            connection={connection}
            isSelected={true}
            isDisabled={false}
          />
        </TooltipProvider>
      </TestProvider>,
    );

    const row = screen.getByText(connection.displayLabel || connection.id);
    await user.click(row);

    const nodesAfterClick = store.get(nodesAtom);
    expect(nodesAfterClick.size).toBe(1);
    expect(nodesAfterClick.get(vertex.id)).toBeDefined();
  });

  test("clicking a different connection resets session state", async () => {
    const user = userEvent.setup();
    const store = getAppStore();
    const activeConnection = createRandomSavedConnection();
    const otherConnection = createRandomSavedConnection();
    const vertex = createRandomVertex();

    store.set(
      savedConnectionsAtom,
      new Map([
        [activeConnection.id, activeConnection],
        [otherConnection.id, otherConnection],
      ]),
    );
    store.set(activeConnectionIdAtom, activeConnection.id);
    store.set(nodesAtom, toNodeMap([vertex]));

    const queryClient = createQueryClient();

    render(
      <TestProvider client={queryClient} store={store}>
        <TooltipProvider>
          <ConnectionRow
            connection={otherConnection}
            isSelected={false}
            isDisabled={false}
          />
        </TooltipProvider>
      </TestProvider>,
    );

    const row = screen.getByText(
      otherConnection.displayLabel || otherConnection.id,
    );
    await user.click(row);

    const nodesAfterClick = store.get(nodesAtom);
    expect(nodesAfterClick.size).toBe(0);
  });

  // Regression: `savedConnectionsAtom`'s read-time transform migrates a legacy
  // `url`/`proxyConnection` connection to `graphDbUrl` before any consumer
  // sees it, so a row for a pre-upgrade connection still shows its endpoint.
  test("renders the endpoint for a legacy stored connection", async () => {
    const store = getAppStore();
    const legacyConfig = {
      ...createRandomSavedConnection(),
      // Stored data is not schema-validated on read, so an entry can carry a
      // legacy connection despite the compile-time `ConnectionConfig` shape.
      connection: {
        url: "https://my-neptune:8182",
        proxyConnection: false,
      } as LegacyConnectionConfig as SavedConnection["connection"],
    };
    const connection = await preloadSavedConnection(legacyConfig);
    expect.assert(connection);

    const queryClient = createQueryClient();

    render(
      <TestProvider client={queryClient} store={store}>
        <TooltipProvider>
          <ConnectionRow
            connection={connection}
            isSelected={false}
            isDisabled={false}
          />
        </TooltipProvider>
      </TestProvider>,
    );

    expect(screen.getByText(/my-neptune:8182/)).toBeInTheDocument();
  });

  function renderRow(connection: SavedConnection) {
    render(
      <TestProvider client={createQueryClient()} store={getAppStore()}>
        <TooltipProvider>
          <ConnectionRow
            connection={connection}
            isSelected={false}
            isDisabled={false}
          />
        </TooltipProvider>
      </TestProvider>,
    );
  }

  test.each([
    { name: "direct", route: { proxyConnection: false } },
    { name: "proxy", route: {} },
  ])(
    "shows the language and URL without a route mark on a $name connection",
    ({ route }) => {
      renderRow({
        ...createRandomSavedConnection(),
        connection: { graphDbUrl: "https://my-neptune:8182", ...route },
      });

      expect(
        screen.getByText(/^PG-Gremlin • https:\/\/my-neptune:8182$/),
      ).toBeInTheDocument();
    },
  );
});
