import * as fileSaver from "file-saver";
import { describe, it, expect, vi } from "vitest";

import type { ConfigurationContextProps } from "@/core";

import { createVertexType, createEdgeType } from "@/core";

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
        triedToSync: true,
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

  it("should convert lastUpdate date to ISO string", async () => {
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
        triedToSync: true,
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

  it("should convert prefix __matches Set to Array", async () => {
    const config: ConfigurationContextProps = {
      ...createRandomRawConfiguration(),
      schema: {
        vertices: [],
        edges: [],
        prefixes: [
          {
            prefix: "rdf",
            uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            __matches: new Set(["http://www.w3.org/1999/02/22-rdf-syntax-ns#"]),
          },
          {
            prefix: "rdfs",
            uri: "http://www.w3.org/2000/01/rdf-schema#",
            __matches: new Set(["http://www.w3.org/2000/01/rdf-schema#"]),
          },
        ],
        totalVertices: 0,
        totalEdges: 0,
        lastUpdate: new Date(),
        lastSyncFail: false,
        triedToSync: true,
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

    expect(Array.isArray(parsed.schema.prefixes[0].__matches)).toBe(true);
    expect(parsed.schema.prefixes[0].__matches).toContain(
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    );
    expect(parsed.schema.prefixes[1].__matches).toContain(
      "http://www.w3.org/2000/01/rdf-schema#",
    );
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
        triedToSync: true,
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
        triedToSync: true,
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
