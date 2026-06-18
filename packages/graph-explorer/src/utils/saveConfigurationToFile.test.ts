// @vitest-environment happy-dom
import * as fileSaver from "file-saver";
import { describe, expect, it, vi } from "vitest";

import type { ConfigurationContextProps } from "@/core";
import type { IriNamespace, RdfPrefix } from "@/utils/rdf";

import { createEdgeType, createVertexType } from "@/core";

import { parseConnectionFile } from "./parseConnectionFile";
import saveConfigurationToFile from "./saveConfigurationToFile";
import { createRandomRawConfiguration } from "./testing";

vi.mock("file-saver", () => ({
  saveAs: vi.fn(),
}));

const saveAsMock = vi.mocked(fileSaver.saveAs);

describe("saveConfigurationToFile", () => {
  it("should save a minimal configuration to file", () => {
    const config: ConfigurationContextProps = {
      ...createRandomRawConfiguration(),
      totalVertices: 0,
      vertexTypes: [],
      totalEdges: 0,
      edgeTypes: [],
    };

    saveConfigurationToFile(config);

    expect(saveAsMock).toHaveBeenCalledTimes(1);
    const [blob, filename] = saveAsMock.mock.calls[0];

    expect(filename).toBe(`${config.displayLabel}.json`);
    expect(blob).toBeInstanceOf(Blob);
    expect((blob as Blob).type).toBe("application/json");
  });

  it("should use id as displayLabel if displayLabel is not provided", () => {
    const config: ConfigurationContextProps = {
      ...createRandomRawConfiguration(),
      displayLabel: undefined,
      totalVertices: 0,
      vertexTypes: [],
      totalEdges: 0,
      edgeTypes: [],
    };

    saveConfigurationToFile(config);

    const [, filename] = saveAsMock.mock.calls[0];
    expect(filename).toBe(`${config.id}.json`);
  });

  it("should include connection with default queryEngine if not provided", async () => {
    const config: ConfigurationContextProps = {
      ...createRandomRawConfiguration(),
      connection: {
        url: "https://example.com",
      },
      totalVertices: 0,
      vertexTypes: [],
      totalEdges: 0,
      edgeTypes: [],
    };

    saveConfigurationToFile(config);

    const [blob] = saveAsMock.mock.calls[0];
    const text = await (blob as Blob).text();
    const parsed = JSON.parse(text);

    expect(parsed.connection.queryEngine).toBe("gremlin");
    expect(parsed.connection.url).toBe("https://example.com");
  });

  it("should preserve existing queryEngine", async () => {
    const config: ConfigurationContextProps = {
      ...createRandomRawConfiguration(),
      connection: {
        url: "https://example.com",
        queryEngine: "sparql",
      },
      totalVertices: 0,
      vertexTypes: [],
      totalEdges: 0,
      edgeTypes: [],
    };

    saveConfigurationToFile(config);

    const [blob] = saveAsMock.mock.calls[0];
    const text = await (blob as Blob).text();
    const parsed = JSON.parse(text);

    expect(parsed.connection.queryEngine).toBe("sparql");
  });

  it("should export schema with vertices and edges", async () => {
    const config: ConfigurationContextProps = {
      ...createRandomRawConfiguration(),
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
    };

    saveConfigurationToFile(config);

    const [blob] = saveAsMock.mock.calls[0];
    const text = await (blob as Blob).text();
    const parsed = JSON.parse(text);

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
    const config: ConfigurationContextProps = {
      ...createRandomRawConfiguration(),
      schema: {
        vertices: [],
        edges: [],
        prefixes: [],
        totalVertices: 0,
        totalEdges: 0,
        lastUpdate,
        lastSyncFail: false,
      },
      totalVertices: 0,
      vertexTypes: [],
      totalEdges: 0,
      edgeTypes: [],
    };

    saveConfigurationToFile(config);

    const [blob] = saveAsMock.mock.calls[0];
    const text = await (blob as Blob).text();
    const parsed = JSON.parse(text);

    expect(parsed.schema.lastUpdate).toBe("2024-01-01T12:30:00.000Z");
  });

  it("should export prefixes without internal properties", async () => {
    const config: ConfigurationContextProps = {
      ...createRandomRawConfiguration(),
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
      totalVertices: 0,
      vertexTypes: [],
      totalEdges: 0,
      edgeTypes: [],
    };

    saveConfigurationToFile(config);

    const [blob] = saveAsMock.mock.calls[0];
    const text = await (blob as Blob).text();
    const parsed = JSON.parse(text);

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
    const config: ConfigurationContextProps = {
      ...createRandomRawConfiguration(),
      schema: undefined,
      totalVertices: 0,
      vertexTypes: [],
      totalEdges: 0,
      edgeTypes: [],
    };

    saveConfigurationToFile(config);

    const [blob] = saveAsMock.mock.calls[0];
    const text = await (blob as Blob).text();
    const parsed = JSON.parse(text);

    expect(parsed.schema.vertices).toEqual([]);
    expect(parsed.schema.edges).toEqual([]);
    expect(parsed.schema.prefixes).toBeUndefined();
    expect(parsed.schema.lastUpdate).toBeUndefined();
  });

  it("should handle missing connection", async () => {
    const config: ConfigurationContextProps = {
      ...createRandomRawConfiguration(),
      connection: undefined,
      totalVertices: 0,
      vertexTypes: [],
      totalEdges: 0,
      edgeTypes: [],
    };

    saveConfigurationToFile(config);

    const [blob] = saveAsMock.mock.calls[0];
    const text = await (blob as Blob).text();
    const parsed = JSON.parse(text);

    expect(parsed.connection.queryEngine).toBe("gremlin");

    // A connection-less config is not a real, reachable state — every config
    // the app produces has a connection. The `?? ""` fallback in the writer
    // emits `url: ""` rather than omitting it, and the parser then rejects
    // the file (empty string is not a valid URL). This pins that accepted
    // asymmetry; it should disappear in a later slice that makes a connection
    // non-optional on the config rather than defaulting here.
    expect(parsed.connection.url).toBe("");
    expect(parseConnectionFile(parsed)).toBeNull();
  });

  it("should only export necessary fields", async () => {
    const config: ConfigurationContextProps = {
      ...createRandomRawConfiguration(),
      totalVertices: 100,
      vertexTypes: [createVertexType("Person")],
      totalEdges: 50,
      edgeTypes: [createEdgeType("knows")],
    };

    saveConfigurationToFile(config);

    const [blob] = saveAsMock.mock.calls[0];
    const text = await (blob as Blob).text();
    const parsed = JSON.parse(text);

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
    const config: ConfigurationContextProps = {
      ...createRandomRawConfiguration(),
      connection: {
        url: "https://neptune.example.com:8182",
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
    };

    saveConfigurationToFile(config);

    const [blob] = saveAsMock.mock.calls[0];
    const text = await (blob as Blob).text();
    const parsed = JSON.parse(text);

    // The round trip must preserve values, not merely produce a parseable file.
    const result = parseConnectionFile(parsed);
    expect(result?.id).toBe(config.id);
    expect(result?.displayLabel).toBe(config.displayLabel);
    expect(result?.connection.url).toBe("https://neptune.example.com:8182");
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

  it("should export edgeConnections when present", async () => {
    const config: ConfigurationContextProps = {
      ...createRandomRawConfiguration(),
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
      totalVertices: 0,
      vertexTypes: [],
      totalEdges: 0,
      edgeTypes: [],
    };

    saveConfigurationToFile(config);

    const [blob] = saveAsMock.mock.calls[0];
    const text = await (blob as Blob).text();
    const parsed = JSON.parse(text);

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
    const config: ConfigurationContextProps = {
      ...createRandomRawConfiguration(),
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
      totalVertices: 0,
      vertexTypes: [],
      totalEdges: 0,
      edgeTypes: [],
    };

    saveConfigurationToFile(config);

    const [blob] = saveAsMock.mock.calls[0];
    const text = await (blob as Blob).text();
    const parsed = JSON.parse(text);

    expect(parsed.schema.edgeConnections).toBeUndefined();
  });
});
