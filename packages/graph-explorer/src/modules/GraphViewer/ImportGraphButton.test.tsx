// @vitest-environment happy-dom
import { createArray } from "@shared/utils/testing";
import { useAtom, useAtomValue } from "jotai";
import { act } from "react";
import { ZodError } from "zod";

import {
  activeGraphSessionAtom,
  graphViewLayoutAlgorithmAtom,
  pendingGraphRestorationAtom,
} from "@/core";
import {
  createRandomExportedGraphConnection,
  createRandomFile,
  createRandomRawConfiguration,
  createRandomVertex,
  DbState,
  FakeExplorer,
  renderHookWithState,
} from "@/utils/testing";

import { createExportedGraph } from "./exportedGraph";
import {
  createErrorNotification,
  InvalidConnectionError,
  useImportGraphMutation,
} from "./ImportGraphButton";

function importFile(data: object) {
  return new File([JSON.stringify(data)], "graph.json", {
    type: "application/json",
  });
}

function setupImport() {
  const explorer = new FakeExplorer();
  const vertex = createRandomVertex();
  explorer.addVertex(vertex);
  const state = new DbState(explorer);
  const { result } = renderHookWithState(() => {
    const mutation = useImportGraphMutation();
    const [layout, setLayout] = useAtom(graphViewLayoutAlgorithmAtom);
    const [restoration, setRestoration] = useAtom(pendingGraphRestorationAtom);
    const session = useAtomValue(activeGraphSessionAtom);
    return {
      mutation,
      layout,
      setLayout,
      restoration,
      setRestoration,
      session,
    };
  }, state);
  act(() => result.current.setLayout("KLAY_LR"));
  return { explorer, vertex, result };
}

describe("useImportGraphMutation", () => {
  it("applies a valid layout after successful entity restoration", async () => {
    const { explorer, vertex, result } = setupImport();
    const exported = createExportedGraph(
      [vertex.id],
      [],
      explorer.connection,
      "DAGRE_TB",
    );

    await act(() => result.current.mutation.mutateAsync(importFile(exported)));

    expect(result.current.layout).toBe("DAGRE_TB");
  });

  it("installs a target-scoped arrangement after successful entity restoration", async () => {
    const { explorer, vertex, result } = setupImport();
    const arrangement = {
      positions: [{ id: vertex.id, x: 12, y: 34 }],
      viewport: { pan: { x: 56, y: 78 }, zoom: 2 },
    };
    const exported = createExportedGraph(
      [vertex.id],
      [],
      explorer.connection,
      "F_COSE",
      arrangement,
    );

    await act(() => result.current.mutation.mutateAsync(importFile(exported)));

    expect(result.current.restoration).toMatchObject(arrangement);
    expect(result.current.restoration?.target).toBeDefined();
  });

  it("commits a coherent session with actual restored entities and arrangement for matches", async () => {
    const { explorer, vertex, result } = setupImport();
    const missing = createRandomVertex();
    const arrangement = {
      positions: [
        { id: vertex.id, x: 12, y: 34 },
        { id: missing.id, x: 56, y: 78 },
      ],
      viewport: { pan: { x: 1, y: 2 }, zoom: 3 },
    };
    const exported = createExportedGraph(
      [vertex.id, missing.id],
      [],
      explorer.connection,
      "DAGRE_TB",
      arrangement,
    );

    await act(() => result.current.mutation.mutateAsync(importFile(exported)));

    expect(result.current.session?.vertices.size).toBe(1);
    expect(result.current.session?.vertices.has(vertex.id)).toBe(true);
    expect(result.current.session?.arrangement?.positions).toHaveLength(1);
    expect(result.current.session?.arrangement?.positions[0].id).toBe(
      vertex.id,
    );
  });

  it("does not replace pending restoration when entity restoration fails", async () => {
    const { explorer, vertex, result } = setupImport();
    const exported = createExportedGraph(
      [vertex.id],
      [],
      explorer.connection,
      "F_COSE",
      { positions: [{ id: vertex.id, x: 12, y: 34 }] },
    );
    vi.spyOn(explorer, "vertexDetails").mockRejectedValue(
      new Error("restore failed"),
    );

    await act(async () => {
      await expect(
        result.current.mutation.mutateAsync(importFile(exported)),
      ).rejects.toThrow(new Error("restore failed"));
    });

    expect(result.current.restoration).toBeNull();
  });

  it("preserves the live layout for a legacy export", async () => {
    const { explorer, vertex, result } = setupImport();
    const exported = createExportedGraph(
      [vertex.id],
      [],
      explorer.connection,
      "DAGRE_TB",
    );
    delete exported.data.layout;

    await act(() => result.current.mutation.mutateAsync(importFile(exported)));

    expect(result.current.layout).toBe("KLAY_LR");
  });

  it("preserves the live layout when the connection does not match", async () => {
    const { vertex, result } = setupImport();
    const exported = createExportedGraph(
      [vertex.id],
      [],
      new FakeExplorer().connection,
      "DAGRE_TB",
    );

    await act(async () => {
      await expect(
        result.current.mutation.mutateAsync(importFile(exported)),
      ).rejects.toBeInstanceOf(InvalidConnectionError);
    });

    expect(result.current.layout).toBe("KLAY_LR");
  });

  it("preserves the live layout when entity restoration fails", async () => {
    const { explorer, vertex, result } = setupImport();
    const exported = createExportedGraph(
      [vertex.id],
      [],
      explorer.connection,
      "DAGRE_TB",
    );
    vi.spyOn(explorer, "vertexDetails").mockRejectedValue(
      new Error("restore failed"),
    );

    await act(async () => {
      await expect(
        result.current.mutation.mutateAsync(importFile(exported)),
      ).rejects.toThrow(new Error("restore failed"));
    });

    expect(result.current.layout).toBe("KLAY_LR");
  });
});

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

  it("should show the connection name when a connection using the proxy server is a match", () => {
    const connection = createRandomExportedGraphConnection();
    const error = new InvalidConnectionError("test", connection);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();
    allConnections[0].graphDbUrl = connection.dbUrl;
    allConnections[0].proxyConnection = true;
    allConnections[0].queryEngine = connection.queryEngine;
    const matchingConnectionName = allConnections[0].displayLabel;

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      `The graph file requires switching to connection ${matchingConnectionName}.`,
    );
  });

  it("should show the connection name when a connection not using the proxy server is a match", () => {
    const connection = createRandomExportedGraphConnection();
    const error = new InvalidConnectionError("test", connection);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();
    allConnections[0].url = connection.dbUrl;
    allConnections[0].proxyConnection = false;
    allConnections[0].queryEngine = connection.queryEngine;
    const matchingConnectionName = allConnections[0].displayLabel;

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification).toBe(
      `The graph file requires switching to connection ${matchingConnectionName}.`,
    );
  });
});

function createRandomAllConnections() {
  return createArray(3, () => {
    const config = createRandomRawConfiguration();
    return {
      ...config.connection!,
      id: config.id,
      displayLabel: config.displayLabel,
    };
  });
}
