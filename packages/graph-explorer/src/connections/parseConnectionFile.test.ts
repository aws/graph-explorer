import { createRandomName, createRandomUrlString } from "@shared/utils/testing";
import { describe, expect, test } from "vitest";

import { logger } from "@/utils";

import { parseConnectionFile } from "./parseConnectionFile";
import { createConnectionId } from "./types";

describe("parseConnectionFile", () => {
  test("parses a valid configuration into a typed object", () => {
    const validConnectionFile = {
      id: createConnectionId(),
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

    const result = parseConnectionFile(validConnectionFile);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(validConnectionFile.id);
    expect(result?.displayLabel).toBe(validConnectionFile.displayLabel);
    expect(result?.connection.url).toBe(validConnectionFile.connection.url);
    expect(result?.connection.queryEngine).toBe("gremlin");
  });

  test("returns null when id is missing", () => {
    const connection = {
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(connection)).toBeNull();
  });

  test("returns null when connection is missing", () => {
    const connection = {
      id: createConnectionId(),
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(connection)).toBeNull();
  });

  test("returns null when schema is missing", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
    };

    expect(parseConnectionFile(connection)).toBeNull();
  });

  test("returns null when connection.queryEngine is missing", () => {
    const connection = {
      id: createConnectionId(),
      connection: { url: createRandomUrlString() },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(connection)).toBeNull();
  });

  test("returns null for an invalid URL", () => {
    const connection = {
      id: createConnectionId(),
      connection: { url: "not-a-valid-url", queryEngine: "gremlin" as const },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(connection)).toBeNull();
  });

  test("returns null for a non-http(s) URL", () => {
    const connection = {
      id: createConnectionId(),
      connection: { url: "ftp://example.com", queryEngine: "gremlin" as const },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(connection)).toBeNull();
  });

  test("returns null for a non-http(s) graphDbUrl", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
        graphDbUrl: "ftp://example.com",
      },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(connection)).toBeNull();
  });

  test("accepts an http(s) graphDbUrl", () => {
    const graphDbUrl = "https://neptune.example.com:8182";
    const connection = {
      id: createConnectionId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
        graphDbUrl,
      },
      schema: { vertices: [], edges: [] },
    };

    const result = parseConnectionFile(connection);

    expect(result?.connection.graphDbUrl).toBe(graphDbUrl);
  });

  test("accepts an http URL", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        url: "http://example.com",
        queryEngine: "gremlin" as const,
      },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(connection)).not.toBeNull();
  });

  test("trims surrounding whitespace from the connection URL", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        url: "  https://example.com  ",
        queryEngine: "gremlin" as const,
      },
      schema: { vertices: [], edges: [] },
    };

    const result = parseConnectionFile(connection);

    expect(result?.connection.url).toBe("https://example.com");
  });

  test("accepts an https URL", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        url: "https://example.com",
        queryEngine: "gremlin" as const,
      },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(connection)).not.toBeNull();
  });

  test("returns null for an invalid queryEngine", () => {
    const connection = {
      id: createConnectionId(),
      connection: { url: createRandomUrlString(), queryEngine: "invalid" },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(connection)).toBeNull();
  });

  test.each(["gremlin", "openCypher", "sparql"] as const)(
    "accepts the %s queryEngine",
    queryEngine => {
      const connection = {
        id: createConnectionId(),
        connection: { url: createRandomUrlString(), queryEngine },
        schema: { vertices: [], edges: [] },
      };

      expect(parseConnectionFile(connection)).not.toBeNull();
    },
  );

  test("accepts a valid vertex config", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        vertices: [{ type: "Person", attributes: [{ name: "name" }] }],
        edges: [],
      },
    };

    expect(parseConnectionFile(connection)).not.toBeNull();
  });

  test("returns null when a vertex is missing its type", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        vertices: [{ attributes: [{ name: "name" }] }],
        edges: [],
      },
    };

    expect(parseConnectionFile(connection)).toBeNull();
  });

  test("returns null when a vertex attribute is missing its name", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        vertices: [{ type: "Person", attributes: [{ dataType: "string" }] }],
        edges: [],
      },
    };

    expect(parseConnectionFile(connection)).toBeNull();
  });

  test("defaults attributes to an empty array when a vertex omits them", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        vertices: [{ type: "Person" }],
        edges: [],
      },
    };

    const result = parseConnectionFile(connection);

    expect(result?.schema.vertices[0].attributes).toStrictEqual([]);
  });

  test("defaults attributes to an empty array when an edge omits them", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        vertices: [],
        edges: [{ type: "knows" }],
      },
    };

    const result = parseConnectionFile(connection);

    expect(result?.schema.edges[0].attributes).toStrictEqual([]);
  });

  test("accepts a valid edge config", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        vertices: [],
        edges: [{ type: "knows", attributes: [{ name: "since" }] }],
      },
    };

    expect(parseConnectionFile(connection)).not.toBeNull();
  });

  test("returns null when an edge is missing its type", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        vertices: [],
        edges: [{ attributes: [{ name: "since" }] }],
      },
    };

    expect(parseConnectionFile(connection)).toBeNull();
  });

  test("returns null when schema.vertices is missing", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: { edges: [] },
    };

    expect(parseConnectionFile(connection)).toBeNull();
  });

  test("returns null when schema.edges is missing", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: { vertices: [] },
    };

    expect(parseConnectionFile(connection)).toBeNull();
  });

  test("coerces an ISO lastUpdate string into a Date", () => {
    const connection = {
      id: createConnectionId(),
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

    const result = parseConnectionFile(connection);

    expect(result?.schema.lastUpdate).toBeInstanceOf(Date);
    expect(result?.schema.lastUpdate?.toISOString()).toBe(
      "2024-01-01T12:30:00.000Z",
    );
  });

  test("keeps proxyConnection false on a direct connection", () => {
    const graphDbUrl = createRandomUrlString();
    const connection = {
      id: createConnectionId(),
      connection: {
        graphDbUrl,
        proxyConnection: false,
        queryEngine: "gremlin" as const,
      },
      schema: { vertices: [], edges: [] },
    };

    const result = parseConnectionFile(connection);

    expect(result?.connection).toStrictEqual({
      graphDbUrl,
      proxyConnection: false,
      queryEngine: "gremlin",
    });
  });

  test("parses valid AWS auth fields", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
        awsAuthEnabled: true,
        awsRegion: "us-west-2",
        serviceType: "neptune-db" as const,
      },
      schema: { vertices: [], edges: [] },
    };

    const result = parseConnectionFile(connection);

    expect(result?.connection.awsAuthEnabled).toBe(true);
    expect(result?.connection.awsRegion).toBe("us-west-2");
    expect(result?.connection.serviceType).toBe("neptune-db");
  });

  test("degrades an invalid awsAuthEnabled to absent, and it must never become true", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
        awsAuthEnabled: "not-a-boolean",
      },
      schema: { vertices: [], edges: [] },
    };

    const result = parseConnectionFile(connection);

    expect(result).not.toBeNull();
    expect(result?.connection.awsAuthEnabled).toBeUndefined();
  });

  test("drops an invalid awsRegion, turns IAM off, and warns while parsing the rest of the file", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        graphDbUrl: createRandomUrlString(),
        queryEngine: "gremlin" as const,
        awsAuthEnabled: true,
        awsRegion: 12345,
        serviceType: "neptune-db" as const,
      },
      schema: { vertices: [], edges: [] },
    };

    const result = parseConnectionFile(connection);

    expect(result).not.toBeNull();
    expect(result?.connection.awsRegion).toBeUndefined();
    expect(result?.connection.serviceType).toBe("neptune-db");
    expect(result?.connection.awsAuthEnabled).toBe(false);
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  test("drops an invalid serviceType, turns IAM off, and warns while parsing the rest of the file", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        graphDbUrl: createRandomUrlString(),
        queryEngine: "gremlin" as const,
        awsAuthEnabled: true,
        awsRegion: "us-west-2",
        serviceType: "not-a-real-service-type",
      },
      schema: { vertices: [], edges: [] },
    };

    const result = parseConnectionFile(connection);

    expect(result).not.toBeNull();
    expect(result?.connection.serviceType).toBeUndefined();
    expect(result?.connection.awsRegion).toBe("us-west-2");
    expect(result?.connection.awsAuthEnabled).toBe(false);
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  test("drops an invalid serviceType without a warning when IAM was not on", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        graphDbUrl: createRandomUrlString(),
        queryEngine: "gremlin" as const,
        serviceType: "not-a-real-service-type",
      },
      schema: { vertices: [], edges: [] },
    };

    const result = parseConnectionFile(connection);

    expect(result).not.toBeNull();
    expect(result?.connection.serviceType).toBeUndefined();
    expect(result?.connection.awsAuthEnabled).toBeUndefined();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  test("keeps IAM on without a warning when awsRegion and serviceType are valid", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        graphDbUrl: createRandomUrlString(),
        queryEngine: "gremlin" as const,
        awsAuthEnabled: true,
        awsRegion: "us-west-2",
        serviceType: "neptune-graph" as const,
      },
      schema: { vertices: [], edges: [] },
    };

    const result = parseConnectionFile(connection);

    expect(result?.connection.awsAuthEnabled).toBe(true);
    expect(result?.connection.awsRegion).toBe("us-west-2");
    expect(result?.connection.serviceType).toBe("neptune-graph");
    expect(logger.warn).not.toHaveBeenCalled();
  });

  test("keeps IAM on without a warning when awsRegion and serviceType are absent", () => {
    const connection = {
      id: createConnectionId(),
      connection: {
        graphDbUrl: createRandomUrlString(),
        queryEngine: "gremlin" as const,
        awsAuthEnabled: true,
      },
      schema: { vertices: [], edges: [] },
    };

    const result = parseConnectionFile(connection);

    expect(result?.connection.awsAuthEnabled).toBe(true);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * Exported connection files predating the unified-proxy model stored the
 * database endpoint in `url` (plus a `proxyConnection` flag) instead of the
 * canonical `graphDbUrl`, and files from even older versions carried
 * additional ad-hoc keys — a `proxyConnection`/`awsRegion` pair on the
 * connection, and `__inferred`/`__matches` on prefix entries — that the
 * current schema no longer defines. `parseConnectionFile` still needs to
 * accept a file with only `url`, still needs to accept a file with only the
 * canonical `graphDbUrl`, and must pass legacy/unknown keys through
 * untouched rather than stripping or rejecting them, since downstream
 * migration (`transformLegacyConnection`) depends on seeing them. An invalid
 * `awsRegion` or `serviceType` on these legacy shapes must still turn IAM off.
 *
 * DO NOT delete or weaken these tests without confirming that no exported
 * file in the wild can still be missing `graphDbUrl` or carrying these
 * legacy keys.
 */
describe("backward compatibility: legacy url/proxyConnection shape in exported files", () => {
  test("returns null when neither graphDbUrl nor url is present", () => {
    const connection = {
      id: createConnectionId(),
      connection: { queryEngine: "gremlin" as const },
      schema: { vertices: [], edges: [] },
    };

    expect(parseConnectionFile(connection)).toBeNull();
  });

  test("accepts a connection with only graphDbUrl and no legacy url", () => {
    const graphDbUrl = "https://neptune.example.com:8182";
    const connection = {
      id: createConnectionId(),
      connection: {
        graphDbUrl,
        queryEngine: "gremlin" as const,
      },
      schema: { vertices: [], edges: [] },
    };

    const result = parseConnectionFile(connection);

    expect(result?.connection.graphDbUrl).toBe(graphDbUrl);
  });

  test("keeps unknown styling and legacy keys in the parsed output", () => {
    const connection = {
      id: createConnectionId(),
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

    const result = parseConnectionFile(connection);
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

  const legacyProxyShapes = [
    {
      shape: "url only",
      endpoints: () => ({ url: "https://neptune.example.com:8182" }),
    },
    {
      shape: "url and graphDbUrl",
      endpoints: () => ({
        url: "https://proxy.example.com",
        graphDbUrl: "https://neptune.example.com:8182",
      }),
    },
  ];

  const invalidSigningTargets = [
    {
      field: "awsRegion",
      signingTarget: { awsRegion: 12345, serviceType: "neptune-db" },
      kept: { serviceType: "neptune-db" },
    },
    {
      field: "serviceType",
      signingTarget: {
        awsRegion: "us-west-2",
        serviceType: "not-a-real-service-type",
      },
      kept: { awsRegion: "us-west-2" },
    },
  ];

  describe.each(legacyProxyShapes)(
    "legacy proxy file with $shape",
    ({ endpoints }) => {
      test.each(invalidSigningTargets)(
        "drops an invalid $field, turns IAM off, and warns",
        ({ signingTarget, kept }) => {
          const connection = {
            id: createConnectionId(),
            connection: {
              ...endpoints(),
              proxyConnection: true,
              queryEngine: "gremlin" as const,
              awsAuthEnabled: true,
              ...signingTarget,
            },
            schema: { vertices: [], edges: [] },
          };

          const result = parseConnectionFile(connection);

          expect(result?.connection).toStrictEqual({
            ...endpoints(),
            proxyConnection: true,
            queryEngine: "gremlin",
            awsAuthEnabled: false,
            ...kept,
          });
          expect(logger.warn).toHaveBeenCalledOnce();
        },
      );

      test.each(invalidSigningTargets)(
        "drops an invalid $field without a warning when IAM was off",
        ({ signingTarget, kept }) => {
          const connection = {
            id: createConnectionId(),
            connection: {
              ...endpoints(),
              proxyConnection: true,
              queryEngine: "gremlin" as const,
              awsAuthEnabled: false,
              ...signingTarget,
            },
            schema: { vertices: [], edges: [] },
          };

          const result = parseConnectionFile(connection);

          expect(result?.connection).toStrictEqual({
            ...endpoints(),
            proxyConnection: true,
            queryEngine: "gremlin",
            awsAuthEnabled: false,
            ...kept,
          });
          expect(logger.warn).not.toHaveBeenCalled();
        },
      );
    },
  );
});
