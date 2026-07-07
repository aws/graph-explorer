import {
  createArray,
  createRandomDate,
  createRandomInteger,
  createRandomName,
  createRandomUrlString,
} from "@shared/utils/testing";

import type { EdgeId, VertexId } from "@/core";

import { escapeString } from "@/utils";
import {
  createRandomConnectionWithId,
  createRandomEdgeId,
  createRandomExportedGraph,
  createRandomExportedGraphConnection,
  createRandomExportedGraphForRdf,
  createRandomVertexId,
} from "@/utils/testing";

import {
  createDefaultFileName,
  createExportedConnection,
  createExportedGraph,
  createFileSafeTimestamp,
  type ExportedGraphConnection,
  type ExportedGraphFile,
  isMatchingConnection,
  parseExportedGraph,
  parseGraphExportPayloadForVersion,
} from "./exportedGraph";

/**
 * Wraps an exported-graph object in a Blob, as the file entry point expects.
 * Accepts a loosened `meta` so tests can build deliberately off-contract files
 * (wrong kind, malformed version) without per-call casts.
 */
function toGraphFileBlob(graph: {
  meta: Record<string, unknown>;
  data: unknown;
}): Blob {
  return new Blob([JSON.stringify(graph)], { type: "application/json" });
}

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
      timestamp: timestamp.toISOString(),
      source: "Graph Explorer",
      sourceVersion: appVersion,
    } satisfies ExportedGraphFile["meta"];

    const graph = createExportedGraph(vertexIds, edgeIds, connection);

    expect(graph.meta).toEqual(expectedMeta);
    expect(graph.data.connection).toEqual(expectedConnection);
    expect(graph.data.vertices).toEqual(vertexIds);
    expect(graph.data.edges).toEqual(edgeIds);
  });

  it("stamps the generation-1 version as the '1.0' decimal string", () => {
    // Builds that predate the integer version switch validate `meta.version`
    // as the literal `"1.0"`. Writing the integer `1` would make files this
    // build exports fail to import on those older builds, so generation 1 must
    // stay on the wire as the decimal string.
    const connection = createRandomConnectionWithId();

    const graph = createExportedGraph([], [], connection);

    expect(graph.meta.version).toBe("1.0");
  });

  it("should create an exported graph with empty vertices and edges", () => {
    const connection = createRandomConnectionWithId();
    const expectedConnection = createExportedConnection(connection);

    const graph = createExportedGraph([], [], connection);

    expect(graph.data.connection).toEqual(expectedConnection);
    expect(graph.data.vertices).toEqual([]);
    expect(graph.data.edges).toEqual([]);
  });

  it("should use current timestamp when creating graph", () => {
    const vertexIds = createArray(2, () => createRandomVertexId());
    const edgeIds = createArray(2, () => createRandomEdgeId());
    const connection = createRandomConnectionWithId();

    const graph = createExportedGraph(vertexIds, edgeIds, connection);

    expect(graph.meta.timestamp).toEqual(timestamp.toISOString());
  });

  it("should use app version from global variable", () => {
    const vertexIds = createArray(2, () => createRandomVertexId());
    const edgeIds = createArray(2, () => createRandomEdgeId());
    const connection = createRandomConnectionWithId();

    const graph = createExportedGraph(vertexIds, edgeIds, connection);

    expect(graph.meta.sourceVersion).toBe(appVersion);
  });

  it("should set meta kind to graph-export", () => {
    const vertexIds = createArray(2, () => createRandomVertexId());
    const edgeIds = createArray(2, () => createRandomEdgeId());
    const connection = createRandomConnectionWithId();

    const graph = createExportedGraph(vertexIds, edgeIds, connection);

    expect(graph.meta.kind).toBe("graph-export");
  });

  it("should set meta source to Graph Explorer", () => {
    const vertexIds = createArray(2, () => createRandomVertexId());
    const edgeIds = createArray(2, () => createRandomEdgeId());
    const connection = createRandomConnectionWithId();

    const graph = createExportedGraph(vertexIds, edgeIds, connection);

    expect(graph.meta.source).toBe("Graph Explorer");
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

describe("parseExportedGraph", () => {
  it("should parse exported graph for property graphs", async () => {
    const exportedGraph = createRandomExportedGraph();
    const expected = {
      connection: exportedGraph.data.connection,
      vertices: new Set(exportedGraph.data.vertices),
      edges: new Set(exportedGraph.data.edges),
    };
    const parsed = await parseExportedGraph(toGraphFileBlob(exportedGraph));
    expect(parsed).toEqual(expected);
  });

  it("should parse exported graph for RDF", async () => {
    const exportedGraph = createRandomExportedGraphForRdf();
    const expected = {
      connection: exportedGraph.data.connection,
      vertices: new Set(exportedGraph.data.vertices),
      edges: new Set(exportedGraph.data.edges),
    };
    const parsed = await parseExportedGraph(toGraphFileBlob(exportedGraph));
    expect(parsed).toEqual(expected);
  });

  it("should skip empty IDs", async () => {
    const exportedGraph = createRandomExportedGraph();
    exportedGraph.data.vertices.push("");
    exportedGraph.data.edges.push("");

    const parsed = await parseExportedGraph(toGraphFileBlob(exportedGraph));

    expect(parsed.vertices.has("" as VertexId)).toBeFalsy();
    expect(parsed.edges.has("" as EdgeId)).toBeFalsy();
  });

  it("should allow number IDs", async () => {
    const exportedGraph = createRandomExportedGraph();
    const vertexId = createRandomInteger();
    const edgeId = createRandomInteger();
    exportedGraph.data.vertices.push(vertexId);
    exportedGraph.data.edges.push(edgeId);

    const parsed = await parseExportedGraph(toGraphFileBlob(exportedGraph));

    expect(parsed.vertices.has(vertexId as VertexId)).toBeTruthy();
    expect(parsed.edges.has(edgeId as EdgeId)).toBeTruthy();
  });

  it("should escape strings with double quotes", async () => {
    const exportedGraph = createRandomExportedGraph();
    const maliciousVertexId = `${createRandomName("VertexId")}").constant("Hello, World!"`;
    const maliciousEdgeId = `${createRandomName("EdgeId")}").constant("Hello, World!"`;
    exportedGraph.data.vertices.push(maliciousVertexId);
    exportedGraph.data.edges.push(maliciousEdgeId);

    const parsed = await parseExportedGraph(toGraphFileBlob(exportedGraph));

    expect(parsed.vertices.has(maliciousVertexId as VertexId)).toBeFalsy();
    expect(parsed.edges.has(maliciousEdgeId as EdgeId)).toBeFalsy();
    expect(
      parsed.vertices.has(escapeString(maliciousVertexId) as VertexId),
    ).toBeTruthy();
    expect(
      parsed.edges.has(escapeString(maliciousEdgeId) as EdgeId),
    ).toBeTruthy();
  });

  it("should trim leading and trailing whitespace", async () => {
    const exportedGraph = createRandomExportedGraph();
    const vertexIdWithWhitespace = `  ${createRandomName("VertexId")} `;
    const edgeIdWithWhitespace = `  ${createRandomName("EdgeId")} `;
    exportedGraph.data.vertices.push(vertexIdWithWhitespace);
    exportedGraph.data.edges.push(edgeIdWithWhitespace);

    const parsed = await parseExportedGraph(toGraphFileBlob(exportedGraph));

    expect(parsed.vertices.has(vertexIdWithWhitespace as VertexId)).toBeFalsy();
    expect(parsed.edges.has(edgeIdWithWhitespace as EdgeId)).toBeFalsy();
    expect(
      parsed.vertices.has(vertexIdWithWhitespace.trim() as VertexId),
    ).toBeTruthy();
    expect(
      parsed.edges.has(edgeIdWithWhitespace.trim() as EdgeId),
    ).toBeTruthy();
  });

  it("should skip invalid RDF edge IDs", async () => {
    const exportedGraph = createRandomExportedGraphForRdf();
    // Missing the brackets
    exportedGraph.data.edges.push(
      "http://example.com/foo-http://example.com/foo-http://example.com/foo",
    );
    const expected = {
      connection: exportedGraph.data.connection,
      vertices: new Set(exportedGraph.data.vertices),
      edges: new Set(exportedGraph.data.edges.slice(0, -1)),
    };
    const parsed = await parseExportedGraph(toGraphFileBlob(exportedGraph));
    expect(parsed).toEqual(expected);
  });

  it("should skip malicious RDF edge IDs", async () => {
    const exportedGraph = createRandomExportedGraphForRdf();
    exportedGraph.data.edges.push(
      "http://example.com/foo-[http://example.com/foo]->http://example.com/foo> . { ?s ?p ?o }#",
    );
    const expected = {
      connection: exportedGraph.data.connection,
      vertices: new Set(exportedGraph.data.vertices),
      edges: new Set(exportedGraph.data.edges.slice(0, -1)),
    };
    const parsed = await parseExportedGraph(toGraphFileBlob(exportedGraph));
    expect(parsed).toEqual(expected);
  });

  it("should reject a file that is not a graph export", async () => {
    const exportedGraph = createRandomExportedGraph();
    const wrongKind = {
      ...exportedGraph,
      meta: { ...exportedGraph.meta, kind: "styling-export" },
    };

    await expect(
      parseExportedGraph(toGraphFileBlob(wrongKind)),
    ).rejects.toThrow(/Expected a "graph-export" file/);
  });

  it("should reject a file from a newer generation", async () => {
    const exportedGraph = createRandomExportedGraph();
    const tooNew = {
      ...exportedGraph,
      meta: { ...exportedGraph.meta, version: 2 },
    };

    await expect(parseExportedGraph(toGraphFileBlob(tooNew))).rejects.toThrow(
      /newer version of Graph Explorer/,
    );
  });

  it("should reject a non-integer version as malformed", async () => {
    const exportedGraph = createRandomExportedGraph();
    const malformed = {
      ...exportedGraph,
      meta: { ...exportedGraph.meta, version: "1.5" },
    };

    await expect(
      parseExportedGraph(toGraphFileBlob(malformed)),
    ).rejects.toThrow(/expected envelope structure/);
  });

  it("should accept the legacy '1.0' version string", async () => {
    const exportedGraph = createRandomExportedGraph();
    const legacy = {
      ...exportedGraph,
      meta: { ...exportedGraph.meta, version: "1.0" },
    };

    const parsed = await parseExportedGraph(toGraphFileBlob(legacy));
    expect(parsed.vertices).toEqual(new Set(exportedGraph.data.vertices));
  });

  it("dispatches generation 1 to the current parser", () => {
    const exportedGraph = createRandomExportedGraph();
    const parsed = parseGraphExportPayloadForVersion(1, exportedGraph.data);
    expect(parsed).toEqual(exportedGraph.data);
  });

  it("throws loudly for a generation with no parser", () => {
    const exportedGraph = createRandomExportedGraph();
    expect(() =>
      parseGraphExportPayloadForVersion(2, exportedGraph.data),
    ).toThrow(/No graph export parser for format generation 2/);
  });

  it("should reject a malformed payload", async () => {
    const exportedGraph = createRandomExportedGraph();
    const malformed = {
      ...exportedGraph,
      data: { ...exportedGraph.data, vertices: [false, true] as any },
    };

    await expect(
      parseExportedGraph(toGraphFileBlob(malformed)),
    ).rejects.toThrow();
  });

  it("should reject a file that is not valid JSON", async () => {
    const blob = new Blob(["not json"], { type: "application/json" });
    await expect(parseExportedGraph(blob)).rejects.toThrow(
      "File is not valid JSON",
    );
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

describe("getSafeTimestamp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return a file safe timestamp", () => {
    vi.setSystemTime(new Date("2025-02-07T01:01:01.000Z"));
    const timestamp = createFileSafeTimestamp();
    expect(timestamp).toBe("20250207010101");
  });
});

describe("createDefaultFileName", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-02-07T01:01:01.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should create a default file name with a connection name", () => {
    const fileName = createDefaultFileName("default");
    expect(fileName).toBe(`default.20250207010101.graph.json`);
  });

  it("should replace spaces with dashes", () => {
    const fileName = createDefaultFileName("My Connection to the Database");
    expect(fileName).toBe(
      `my-connection-to-the-database.20250207010101.graph.json`,
    );
  });

  it("should remove special characters", () => {
    const connectionName = "connection !@#$%^&*()";
    const fileName = createDefaultFileName(connectionName);

    expect(fileName).toBe(`connection.20250207010101.graph.json`);
  });

  it("should convert to lowercase", () => {
    const connectionName = "CONnECtiOn";
    const fileName = createDefaultFileName(connectionName);

    expect(fileName).toBe(`connection.20250207010101.graph.json`);
  });

  it("should remove hyphens from connection name", () => {
    const connectionName = "connection - gremlin";
    const fileName = createDefaultFileName(connectionName);

    expect(fileName).toBe(`connection-gremlin.20250207010101.graph.json`);
  });
});
