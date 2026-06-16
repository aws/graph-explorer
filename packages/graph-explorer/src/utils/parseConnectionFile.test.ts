import { createRandomName, createRandomUrlString } from "@shared/utils/testing";
import { describe, expect, test } from "vitest";

import { createNewConfigurationId } from "@/core/ConfigurationProvider/types";

import { parseConnectionFile } from "./parseConnectionFile";

describe("parseConnectionFile", () => {
  test("parses a valid configuration into a typed object", () => {
    const validConfig = {
      id: createNewConfigurationId(),
      displayLabel: createRandomName("Config"),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        totalVertices: 0,
        vertices: [],
        totalEdges: 0,
        edges: [],
      },
    };

    const result = parseConnectionFile(validConfig);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(validConfig.id);
    expect(result?.displayLabel).toBe(validConfig.displayLabel);
    expect(result?.connection.url).toBe(validConfig.connection.url);
    expect(result?.connection.queryEngine).toBe("gremlin");
  });

  test("returns null when id is missing", () => {
    const config = {
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(config)).toBeNull();
  });

  test("returns null when connection is missing", () => {
    const config = {
      id: createNewConfigurationId(),
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(config)).toBeNull();
  });

  test("returns null when schema is missing", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
    };

    expect(parseConnectionFile(config)).toBeNull();
  });

  test("returns null when connection.url is missing", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: { queryEngine: "gremlin" as const },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(config)).toBeNull();
  });

  test("returns null when connection.queryEngine is missing", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: { url: createRandomUrlString() },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(config)).toBeNull();
  });

  test("returns null for an invalid URL", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: { url: "not-a-valid-url", queryEngine: "gremlin" as const },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(config)).toBeNull();
  });

  test("returns null for a non-http(s) URL", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: { url: "ftp://example.com", queryEngine: "gremlin" as const },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(config)).toBeNull();
  });

  test("returns null for a non-http(s) graphDbUrl", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
        graphDbUrl: "ftp://example.com",
      },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(config)).toBeNull();
  });

  test("accepts an http(s) graphDbUrl", () => {
    const graphDbUrl = "https://neptune.example.com:8182";
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
        graphDbUrl,
      },
      schema: { vertices: [], edges: [] },
    };

    const result = parseConnectionFile(config);

    expect(result?.connection.graphDbUrl).toBe(graphDbUrl);
  });

  test("accepts an http URL", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: "http://example.com",
        queryEngine: "gremlin" as const,
      },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(config)).not.toBeNull();
  });

  test("accepts an https URL", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: "https://example.com",
        queryEngine: "gremlin" as const,
      },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(config)).not.toBeNull();
  });

  test("returns null for an invalid queryEngine", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: { url: createRandomUrlString(), queryEngine: "invalid" },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(config)).toBeNull();
  });

  test.each(["gremlin", "openCypher", "sparql"] as const)(
    "accepts the %s queryEngine",
    queryEngine => {
      const config = {
        id: createNewConfigurationId(),
        connection: { url: createRandomUrlString(), queryEngine },
        schema: { vertices: [], edges: [] },
      };

      expect(parseConnectionFile(config)).not.toBeNull();
    },
  );

  test("accepts a valid vertex config", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        vertices: [{ type: "Person", attributes: [{ name: "name" }] }],
        edges: [],
      },
    };

    expect(parseConnectionFile(config)).not.toBeNull();
  });

  test("returns null when a vertex is missing its type", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        vertices: [{ attributes: [{ name: "name" }] }],
        edges: [],
      },
    };

    expect(parseConnectionFile(config)).toBeNull();
  });

  test("returns null when a vertex attribute is missing its name", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        vertices: [{ type: "Person", attributes: [{ dataType: "string" }] }],
        edges: [],
      },
    };

    expect(parseConnectionFile(config)).toBeNull();
  });

  test("defaults attributes to an empty array when a vertex omits them", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        vertices: [{ type: "Person" }],
        edges: [],
      },
    };

    const result = parseConnectionFile(config);

    expect(result?.schema.vertices[0].attributes).toStrictEqual([]);
  });

  test("defaults attributes to an empty array when an edge omits them", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        vertices: [],
        edges: [{ type: "knows" }],
      },
    };

    const result = parseConnectionFile(config);

    expect(result?.schema.edges[0].attributes).toStrictEqual([]);
  });

  test("accepts a valid edge config", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        vertices: [],
        edges: [{ type: "knows", attributes: [{ name: "since" }] }],
      },
    };

    expect(parseConnectionFile(config)).not.toBeNull();
  });

  test("returns null when an edge is missing its type", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        vertices: [],
        edges: [{ attributes: [{ name: "since" }] }],
      },
    };

    expect(parseConnectionFile(config)).toBeNull();
  });

  test("returns null when schema.vertices is missing", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: { edges: [] },
    };

    expect(parseConnectionFile(config)).toBeNull();
  });

  test("returns null when schema.edges is missing", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: { vertices: [] },
    };

    expect(parseConnectionFile(config)).toBeNull();
  });

  test("coerces an ISO lastUpdate string into a Date", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        vertices: [],
        edges: [],
        lastUpdate: "2024-01-01T12:30:00.000Z",
      },
    };

    const result = parseConnectionFile(config);

    expect(result?.schema.lastUpdate).toBeInstanceOf(Date);
    expect(result?.schema.lastUpdate?.toISOString()).toBe(
      "2024-01-01T12:30:00.000Z",
    );
  });

  test("keeps unknown styling and legacy keys in the parsed output", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "sparql" as const,
        proxyConnection: true,
        awsRegion: "us-west-2",
      },
      schema: {
        vertices: [
          {
            type: "Person",
            attributes: [{ name: "name", dataType: "String" }],
            color: "#5947e6",
            iconUrl: "lucide:user",
          },
        ],
        edges: [],
        prefixes: [
          {
            prefix: "rdf",
            uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            __inferred: true,
            __matches: ["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"],
          },
        ],
      },
    };

    const result = parseConnectionFile(config);
    const parsedConnection = result?.connection as Record<string, unknown>;
    const parsedVertex = result?.schema.vertices[0] as Record<string, unknown>;
    const parsedPrefix = result?.schema.prefixes?.[0] as Record<
      string,
      unknown
    >;

    expect(parsedConnection.proxyConnection).toBe(true);
    expect(parsedConnection.awsRegion).toBe("us-west-2");
    expect(parsedVertex.color).toBe("#5947e6");
    expect(parsedVertex.iconUrl).toBe("lucide:user");
    expect((parsedVertex.attributes as Record<string, unknown>[])[0]).toEqual({
      name: "name",
      dataType: "String",
    });
    expect(parsedPrefix.__inferred).toBe(true);
    expect(parsedPrefix.__matches).toStrictEqual([
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    ]);
  });
});
