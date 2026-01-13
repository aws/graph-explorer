import { createRandomName, createRandomUrlString } from "@shared/utils/testing";
import { describe, expect, test } from "vitest";

import { createNewConfigurationId } from "@/core/ConfigurationProvider/types";

import isValidConfigurationFile from "./isValidConfigurationFile";

describe("isValidConfigurationFile", () => {
  test("should return true for valid configuration", () => {
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

    expect(isValidConfigurationFile(validConfig)).toBe(true);
  });

  test("should return false when id is missing", () => {
    const config = {
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

    expect(isValidConfigurationFile(config)).toBe(false);
  });

  test("should return false when connection is missing", () => {
    const config = {
      id: createNewConfigurationId(),
      schema: {
        totalVertices: 0,
        vertices: [],
        totalEdges: 0,
        edges: [],
      },
    };

    expect(isValidConfigurationFile(config)).toBe(false);
  });

  test("should return false when schema is missing", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
    };

    expect(isValidConfigurationFile(config)).toBe(false);
  });

  test("should return false when connection.url is missing", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        queryEngine: "gremlin" as const,
      },
      schema: {
        totalVertices: 0,
        vertices: [],
        totalEdges: 0,
        edges: [],
      },
    };

    expect(isValidConfigurationFile(config)).toBe(false);
  });

  test("should return false when connection.queryEngine is missing", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
      },
      schema: {
        totalVertices: 0,
        vertices: [],
        totalEdges: 0,
        edges: [],
      },
    };

    expect(isValidConfigurationFile(config)).toBe(false);
  });

  test("should return false for invalid URL", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: "not-a-valid-url",
        queryEngine: "gremlin" as const,
      },
      schema: {
        totalVertices: 0,
        vertices: [],
        totalEdges: 0,
        edges: [],
      },
    };

    expect(isValidConfigurationFile(config)).toBe(false);
  });

  test("should return false for non-http(s) URL", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: "ftp://example.com",
        queryEngine: "gremlin" as const,
      },
      schema: {
        totalVertices: 0,
        vertices: [],
        totalEdges: 0,
        edges: [],
      },
    };

    expect(isValidConfigurationFile(config)).toBe(false);
  });

  test("should return true for http URL", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: "http://example.com",
        queryEngine: "gremlin" as const,
      },
      schema: {
        totalVertices: 0,
        vertices: [],
        totalEdges: 0,
        edges: [],
      },
    };

    expect(isValidConfigurationFile(config)).toBe(true);
  });

  test("should return true for https URL", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: "https://example.com",
        queryEngine: "gremlin" as const,
      },
      schema: {
        totalVertices: 0,
        vertices: [],
        totalEdges: 0,
        edges: [],
      },
    };

    expect(isValidConfigurationFile(config)).toBe(true);
  });

  test("should return false for invalid queryEngine", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "invalid-engine",
      },
      schema: {
        totalVertices: 0,
        vertices: [],
        totalEdges: 0,
        edges: [],
      },
    };

    expect(isValidConfigurationFile(config)).toBe(false);
  });

  test("should return true for gremlin queryEngine", () => {
    const config = {
      id: createNewConfigurationId(),
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

    expect(isValidConfigurationFile(config)).toBe(true);
  });

  test("should return true for openCypher queryEngine", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "openCypher" as const,
      },
      schema: {
        totalVertices: 0,
        vertices: [],
        totalEdges: 0,
        edges: [],
      },
    };

    expect(isValidConfigurationFile(config)).toBe(true);
  });

  test("should return true for sparql queryEngine", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "sparql" as const,
      },
      schema: {
        totalVertices: 0,
        vertices: [],
        totalEdges: 0,
        edges: [],
      },
    };

    expect(isValidConfigurationFile(config)).toBe(true);
  });

  test("should return true with valid vertex config", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        totalVertices: 1,
        vertices: [
          {
            type: "Person",
            attributes: [{ name: "name" }, { name: "age" }],
          },
        ],
        totalEdges: 0,
        edges: [],
      },
    };

    expect(isValidConfigurationFile(config)).toBe(true);
  });

  test("should return false when vertex is missing type", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        totalVertices: 1,
        vertices: [
          {
            attributes: [{ name: "name" }],
          },
        ],
        totalEdges: 0,
        edges: [],
      },
    };

    expect(isValidConfigurationFile(config)).toBe(false);
  });

  test("should return false when vertex attribute is missing name", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        totalVertices: 1,
        vertices: [
          {
            type: "Person",
            attributes: [{ name: "name" }, { dataType: "string" }],
          },
        ],
        totalEdges: 0,
        edges: [],
      },
    };

    expect(isValidConfigurationFile(config)).toBe(false);
  });

  test("should return true with valid edge config", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        totalVertices: 0,
        vertices: [],
        totalEdges: 1,
        edges: [
          {
            type: "knows",
            attributes: [{ name: "since" }],
          },
        ],
      },
    };

    expect(isValidConfigurationFile(config)).toBe(true);
  });

  test("should return false when edge is missing type", () => {
    const config = {
      id: createNewConfigurationId(),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "gremlin" as const,
      },
      schema: {
        totalVertices: 0,
        vertices: [],
        totalEdges: 1,
        edges: [
          {
            attributes: [{ name: "since" }],
          },
        ],
      },
    };

    expect(isValidConfigurationFile(config)).toBe(false);
  });

  test("should return true with complex valid configuration", () => {
    const config = {
      id: createNewConfigurationId(),
      displayLabel: "Production Database",
      connection: {
        url: "https://neptune.example.com:8182",
        queryEngine: "gremlin" as const,
      },
      schema: {
        totalVertices: 100,
        vertices: [
          {
            type: "Person",
            displayLabel: "Person",
            attributes: [
              { name: "name", dataType: "string" },
              { name: "age", dataType: "integer" },
            ],
          },
          {
            type: "Company",
            displayLabel: "Company",
            attributes: [{ name: "name", dataType: "string" }],
          },
        ],
        totalEdges: 50,
        edges: [
          {
            type: "worksAt",
            displayLabel: "Works At",
            attributes: [{ name: "since", dataType: "date" }],
          },
        ],
      },
    };

    expect(isValidConfigurationFile(config)).toBe(true);
  });
});
