import {
  createRandomConnectionWithId,
  createRandomEdgeId,
  createRandomExportedGraphConnection,
  createRandomVertexId,
} from "@/utils/testing";
import {
  createExportedConnection,
  createExportedGraph,
  ExportedGraph,
  ExportedGraphConnection,
  isMatchingConnection,
} from "./exportedGraph";
import {
  createArray,
  createRandomDate,
  createRandomInteger,
  createRandomUrlString,
} from "@shared/utils/testing";

describe("createExportedGraph", () => {
  let timestamp: Date;
  let appVersion: string;

  beforeEach(() => {
    // tell vitest we use mocked time
    vi.useFakeTimers();

    // set the system time to a random Date
    timestamp = createRandomDate();
    vi.setSystemTime(timestamp);

    // set a random app version
    appVersion = `${createRandomInteger()}.${createRandomInteger()}.${createRandomInteger()}`;
    vi.stubGlobal("__GRAPH_EXP_VERSION__", appVersion);
  });

  afterEach(() => {
    // restoring date after each test run
    vi.useRealTimers();
  });

  it("should create an exported graph from a vertex and edge ids", () => {
    const vertexIds = createArray(3, () => createRandomVertexId());
    const edgeIds = createArray(3, () => createRandomEdgeId());
    const connection = createRandomConnectionWithId();
    const expectedConnection = createExportedConnection(connection);
    const expectedMeta = {
      kind: "graph-export",
      version: "1.0",
      timestamp: timestamp,
      source: "Graph Explorer",
      sourceVersion: appVersion,
    } satisfies ExportedGraph["meta"];

    const graph = createExportedGraph(vertexIds, edgeIds, connection);

    expect(graph.meta).toEqual(expectedMeta);
    expect(graph.data.connection).toEqual(expectedConnection);
    expect(graph.data.vertices).toEqual(vertexIds);
    expect(graph.data.edges).toEqual(edgeIds);
  });
});

describe("createExportedConnection", () => {
  it("should map graphDbUrl when using proxy server", () => {
    const connection = createRandomConnectionWithId();
    connection.proxyConnection = true;
    connection.graphDbUrl = createRandomUrlString();

    const exportedConnection = createExportedConnection(connection);

    expect(exportedConnection).toEqual({
      dbUrl: connection.graphDbUrl,
      queryEngine: connection.queryEngine!,
    } satisfies ExportedGraphConnection);
  });

  it("should map url when not using proxy server", () => {
    const connection = createRandomConnectionWithId();
    connection.proxyConnection = false;

    const exportedConnection = createExportedConnection(connection);

    expect(exportedConnection).toEqual({
      dbUrl: connection.url,
      queryEngine: connection.queryEngine!,
    } satisfies ExportedGraphConnection);
  });

  it("should default to gremlin when no query engine is provided", () => {
    const connection = createRandomConnectionWithId();
    connection.proxyConnection = true;
    connection.graphDbUrl = createRandomUrlString();
    delete connection.queryEngine;

    const exportedConnection = createExportedConnection(connection);

    expect(exportedConnection).toEqual({
      dbUrl: connection.graphDbUrl,
      queryEngine: "gremlin",
    } satisfies ExportedGraphConnection);
  });
});

describe("isMatchingConnection", () => {
  it("should return true when connection matches", () => {
    const connection = createRandomConnectionWithId();
    const exportedConnection = createExportedConnection(connection);

    expect(isMatchingConnection(connection, exportedConnection)).toBeTruthy();
  });

  it("should return false when completely different", () => {
    const connection = createRandomConnectionWithId();
    const exportedConnection = createRandomExportedGraphConnection();

    expect(isMatchingConnection(connection, exportedConnection)).toBeFalsy();
  });

  it("should return false when query engine is different", () => {
    const connection = createRandomConnectionWithId();
    connection.queryEngine = "gremlin";
    const exportedConnection = createExportedConnection({
      ...connection,
      queryEngine: "sparql",
    });

    expect(isMatchingConnection(connection, exportedConnection)).toBeFalsy();
  });

  it("should return false when graph db url is different", () => {
    const connection = createRandomConnectionWithId();
    connection.proxyConnection = true;
    connection.graphDbUrl = createRandomUrlString();
    const exportedConnection = createRandomExportedGraphConnection();
    exportedConnection.dbUrl = connection.url;
    exportedConnection.queryEngine = connection.queryEngine!;

    expect(isMatchingConnection(connection, exportedConnection)).toBeFalsy();
  });

  it("should return false when url is different", () => {
    const connection = createRandomConnectionWithId();
    connection.proxyConnection = false;
    const exportedConnection = createRandomExportedGraphConnection();
    exportedConnection.dbUrl = createRandomUrlString();
    exportedConnection.queryEngine = connection.queryEngine!;

    expect(isMatchingConnection(connection, exportedConnection)).toBeFalsy();
  });
});
