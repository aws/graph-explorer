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
import { DbState, renderHookWithState } from "@/utils/testing";

import { useImportConnectionFile } from "./useImportConnectionFile";

const mockResetState = vi.fn();
vi.mock("@/core/StateProvider/useResetState", () => ({
  default: () => mockResetState,
}));

describe("useImportConnectionFile", () => {
  test("should import valid configuration file", async () => {
    const state = new DbState();
    const { result } = renderHookWithState(
      () => useImportConnectionFile(),
      state,
    );

    const displayLabel = createRandomName("Config");
    const url = createRandomUrlString();
    const validConfig = {
      id: createNewConfigurationId(),
      displayLabel,
      connection: {
        url,
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

    const configs = getAppStore().get(configurationAtom);
    expect(configs.size).toBe(2);

    const schemas = getAppStore().get(schemaAtom);
    expect(schemas.size).toBe(2);

    const activeConfigId = getAppStore().get(activeConfigurationAtom);
    expect(activeConfigId).not.toBe(state.activeConfig.id);

    const importedConfig = Array.from(configs.values()).find(
      c => c.id !== state.activeConfig.id,
    );
    expect(importedConfig?.displayLabel).toBe(displayLabel);
    expect(importedConfig?.connection?.url).toBe(url);
    expect(importedConfig?.connection?.queryEngine).toBe("gremlin");

    const importedSchema = Array.from(schemas.values()).find(
      (_, index) => index === 1,
    );
    expect(importedSchema?.vertices).toHaveLength(1);
    expect(importedSchema?.vertices[0].type).toBe("Person");
    expect(importedSchema?.edges).toHaveLength(1);
    expect(importedSchema?.edges[0].type).toBe("knows");

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

    const configs = getAppStore().get(configurationAtom);
    expect(configs.size).toBe(2);

    const activeConfigId = getAppStore().get(activeConfigurationAtom);
    expect(activeConfigId).not.toBe(state.activeConfig.id);
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

    const schemas = getAppStore().get(schemaAtom);
    const importedSchema = Array.from(schemas.values()).find(
      (_, index) => index === 1,
    );

    expect(importedSchema?.prefixes).toStrictEqual([
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

    const schemas = getAppStore().get(schemaAtom);
    const importedSchema = Array.from(schemas.values()).find(
      (_, index) => index === 1,
    );

    expect(importedSchema?.lastUpdate).toBeInstanceOf(Date);
    expect(importedSchema?.lastUpdate?.toISOString()).toBe(
      lastUpdate.toISOString(),
    );
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

    const schemas = getAppStore().get(schemaAtom);
    const importedSchema = Array.from(schemas.values()).find(
      (_, index) => index === 1,
    );

    expect(importedSchema?.vertices).toStrictEqual([]);
    expect(importedSchema?.edges).toStrictEqual([]);
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

    const schemas = getAppStore().get(schemaAtom);
    const importedSchema = Array.from(schemas.values()).find(
      (_, index) => index === 1,
    );

    expect(importedSchema?.vertices).toHaveLength(2);
    expect(importedSchema?.vertices[0].type).toBe("Person");
    expect(importedSchema?.vertices[0].attributes).toHaveLength(2);
    expect(importedSchema?.vertices[1].type).toBe("Company");

    expect(importedSchema?.edges).toHaveLength(2);
    expect(importedSchema?.edges[0].type).toBe("worksAt");
    expect(importedSchema?.edges[1].type).toBe("knows");
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

    const schemas = getAppStore().get(schemaAtom);
    const importedSchema = Array.from(schemas.values()).find(
      (_, index) => index === 1,
    );

    expect(importedSchema?.edgeConnections).toStrictEqual([
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

    const schemas = getAppStore().get(schemaAtom);
    const importedSchema = Array.from(schemas.values()).find(
      (_, index) => index === 1,
    );

    // Both prefixes should be imported successfully
    expect(importedSchema?.prefixes).toHaveLength(2);
    expect(importedSchema?.prefixes?.[0].prefix).toBe("rdf");
    expect(importedSchema?.prefixes?.[0].uri).toBe(
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    );
    expect(importedSchema?.prefixes?.[1].prefix).toBe("custom");
    expect(importedSchema?.prefixes?.[1].uri).toBe(
      "http://custom.example.com/",
    );
  });
});
