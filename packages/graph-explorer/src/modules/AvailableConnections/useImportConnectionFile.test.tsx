// @vitest-environment happy-dom
import { createRandomName, createRandomUrlString } from "@shared/utils/testing";
import { act } from "@testing-library/react";
import { toast } from "sonner";
import { describe, expect, test, vi } from "vitest";

import {
  activeConfigurationAtom,
  configurationAtom,
  createNewConfigurationId,
  getAppStore,
  schemaAtom,
} from "@/core";
import {
  DbState,
  legacyExportedConnectionFile,
  renderHookWithState,
} from "@/utils/testing";

import { useImportConnectionFile } from "./useImportConnectionFile";

const mockResetState = vi.fn();
vi.mock("@/core/StateProvider/useResetState", () => ({
  default: () => mockResetState,
}));

/**
 * Reads the connection that import just activated. Import assigns a fresh id,
 * makes it active, and keys both the config and schema maps by that id, so the
 * active id is the single handle for everything that was imported.
 */
function getImportedConnection() {
  const store = getAppStore();
  const importedId = store.get(activeConfigurationAtom);
  expect.assert(importedId);
  const config = store.get(configurationAtom).get(importedId);
  const schema = store.get(schemaAtom).get(importedId);
  expect.assert(config);
  expect.assert(schema);
  return { importedId, config, schema };
}

describe("useImportConnectionFile", () => {
  test("should import valid configuration file", async () => {
    const state = new DbState();
    const { result } = renderHookWithState(
      () => useImportConnectionFile(),
      state,
    );

    const displayLabel = createRandomName("Config");
    const graphDbUrl = createRandomUrlString();
    const validConfig = {
      id: createNewConfigurationId(),
      displayLabel,
      connection: {
        graphDbUrl,
        queryEngine: "gremlin" as const,
      },
      schema: {
        totalVertices: 1,
        vertices: [{ type: "Person", attributes: [{ name: "name" }] }],
        totalEdges: 1,
        edges: [{ type: "knows", attributes: [{ name: "since" }] }],
      },
    };

    const file = new File([JSON.stringify(validConfig)], "connection.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current(file);
    });

    expect(getAppStore().get(configurationAtom).size).toBe(2);
    expect(getAppStore().get(schemaAtom).size).toBe(2);

    const { importedId, config, schema } = getImportedConnection();
    expect(importedId).not.toBe(state.activeConfig.id);

    expect(config.displayLabel).toBe(displayLabel);
    expect(config.connection?.graphDbUrl).toBe(graphDbUrl);
    expect(config.connection?.queryEngine).toBe("gremlin");

    expect(schema.vertices).toHaveLength(1);
    expect(schema.vertices[0].type).toBe("Person");
    expect(schema.edges).toHaveLength(1);
    expect(schema.edges[0].type).toBe("knows");

    expect(mockResetState).toHaveBeenCalledOnce();
  });

  test("should migrate a legacy connection file with url and proxyConnection", async () => {
    const state = new DbState();
    const { result } = renderHookWithState(
      () => useImportConnectionFile(),
      state,
    );

    // A direct (non-proxy) connection exported before the unified-proxy model
    // stored the database endpoint in `url`, not `graphDbUrl`.
    const url = createRandomUrlString();
    const legacyConfig = {
      id: createNewConfigurationId(),
      displayLabel: createRandomName("Config"),
      connection: {
        url,
        proxyConnection: false,
        queryEngine: "gremlin" as const,
      },
      schema: {
        totalVertices: 0,
        vertices: [],
        totalEdges: 0,
        edges: [],
      },
    };

    const file = new File([JSON.stringify(legacyConfig)], "connection.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current(file);
    });

    const { config } = getImportedConnection();
    expect(config.connection?.graphDbUrl).toBe(url);
    // The legacy fields are folded away during migration.
    expect(config.connection).not.toHaveProperty("url");
    expect(config.connection).not.toHaveProperty("proxyConnection");
    expect(mockResetState).toHaveBeenCalledOnce();
  });

  test("should reject invalid configuration file", async () => {
    const state = new DbState();
    const { result } = renderHookWithState(
      () => useImportConnectionFile(),
      state,
    );

    const invalidConfig = {
      displayLabel: createRandomName("Config"),
    };

    const file = new File([JSON.stringify(invalidConfig)], "connection.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current(file);
    });

    const configs = getAppStore().get(configurationAtom);
    expect(configs.size).toBe(1);

    expect(toast.error).toHaveBeenCalledWith("Invalid File", {
      description: "The connection file is not valid",
    });
    expect(mockResetState).not.toHaveBeenCalled();
  });

  test("should create new ID to avoid collisions", async () => {
    const state = new DbState();
    const { result } = renderHookWithState(
      () => useImportConnectionFile(),
      state,
    );

    const validConfig = {
      id: state.activeConfig.id,
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

    const file = new File([JSON.stringify(validConfig)], "connection.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current(file);
    });

    expect(getAppStore().get(configurationAtom).size).toBe(2);

    const { importedId } = getImportedConnection();
    expect(importedId).not.toBe(state.activeConfig.id);
  });

  test("should handle schema with prefixes", async () => {
    const state = new DbState();
    const { result } = renderHookWithState(
      () => useImportConnectionFile(),
      state,
    );

    const validConfig = {
      id: createNewConfigurationId(),
      displayLabel: createRandomName("Config"),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "sparql" as const,
      },
      schema: {
        totalVertices: 0,
        vertices: [],
        totalEdges: 0,
        edges: [],
        prefixes: [
          {
            prefix: "rdf",
            uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
          },
        ],
      },
    };

    const file = new File([JSON.stringify(validConfig)], "connection.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current(file);
    });

    const { schema } = getImportedConnection();

    expect(schema.prefixes).toStrictEqual([
      {
        prefix: "rdf",
        uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      },
    ]);
  });

  test("should handle schema with lastUpdate date", async () => {
    const state = new DbState();
    const { result } = renderHookWithState(
      () => useImportConnectionFile(),
      state,
    );

    const lastUpdate = new Date("2024-01-01T00:00:00Z");
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
        lastUpdate: lastUpdate.toISOString(),
      },
    };

    const file = new File([JSON.stringify(validConfig)], "connection.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current(file);
    });

    const { schema } = getImportedConnection();

    expect(schema.lastUpdate).toBeInstanceOf(Date);
    expect(schema.lastUpdate?.toISOString()).toBe(lastUpdate.toISOString());
  });

  test("should handle empty schema arrays", async () => {
    const state = new DbState();
    const { result } = renderHookWithState(
      () => useImportConnectionFile(),
      state,
    );

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

    const file = new File([JSON.stringify(validConfig)], "connection.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current(file);
    });

    const { schema } = getImportedConnection();

    expect(schema.vertices).toStrictEqual([]);
    expect(schema.edges).toStrictEqual([]);
  });

  test("should handle file with complex schema", async () => {
    const state = new DbState();
    const { result } = renderHookWithState(
      () => useImportConnectionFile(),
      state,
    );

    const validConfig = {
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
          {
            type: "knows",
            displayLabel: "Knows",
            attributes: [],
          },
        ],
      },
    };

    const file = new File([JSON.stringify(validConfig)], "connection.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current(file);
    });

    const { schema } = getImportedConnection();

    expect(schema.vertices).toHaveLength(2);
    expect(schema.vertices[0].type).toBe("Person");
    expect(schema.vertices[0].attributes).toHaveLength(2);
    expect(schema.vertices[1].type).toBe("Company");

    expect(schema.edges).toHaveLength(2);
    expect(schema.edges[0].type).toBe("worksAt");
    expect(schema.edges[1].type).toBe("knows");
  });

  test("should import edgeConnections from file", async () => {
    const state = new DbState();
    const { result } = renderHookWithState(
      () => useImportConnectionFile(),
      state,
    );

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
        edgeConnections: [
          {
            edgeType: "knows",
            sourceVertexType: "Person",
            targetVertexType: "Person",
          },
          {
            edgeType: "worksAt",
            sourceVertexType: "Person",
            targetVertexType: "Company",
            count: 42,
          },
        ],
      },
    };

    const file = new File([JSON.stringify(validConfig)], "connection.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current(file);
    });

    const { schema } = getImportedConnection();

    expect(schema.edgeConnections).toStrictEqual([
      {
        edgeType: "knows",
        sourceVertexType: "Person",
        targetVertexType: "Person",
      },
      {
        edgeType: "worksAt",
        sourceVertexType: "Person",
        targetVertexType: "Company",
        count: 42,
      },
    ]);
  });
});

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * Exported configuration files from older versions may contain a `__matches`
 * array on prefix entries. That property has been removed from PrefixTypeConfig,
 * but previously exported files may still contain it. These tests verify that
 * importing such files still works correctly — the extra property is harmlessly
 * carried through without breaking the import flow.
 *
 * DO NOT delete or weaken these tests without confirming that all exported
 * files in the wild have been re-exported or that the old shape is no longer
 * a concern.
 */
describe("backward compatibility: legacy __matches in exported files", () => {
  test("should import file with legacy __matches array on prefixes", async () => {
    const state = new DbState();
    const { result } = renderHookWithState(
      () => useImportConnectionFile(),
      state,
    );

    // This mirrors the shape of a file exported by an older version that
    // serialized __matches as an array.
    const legacyConfig = {
      id: createNewConfigurationId(),
      displayLabel: createRandomName("Config"),
      connection: {
        url: createRandomUrlString(),
        queryEngine: "sparql" as const,
      },
      schema: {
        totalVertices: 0,
        vertices: [],
        totalEdges: 0,
        edges: [],
        prefixes: [
          {
            prefix: "rdf",
            uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            __inferred: true,
            __matches: [
              "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
              "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property",
            ],
          },
          {
            prefix: "custom",
            uri: "http://custom.example.com/",
          },
        ],
      },
    };

    const file = new File([JSON.stringify(legacyConfig)], "connection.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current(file);
    });

    const { schema } = getImportedConnection();

    // Both prefixes should be imported successfully
    expect(schema.prefixes).toStrictEqual([
      {
        prefix: "rdf",
        uri: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        __inferred: true,
        __matches: [
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property",
        ],
      },
      {
        prefix: "custom",
        uri: "http://custom.example.com/",
      },
    ]);
  });
});

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * Exported connection files have, across every released version, bundled the
 * full schema inside the top-level envelope: `{ id, displayLabel, connection,
 * schema }`. Import must split this envelope — routing `connection` into
 * `configurationAtom` and `schema` into `schemaAtom` — and must never write the
 * schema into the config entry (`RawConfiguration.schema`).
 *
 * This pins that split for a faithful, real-world-shaped export (styled vertex
 * and edge type configs, both `lucide:` and base64 data-URI icons, an ISO
 * `lastUpdate`, and `edgeConnections`). It guards against a refactor that
 * decouples the file envelope type from `RawConfiguration` accidentally
 * dropping schema data or leaking it back into the config entry.
 *
 * DO NOT delete or weaken this test without confirming that exported files in
 * the wild are no longer a concern.
 */
describe("backward compatibility: legacy exported connection file with embedded schema", () => {
  test("splits the bundled schema into schemaAtom and keeps it out of the config entry", async () => {
    const state = new DbState();
    const { result } = renderHookWithState(
      () => useImportConnectionFile(),
      state,
    );

    const file = new File(
      [JSON.stringify(legacyExportedConnectionFile)],
      "connection.json",
      { type: "application/json" },
    );

    await act(async () => {
      await result.current(file);
    });

    const { config: importedConfig, schema: importedSchema } =
      getImportedConnection();

    // The connection lands in the config entry. Legacy proxy fields (`url`,
    // `proxyConnection`) are folded into the canonical `graphDbUrl` on import;
    // the remaining fields are preserved.
    expect(importedConfig.displayLabel).toBe(
      legacyExportedConnectionFile.displayLabel,
    );
    expect(importedConfig.connection).toMatchObject({
      graphDbUrl: legacyExportedConnectionFile.connection.graphDbUrl,
      queryEngine: legacyExportedConnectionFile.connection.queryEngine,
      awsAuthEnabled: legacyExportedConnectionFile.connection.awsAuthEnabled,
      serviceType: legacyExportedConnectionFile.connection.serviceType,
      awsRegion: legacyExportedConnectionFile.connection.awsRegion,
    });
    expect(importedConfig.connection).not.toHaveProperty("url");
    expect(importedConfig.connection).not.toHaveProperty("proxyConnection");

    // The schema must NOT be stored on the config entry — it belongs in
    // schemaAtom. `RawConfiguration` no longer declares a `schema` field, so we
    // probe for a stray one to prove import never writes it back.
    expect((importedConfig as { schema?: unknown }).schema).toBeUndefined();

    // The full schema is split out into schemaAtom, styling and all.
    expect(importedSchema.vertices.map(v => v.type)).toStrictEqual([
      "movie",
      "person",
    ]);
    expect(importedSchema.edges.map(e => e.type)).toStrictEqual([
      "actedIn",
      "directed",
    ]);

    // Styling and icon data (including the base64 data-URI icon) survive intact.
    const movie = importedSchema.vertices.find(v => v.type === "movie");
    expect.assert(movie);
    expect(movie.iconUrl).toBe("lucide:clapperboard");
    expect(movie.color).toBe("#5947e6");
    const person = importedSchema.vertices.find(v => v.type === "person");
    expect.assert(person);
    expect(person.iconUrl).toBe(
      legacyExportedConnectionFile.schema.vertices[1].iconUrl,
    );

    // The ISO date string is revived into a real Date.
    expect(importedSchema.lastUpdate).toBeInstanceOf(Date);
    expect(importedSchema.lastUpdate?.toISOString()).toBe(
      legacyExportedConnectionFile.schema.lastUpdate,
    );

    // Edge connections come across with their optional count preserved.
    expect(importedSchema.edgeConnections).toStrictEqual(
      legacyExportedConnectionFile.schema.edgeConnections,
    );

    expect(mockResetState).toHaveBeenCalledOnce();
  });
});
