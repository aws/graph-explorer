import { act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createEdgeType, createVertexType } from "@/core";
import {
  createRandomEdgeTypeConfig,
  createRandomVertexTypeConfig,
  DbState,
  FakeExplorer,
  renderHookWithState,
} from "@/utils/testing";

import { useSchemaSync } from "./useSchemaSync";

describe("useSchemaSync", () => {
  let explorer: FakeExplorer;

  beforeEach(() => {
    explorer = new FakeExplorer();
  });

  /** Creates a DbState with the given vertex and edge types in the schema. */
  function createStateWithSchema(
    vertexTypes: ReturnType<typeof createVertexType>[],
    edgeTypes: ReturnType<typeof createEdgeType>[],
  ) {
    const state = new DbState(explorer);
    state.activeSchema.vertices = vertexTypes.map(type => ({
      type,
      attributes: [],
    }));
    state.activeSchema.edges = edgeTypes.map(type => ({
      type,
      attributes: [],
    }));
    // Clear edge connections so the query will fetch
    state.activeSchema.edgeConnections = undefined;
    return state;
  }

  describe("schemaDiscoveryQuery", () => {
    it("should use initialData from active schema without fetching", () => {
      const vertexType = createVertexType("Person");
      const edgeType = createEdgeType("knows");
      const state = createStateWithSchema([vertexType], [edgeType]);

      const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      expect(result.current.schemaDiscoveryQuery.data?.vertices).toHaveLength(
        1,
      );
      expect(result.current.schemaDiscoveryQuery.data?.edges).toHaveLength(1);
      expect(fetchSchemaSpy).not.toHaveBeenCalled();
    });

    it("should fetch schema when no active schema exists", () => {
      const state = new DbState(explorer).withNoActiveSchema();

      const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      expect(result.current.schemaDiscoveryQuery.data).toBeUndefined();
      expect(fetchSchemaSpy).toHaveBeenCalled();
    });
  });

  describe("edgeDiscoveryQuery", () => {
    it("should fetch edge connections when schema has edges", () => {
      const edgeType = createEdgeType("knows");
      const state = createStateWithSchema([], [edgeType]);

      const fetchEdgeConnectionsSpy = vi.spyOn(
        explorer,
        "fetchEdgeConnections",
      );

      renderHookWithState(() => useSchemaSync(), state);

      expect(fetchEdgeConnectionsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ edgeTypes: [edgeType] }),
        expect.anything(),
      );
    });

    it("should not call explorer when schema has no edges", () => {
      const state = createStateWithSchema([], []);

      const fetchEdgeConnectionsSpy = vi.spyOn(
        explorer,
        "fetchEdgeConnections",
      );

      renderHookWithState(() => useSchemaSync(), state);

      // Query is enabled but returns early without calling explorer
      expect(fetchEdgeConnectionsSpy).not.toHaveBeenCalled();
    });

    it("should not fetch edge connections when no active schema exists", () => {
      const state = new DbState(explorer).withNoActiveSchema();

      const fetchEdgeConnectionsSpy = vi.spyOn(
        explorer,
        "fetchEdgeConnections",
      );

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      expect(result.current.edgeDiscoveryQuery.fetchStatus).toBe("idle");
      expect(fetchEdgeConnectionsSpy).not.toHaveBeenCalled();
    });
  });

  describe("isFetching", () => {
    it("should be false when neither query is fetching", async () => {
      const state = createStateWithSchema([], []);
      // Set edge connections so edge discovery doesn't run
      state.activeSchema.edgeConnections = [];

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });
    });

    it("should be true when schema discovery is fetching", () => {
      const state = new DbState(explorer).withNoActiveSchema();

      // Make fetchSchema hang to keep isFetching true
      vi.spyOn(explorer, "fetchSchema").mockImplementation(
        () => new Promise(() => {}),
      );

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      expect(result.current.isFetching).toBe(true);
    });

    it("should be true when edge discovery is fetching", () => {
      const edgeType = createEdgeType("knows");
      const state = createStateWithSchema([], [edgeType]);

      // Make fetchEdgeConnections hang to keep isFetching true
      vi.spyOn(explorer, "fetchEdgeConnections").mockImplementation(
        () => new Promise(() => {}),
      );

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      expect(result.current.isFetching).toBe(true);
    });
  });

  describe("refreshSchema", () => {
    it("should refetch schema discovery query", async () => {
      const state = createStateWithSchema([], []);
      const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      // Initial render doesn't fetch because initialData is provided
      expect(fetchSchemaSpy).not.toHaveBeenCalled();

      await act(async () => {
        await result.current.refreshSchema();
      });

      expect(fetchSchemaSpy).toHaveBeenCalledTimes(1);
    });

    it("should refetch edge discovery query", async () => {
      const edgeType = createEdgeType("worksAt");
      const state = createStateWithSchema([], [edgeType]);
      const fetchEdgeConnectionsSpy = vi.spyOn(
        explorer,
        "fetchEdgeConnections",
      );

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      await waitFor(() => {
        expect(fetchEdgeConnectionsSpy).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        await result.current.refreshSchema();
      });

      expect(fetchEdgeConnectionsSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("enabled callback", () => {
    it("should not fetch schema when lastSyncFail is true", () => {
      const state = new DbState(explorer);
      state.activeSchema.lastSyncFail = true;

      const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      // Should use initialData but not fetch
      expect(result.current.schemaDiscoveryQuery.data).toBeDefined();
      expect(fetchSchemaSpy).not.toHaveBeenCalled();
    });

    it("should fetch schema when lastSyncFail is false", () => {
      const state = new DbState(explorer).withNoActiveSchema();

      const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");

      renderHookWithState(() => useSchemaSync(), state);

      expect(fetchSchemaSpy).toHaveBeenCalled();
    });

    it("should allow manual refresh even when lastSyncFail is true", async () => {
      const state = new DbState(explorer);
      state.activeSchema.lastSyncFail = true;
      state.activeSchema.vertices = [createRandomVertexTypeConfig()];
      state.activeSchema.edges = [createRandomEdgeTypeConfig()];

      const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");

      const { result } = renderHookWithState(() => useSchemaSync(), state);

      // Auto-fetch should be disabled
      expect(fetchSchemaSpy).not.toHaveBeenCalled();

      // Manual refresh should still work
      await act(async () => {
        await result.current.refreshSchema();
      });

      expect(fetchSchemaSpy).toHaveBeenCalledTimes(1);
    });
  });
});
