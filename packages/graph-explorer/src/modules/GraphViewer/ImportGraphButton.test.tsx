// @vitest-environment happy-dom

import type { LegacyConnectionConfig } from "@shared/types";

import { createArray } from "@shared/utils/testing";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";
import { ZodError } from "zod";

import type { SavedConnection } from "@/connections";
import type { LayoutName } from "@/core/graphLayout";

import { TooltipProvider } from "@/components";
import * as Connector from "@/connector";
import { getAppStore, graphViewLayoutAlgorithmAtom } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { logger } from "@/utils";
import {
  createRandomExportedGraphConnection,
  createRandomFile,
  createRandomGraphViewLayout,
  createRandomSavedConnection,
  DbState,
  preloadSavedConnection,
  TestProvider,
} from "@/utils/testing";

import { createExportedGraph } from "./exportedGraph";
import {
  createErrorNotification,
  ImportGraphButton,
  InvalidConnectionError,
} from "./ImportGraphButton";

describe("createErrorNotification", () => {
  it("should use generic error for an unrecognized error", () => {
    const error = new Error("test");
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      "Failed to load the graph because an error occurred.",
    );
  });

  it("should use parsing error for a zod error", () => {
    const error = new ZodError([]);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      `Parsing the file "${file.name}" failed. Please ensure the file was originally saved from Graph Explorer and is not corrupt.`,
    );
  });

  it("should show the db url and gremlin query engine when no match is found", () => {
    const connection = createRandomExportedGraphConnection();
    connection.queryEngine = "gremlin";
    const error = new InvalidConnectionError("test", connection);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      `The graph file requires a connection to ${connection.dbUrl} using the query language PG-Gremlin.`,
    );
  });

  it("should show the db url and sparql query engine when no match is found", () => {
    const connection = createRandomExportedGraphConnection();
    connection.queryEngine = "sparql";
    const error = new InvalidConnectionError("test", connection);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      `The graph file requires a connection to ${connection.dbUrl} using the query language RDF-SPARQL.`,
    );
  });

  it("should show the db url and openCypher query engine when no match is found", () => {
    const connection = createRandomExportedGraphConnection();
    connection.queryEngine = "openCypher";
    const error = new InvalidConnectionError("test", connection);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      `The graph file requires a connection to ${connection.dbUrl} using the query language PG-openCypher.`,
    );
  });

  it("should show the connection name when a connection is a match", () => {
    const connection = createRandomExportedGraphConnection();
    const error = new InvalidConnectionError("test", connection);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();
    allConnections[0].graphDbUrl = connection.dbUrl;
    allConnections[0].queryEngine = connection.queryEngine;
    const matchingConnectionName = allConnections[0].displayLabel;

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      `The graph file requires switching to connection ${matchingConnectionName}.`,
    );
  });

  // Regression: `savedConnectionsAtom`'s read-time transform migrates a legacy
  // `url`/`proxyConnection` connection to `graphDbUrl` before
  // `useImportGraphMutation` reads it, so matching against a pre-upgrade
  // connection still finds it instead of reporting no match.
  it("should show the connection name when a match is found via a legacy stored connection", async () => {
    const legacyConfig: SavedConnection = {
      ...createRandomSavedConnection(),
      // Stored data is not schema-validated on read, so an entry can carry a
      // legacy connection despite the compile-time `ConnectionConfig` shape.
      connection: {
        url: "https://my-neptune:8182",
        proxyConnection: false,
      } as LegacyConnectionConfig as SavedConnection["connection"],
    };
    const migratedConfig = await preloadSavedConnection(legacyConfig);
    expect.assert(migratedConfig);

    const allConnections = createRandomAllConnections();
    allConnections[0] = {
      ...migratedConfig.connection!,
      id: migratedConfig.id,
      displayLabel: migratedConfig.displayLabel,
    };

    const connection = createRandomExportedGraphConnection();
    connection.dbUrl = "https://my-neptune:8182";
    // The legacy connection carries no queryEngine, so matching falls back to
    // "gremlin" (see `createExportedConnection`).
    connection.queryEngine = "gremlin";
    const error = new InvalidConnectionError("test", connection);
    const file = createRandomFile();

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      `The graph file requires switching to connection ${allConnections[0].displayLabel}.`,
    );
  });
});

function createRandomAllConnections() {
  return createArray(3, () => {
    const config = createRandomSavedConnection();
    return {
      ...config.connection!,
      id: config.id,
      displayLabel: config.displayLabel,
    };
  });
}

function renderButton() {
  const state = new DbState().withGraphViewLayout({
    ...createRandomGraphViewLayout(),
    layoutAlgorithm: "DAGRE_LR",
  });
  const store = getAppStore();
  state.applyTo(store);
  render(
    <TestProvider client={createQueryClient()} store={store}>
      <TooltipProvider>
        <ImportGraphButton />
      </TooltipProvider>
    </TestProvider>,
  );
  return { state, store };
}

function graphFile(state: DbState, layout: LayoutName) {
  const graph = createExportedGraph([], [], state.explorer.connection, layout);
  return toFile(graph);
}

function graphFileWithoutLayout(state: DbState) {
  const graph = createExportedGraph(
    [],
    [],
    state.explorer.connection,
    "F_COSE",
  );
  const { layout: _dropped, ...dataWithoutLayout } = graph.data;
  return toFile({ ...graph, data: dataWithoutLayout });
}

function toFile(graph: object) {
  return new File([JSON.stringify(graph)], "graph.json", {
    type: "application/json",
  });
}

function fileInput() {
  // eslint-disable-next-line testing-library/no-node-access
  return document.querySelector<HTMLInputElement>('input[type="file"]')!;
}

describe("ImportGraphButton", () => {
  it("applies the file's layout once its entities load", async () => {
    vi.spyOn(Connector, "fetchEntityDetails").mockResolvedValue({
      entities: { vertices: [], edges: [] },
      counts: { notFound: { vertices: 0, edges: 0, total: 0 } },
    });
    const user = userEvent.setup();
    const { state, store } = renderButton();

    await user.upload(fileInput(), graphFile(state, "CONCENTRIC"));

    await waitFor(() =>
      expect(store.get(graphViewLayoutAlgorithmAtom)).toBe("CONCENTRIC"),
    );
  });

  it("keeps the current layout when the file has none", async () => {
    vi.spyOn(Connector, "fetchEntityDetails").mockResolvedValue({
      entities: { vertices: [], edges: [] },
      counts: { notFound: { vertices: 0, edges: 0, total: 0 } },
    });
    const user = userEvent.setup();
    const { state, store } = renderButton();

    const restored = vi.spyOn(Connector, "notifyOnIncompleteRestoration");

    await user.upload(fileInput(), graphFileWithoutLayout(state));

    await waitFor(() => expect(restored).toHaveBeenCalled());
    expect(store.get(graphViewLayoutAlgorithmAtom)).toBe("DAGRE_LR");
  });

  it("leaves the layout unchanged when the file's entities fail to load", async () => {
    vi.spyOn(Connector, "fetchEntityDetails").mockRejectedValue(
      new Error("fetch failed"),
    );
    const user = userEvent.setup();
    const { state, store } = renderButton();

    await user.upload(fileInput(), graphFile(state, "CONCENTRIC"));

    await waitFor(() => expect(logger.error).toHaveBeenCalled());
    expect(store.get(graphViewLayoutAlgorithmAtom)).toBe("DAGRE_LR");
  });
});
