// @vitest-environment happy-dom
import * as fileSaver from "file-saver";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ConfigurationContextProps } from "@/core";
import type { IriNamespace, RdfPrefix } from "@/utils/rdf";

import { createEdgeType, createVertexType } from "@/core";
import { transformLegacyConnection } from "@/core/StateProvider/configuration";

import { parseConnectionFile } from "./parseConnectionFile";
import saveConfigurationToFile from "./saveConfigurationToFile";
import { createRandomRawConfiguration, stubDocumentUrl } from "./testing";
import { exportConnectionFileText } from "./testing/exportConnectionFileText";

vi.mock("file-saver", () => ({
  saveAs: vi.fn(),
}));

const saveAsMock = vi.mocked(fileSaver.saveAs);

/**
 * Builds a merged configuration for export tests. Defaults to an empty schema
 * and zeroed runtime counts; pass overrides to exercise specific cases.
 */
function makeConfig(
  overrides: Partial<ConfigurationContextProps> = {},
): ConfigurationContextProps {
  return {
    ...createRandomRawConfiguration(),
    schema: { vertices: [], edges: [] },
    totalVertices: 0,
    vertexTypes: [],
    totalEdges: 0,
    edgeTypes: [],
    ...overrides,
  };
}

describe("saveConfigurationToFile", () => {
  beforeEach(() => {
    stubDocumentUrl();
  });

  it("should save a minimal configuration to file", () => {
    const config = makeConfig();

    saveConfigurationToFile(config);

    expect(saveAsMock).toHaveBeenCalledTimes(1);
    const [blob, filename] = saveAsMock.mock.calls[0];

    expect(filename).toBe(`${config.displayLabel}.connection.json`);
    expect(blob).toBeInstanceOf(Blob);
    expect((blob as Blob).type).toBe("application/json");
  });

  it("should use id as displayLabel if displayLabel is not provided", () => {
    const config = makeConfig({ displayLabel: undefined });

    saveConfigurationToFile(config);

    const [, filename] = saveAsMock.mock.calls[0];
    expect(filename).toBe(`${config.id}.connection.json`);
  });

  it("should include connection with default queryEngine if not provided", async () => {
    const config = makeConfig({
      connection: {
        graphDbUrl: "https://example.com",
      },
    });

    const parsed = JSON.parse(await exportConnectionFileText(config));

    expect(parsed.connection.queryEngine).toBe("gremlin");
    expect(parsed.connection.graphDbUrl).toBe("https://example.com");
  });

  it("should preserve existing queryEngine", async () => {
    const config = makeConfig({
      connection: {
        graphDbUrl: "https://example.com",
        queryEngine: "sparql",
      },
    });

    const parsed = JSON.parse(await exportConnectionFileText(config));

    expect(parsed.connection.queryEngine).toBe("sparql");
  });

  it("should export schema with vertices and edges", async () => {
    const config = makeConfig({
      schema: {
        vertices: [
          {
            type: createVertexType("Person"),
            displayLabel: "Person",
            attributes: [],
          },
          {
            type: createVertexType("Company"),
            displayLabel: "Company",
            attributes: [],
          },
        ],
        edges: [
          {
            type: createEdgeType("worksAt"),
            displayLabel: "works at",
            attributes: [],
          },
        ],
        prefixes: [],
        totalVertices: 100,
        totalEdges: 50,
        lastUpdate: new Date("2024-01-01T00:00:00Z"),
        lastSyncFail: false,
      },
      totalVertices: 100,
      vertexTypes: [createVertexType("Person"), createVertexType("Company")],
      totalEdges: 50,
      edgeTypes: [createEdgeType("worksAt")],
    });

    const parsed = JSON.parse(await exportConnectionFileText(config));

    expect(parsed.schema.vertices).toHaveLength(2);
    expect(parsed.schema.edges).toHaveLength(1);
    expect(parsed.schema.vertices[0].type).toBe("Person");
    expect(parsed.schema.edges[0].type).toBe("worksAt");
  });

  it("should write lastUpdate as an ISO string on disk", async () => {
    // Pins the serialized on-disk value regardless of how the writer produces
    // it (an explicit toISOString or a Date flushed by JSON.stringify), so the
    // writer's lastUpdate type can change without altering the file.
    const lastUpdate = new Date("2024-01-01T12:30:00Z");
    const config = makeConfig({
      schema: {
        vertices: [],
        edges: [],
        prefixes: [],
        totalVertices: 0,
        totalEdges: 0,
        lastUpdate,
        lastSyncFail: false,
      },
    });

    const parsed = JSON.parse(await exportConnectionFileText(config));

    expect(parsed.schema.lastUpdate).toBe("2024-01-01T12:30:00.000Z");
  });

  it("should export prefixes without internal properties", async () => {
    const config = makeConfig({
      schema: {
        vertices: [],
        edges: [],
        prefixes: [
          {
            prefix: "rdf" as RdfPrefix,
            uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#" as IriNamespace,
          },
          {
            prefix: "rdfs" as RdfPrefix,
            uri: "http://www.w3.org/2000/01/rdf-schema#" as IriNamespace,
          },
        ],
        totalVertices: 0,
        totalEdges: 0,
        lastUpdate: new Date(),
        lastSyncFail: false,
      },
    });

    const parsed = JSON.parse(await exportConnectionFileText(config));

    expect(parsed.schema.prefixes).toStrictEqual([
      {
        prefix: "rdf",
        uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      },
      {
        prefix: "rdfs",
        uri: "http://www.w3.org/2000/01/rdf-schema#",
      },
    ]);
  });

  it("should handle empty schema", async () => {
    const config = makeConfig();

    const parsed = JSON.parse(await exportConnectionFileText(config));

    expect(parsed.schema.vertices).toEqual([]);
    expect(parsed.schema.edges).toEqual([]);
    expect(parsed.schema.prefixes).toBeUndefined();
    expect(parsed.schema.lastUpdate).toBeUndefined();
  });

  it("should handle missing connection", async () => {
    const config = makeConfig({ connection: undefined });

    const parsed = JSON.parse(await exportConnectionFileText(config));

    expect(parsed.connection.queryEngine).toBe("gremlin");

    // A connection-less config is not a real, reachable state — every config
    // the app produces has a connection. With no URL to emit, the writer omits
    // graphDbUrl entirely, and the parser then rejects the file (a connection
    // must have a URL). This pins that accepted asymmetry; it should disappear
    // in a later slice that makes a connection non-optional on the config
    // rather than defaulting here.
    expect(parsed.connection.graphDbUrl).toBeUndefined();
    expect(parseConnectionFile(parsed)).toBeNull();
  });

  it("should strip whitespace and newlines from the exported graphDbUrl", async () => {
    const config = makeConfig({
      connection: {
        graphDbUrl: "  https://neptune.example.com:8182/\r\n  ",
        queryEngine: "gremlin",
      },
    });

    const parsed = JSON.parse(await exportConnectionFileText(config));

    expect(parsed.connection.graphDbUrl).toBe(
      "https://neptune.example.com:8182",
    );
    // The cleaned file must survive its own import validation.
    expect(parseConnectionFile(parsed)?.connection.graphDbUrl).toBe(
      "https://neptune.example.com:8182",
    );
  });

  it("should only export necessary fields", async () => {
    const config = makeConfig({
      totalVertices: 100,
      vertexTypes: [createVertexType("Person")],
      totalEdges: 50,
      edgeTypes: [createEdgeType("knows")],
    });

    const parsed = JSON.parse(await exportConnectionFileText(config));

    // Should not include runtime-only fields
    expect(parsed.totalVertices).toBeUndefined();
    expect(parsed.vertexTypes).toBeUndefined();
    expect(parsed.totalEdges).toBeUndefined();
    expect(parsed.edgeTypes).toBeUndefined();

    // Should include exportable fields
    expect(parsed.id).toBeDefined();
    expect(parsed.displayLabel).toBeDefined();
    expect(parsed.connection).toBeDefined();
    expect(parsed.schema).toBeDefined();
  });

  it("should produce a file that passes import validation", async () => {
    const config = makeConfig({
      connection: {
        graphDbUrl: "https://neptune.example.com:8182",
        queryEngine: "gremlin",
      },
      schema: {
        vertices: [
          {
            type: createVertexType("Person"),
            displayLabel: "Person",
            attributes: [{ name: "name", dataType: "string" }],
          },
        ],
        edges: [
          {
            type: createEdgeType("knows"),
            displayLabel: "Knows",
            attributes: [],
          },
        ],
        prefixes: [],
        totalVertices: 1,
        totalEdges: 1,
        lastUpdate: new Date("2024-01-01T00:00:00Z"),
        lastSyncFail: false,
      },
      totalVertices: 1,
      vertexTypes: [createVertexType("Person")],
      totalEdges: 1,
      edgeTypes: [createEdgeType("knows")],
    });

    const parsed = JSON.parse(await exportConnectionFileText(config));

    // The round trip must preserve values, not merely produce a parseable file.
    const result = parseConnectionFile(parsed);
    expect(result?.id).toBe(config.id);
    expect(result?.displayLabel).toBe(config.displayLabel);
    expect(result?.connection.graphDbUrl).toBe(
      "https://neptune.example.com:8182",
    );
    expect(result?.connection.queryEngine).toBe("gremlin");
    expect(result?.schema.vertices.map(vertex => vertex.type)).toStrictEqual([
      "Person",
    ]);
    expect(result?.schema.edges.map(edge => edge.type)).toStrictEqual([
      "knows",
    ]);
    // The ISO string round trips back into the original Date.
    expect(result?.schema.lastUpdate).toEqual(new Date("2024-01-01T00:00:00Z"));
  });

  it("should export a direct connection as direct", async () => {
    const config = makeConfig({
      connection: {
        graphDbUrl: "https://neptune.example.com:8182",
        proxyConnection: false,
        queryEngine: "sparql",
      },
    });

    const parsed = JSON.parse(await exportConnectionFileText(config));

    expect(parseConnectionFile(parsed)?.connection).toStrictEqual({
      url: "https://neptune.example.com:8182",
      graphDbUrl: "https://neptune.example.com:8182",
      proxyConnection: false,
      queryEngine: "sparql",
    });
  });

  it("should export edgeConnections when present", async () => {
    const config = makeConfig({
      schema: {
        vertices: [],
        edges: [],
        prefixes: [],
        totalVertices: 0,
        totalEdges: 0,
        lastUpdate: new Date(),
        lastSyncFail: false,
        edgeConnections: [
          {
            edgeType: createEdgeType("knows"),
            sourceVertexType: createVertexType("Person"),
            targetVertexType: createVertexType("Person"),
            count: 42,
          },
          {
            edgeType: createEdgeType("worksAt"),
            sourceVertexType: createVertexType("Person"),
            targetVertexType: createVertexType("Company"),
          },
        ],
      },
    });

    const parsed = JSON.parse(await exportConnectionFileText(config));

    expect(parsed.schema.edgeConnections).toStrictEqual([
      {
        edgeType: "knows",
        sourceVertexType: "Person",
        targetVertexType: "Person",
        count: 42,
      },
      {
        edgeType: "worksAt",
        sourceVertexType: "Person",
        targetVertexType: "Company",
      },
    ]);
  });

  it("should handle undefined edgeConnections", async () => {
    const config = makeConfig({
      schema: {
        vertices: [],
        edges: [],
        prefixes: [],
        totalVertices: 0,
        totalEdges: 0,
        lastUpdate: new Date(),
        lastSyncFail: false,
        edgeConnections: undefined,
      },
    });

    const parsed = JSON.parse(await exportConnectionFileText(config));

    expect(parsed.schema.edgeConnections).toBeUndefined();
  });
});

/**
 * BACKWARD COMPATIBILITY — EXPORTED FILES READ BY OLDER VERSIONS
 *
 * Versions before the unified-proxy model (#1773) import a file only if
 * `connection.url` is an http(s) URL, and read a missing `proxyConnection` as
 * direct. `url` is the proxy root with no trailing slash, since they build
 * `${url}/gremlin`, or the database for a direct connection. The rationale
 * lives in ADR `unify-docker-image-remove-sagemaker-variant`.
 *
 * DO NOT delete or weaken these tests without confirming that no supported
 * older version still imports exported connection files.
 */
describe("backward compatibility: legacy url/proxyConnection written to exported files", () => {
  beforeEach(() => {
    stubDocumentUrl();
  });

  it("should export the proxy server URL for a proxy connection", async () => {
    const parsed = JSON.parse(
      await exportConnectionFileText(
        makeConfig({
          connection: {
            graphDbUrl: "https://neptune.example.com:8182",
            queryEngine: "gremlin",
          },
        }),
      ),
    );

    expect(parsed.connection).toStrictEqual({
      url: "http://localhost",
      proxyConnection: true,
      graphDbUrl: "https://neptune.example.com:8182",
      queryEngine: "gremlin",
    });
  });

  it("should export the proxy server URL behind a reverse proxy prefix", async () => {
    stubDocumentUrl("https://nb.sagemaker.aws/proxy/9250/explorer/");

    const parsed = JSON.parse(
      await exportConnectionFileText(
        makeConfig({
          connection: {
            graphDbUrl: "https://neptune.example.com:8182",
            proxyConnection: true,
          },
        }),
      ),
    );

    expect(parsed.connection.url).toBe("https://nb.sagemaker.aws/proxy/9250");
    expect(parsed.connection.proxyConnection).toBe(true);
  });

  it("should export the database URL as url for a direct connection", async () => {
    const parsed = JSON.parse(
      await exportConnectionFileText(
        makeConfig({
          connection: {
            graphDbUrl: "https://neptune.example.com:8182/",
            proxyConnection: false,
          },
        }),
      ),
    );

    expect(parsed.connection.url).toBe("https://neptune.example.com:8182");
    expect(parsed.connection.proxyConnection).toBe(false);
  });

  it.each([
    { graphDbUrl: "https://neptune.example.com:8182" },
    {
      graphDbUrl: "https://neptune.example.com:8182",
      proxyConnection: false,
    },
  ])("should import back to the same connection for %o", async connection => {
    const parsed = JSON.parse(
      await exportConnectionFileText(
        makeConfig({ connection: { ...connection, queryEngine: "gremlin" } }),
      ),
    );

    const file = parseConnectionFile(parsed);
    if (!file) {
      throw new Error("exported file failed import validation");
    }
    expect(transformLegacyConnection(file.connection)).toStrictEqual({
      ...connection,
      queryEngine: "gremlin",
    });
  });
});
