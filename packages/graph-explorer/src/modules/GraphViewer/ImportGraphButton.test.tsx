import {
  createRandomEntities,
  createRandomExportedGraphConnection,
  createRandomFile,
  createRandomRawConfiguration,
} from "@/utils/testing";
import {
  createCompletionNotification,
  createErrorNotification,
  FetchEntityDetailsResult,
  InvalidConnectionError,
} from "./ImportGraphButton";
import { createArray, createRandomInteger } from "@shared/utils/testing";
import { ZodError } from "zod";

describe("createCompletionNotification", () => {
  it("should create a completion notification with 1 node and 1 edge", () => {
    const fetchResult = createRandomFetchEntityDetailsResult();
    fetchResult.entities.vertices = fetchResult.entities.vertices.slice(0, 1);
    fetchResult.entities.edges = fetchResult.entities.edges.slice(0, 1);

    const notification = createCompletionNotification(fetchResult);

    expect(notification.type).toBe("success");
    expect(notification.message).toBe(
      "Finished loading 1 node and 1 edge from the graph file."
    );
  });

  it("should create a completion notification with multiple nodes and edges", () => {
    const fetchResult = createRandomFetchEntityDetailsResult();
    const nodeCount = fetchResult.entities.vertices.length.toLocaleString();
    const edgeCount = fetchResult.entities.edges.length.toLocaleString();
    const notification = createCompletionNotification(fetchResult);

    expect(notification.type).toBe("success");
    expect(notification.message).toBe(
      `Finished loading ${nodeCount} nodes and ${edgeCount} edges from the graph file.`
    );
  });

  it("should create a completion notification when some nodes and edges were not found", () => {
    const fetchResult = createRandomFetchEntityDetailsResult();
    fetchResult.counts.notFound.vertices = createRandomInteger();
    fetchResult.counts.notFound.edges = createRandomInteger();
    fetchResult.counts.notFound.total =
      fetchResult.counts.notFound.vertices + fetchResult.counts.notFound.edges;
    const nodeCount = fetchResult.counts.notFound.vertices.toLocaleString();
    const edgeCount = fetchResult.counts.notFound.edges.toLocaleString();

    const notification = createCompletionNotification(fetchResult);

    expect(notification.type).toBe("info");
    expect(notification.message).toBe(
      `Finished loading the graph, but ${nodeCount} nodes and ${edgeCount} edges were not found.`
    );
  });

  it("should create a completion notification when exactly 1 node was not found", () => {
    const fetchResult = createRandomFetchEntityDetailsResult();
    fetchResult.counts.notFound.vertices = 1;
    fetchResult.counts.notFound.edges = 0;
    fetchResult.counts.notFound.total =
      fetchResult.counts.notFound.vertices + fetchResult.counts.notFound.edges;

    const notification = createCompletionNotification(fetchResult);

    expect(notification.type).toBe("info");
    expect(notification.message).toBe(
      `Finished loading the graph, but 1 node was not found.`
    );
  });

  it("should create a completion notification when exactly 1 edge was not found", () => {
    const fetchResult = createRandomFetchEntityDetailsResult();
    fetchResult.counts.notFound.vertices = 0;
    fetchResult.counts.notFound.edges = 1;
    fetchResult.counts.notFound.total =
      fetchResult.counts.notFound.vertices + fetchResult.counts.notFound.edges;

    const notification = createCompletionNotification(fetchResult);

    expect(notification.type).toBe("info");
    expect(notification.message).toBe(
      `Finished loading the graph, but 1 edge was not found.`
    );
  });

  it("should create a completion notification when all nodes and edges were not found", () => {
    const fetchResult = createRandomFetchEntityDetailsResult();
    fetchResult.entities.vertices = [];
    fetchResult.entities.edges = [];
    fetchResult.counts.notFound.vertices = createRandomInteger();
    fetchResult.counts.notFound.edges = createRandomInteger();
    fetchResult.counts.notFound.total =
      fetchResult.counts.notFound.vertices + fetchResult.counts.notFound.edges;
    const nodeCount = fetchResult.counts.notFound.vertices.toLocaleString();
    const edgeCount = fetchResult.counts.notFound.edges.toLocaleString();

    const notification = createCompletionNotification(fetchResult);

    expect(notification.type).toBe("info");
    expect(notification.message).toBe(
      `Finished loading the graph, but ${nodeCount} nodes and ${edgeCount} edges were not found.`
    );
  });

  it("should create a completion notification when some nodes and edges had errors", () => {
    const fetchResult = createRandomFetchEntityDetailsResult();
    fetchResult.counts.errors.vertices = createRandomInteger();
    fetchResult.counts.errors.edges = createRandomInteger();
    fetchResult.counts.errors.total =
      fetchResult.counts.errors.vertices + fetchResult.counts.errors.edges;
    const nodeCount = fetchResult.counts.errors.vertices.toLocaleString();
    const edgeCount = fetchResult.counts.errors.edges.toLocaleString();

    const notification = createCompletionNotification(fetchResult);

    expect(notification.type).toBe("error");
    expect(notification.message).toBe(
      `Finished loading the graph, but ${nodeCount} nodes and ${edgeCount} edges encountered an error.`
    );
  });

  it("should create a completion notification when no nodes or edges were imported", () => {
    const fetchResult = createRandomFetchEntityDetailsResult();
    fetchResult.entities.vertices = [];
    fetchResult.entities.edges = [];
    const notification = createCompletionNotification(fetchResult);

    expect(notification.type).toBe("error");
    expect(notification.message).toBe(
      `Finished loading the graph, but no nodes or edges were loaded.`
    );
  });
});

describe("createErrorNotification", () => {
  it("should use generic error for an unrecognized error", () => {
    const error = new Error("test");
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification.type).toBe("error");
    expect(notification.message).toBe(
      "Failed to load the graph because an error occurred."
    );
  });

  it("should use parsing error for a zod error", () => {
    const error = new ZodError([]);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification.type).toBe("error");
    expect(notification.message).toBe(
      `Parsing the file "${file.name}" failed. Please ensure the file was originally saved from Graph Explorer and is not corrupt.`
    );
  });

  it("should show the db url and gremlin query engine when no match is found", () => {
    const connection = createRandomExportedGraphConnection();
    connection.queryEngine = "gremlin";
    const error = new InvalidConnectionError("test", connection);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification.type).toBe("error");
    expect(notification.message).toBe(
      `The graph file requires a connection to ${connection.dbUrl} using the graph type PG-Gremlin.`
    );
  });

  it("should show the db url and sparql query engine when no match is found", () => {
    const connection = createRandomExportedGraphConnection();
    connection.queryEngine = "sparql";
    const error = new InvalidConnectionError("test", connection);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification.type).toBe("error");
    expect(notification.message).toBe(
      `The graph file requires a connection to ${connection.dbUrl} using the graph type RDF-SPARQL.`
    );
  });

  it("should show the db url and openCypher query engine when no match is found", () => {
    const connection = createRandomExportedGraphConnection();
    connection.queryEngine = "openCypher";
    const error = new InvalidConnectionError("test", connection);
    const file = createRandomFile();
    const allConnections = createRandomAllConnections();

    const notification = createErrorNotification(error, file, allConnections);

    expect(notification.type).toBe("error");
    expect(notification.message).toBe(
      `The graph file requires a connection to ${connection.dbUrl} using the graph type PG-openCypher.`
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

    expect(notification.type).toBe("error");
    expect(notification.message).toBe(
      `The graph file requires switching to connection ${matchingConnectionName}.`
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

    expect(notification.type).toBe("error");
    expect(notification.message).toBe(
      `The graph file requires switching to connection ${matchingConnectionName}.`
    );
  });
});

function createRandomFetchEntityDetailsResult(): FetchEntityDetailsResult {
  const entities = createRandomEntities();
  return {
    entities: {
      vertices: entities.nodes.values().toArray(),
      edges: entities.edges.values().toArray(),
    },
    counts: {
      notFound: {
        vertices: 0,
        edges: 0,
        total: 0,
      },
      errors: {
        vertices: 0,
        edges: 0,
        total: 0,
      },
    },
  };
}

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
